const mongoose = require('mongoose');
const { randomUUID } = require('crypto');
const Broadcast = require('../models/Broadcast');
const User = require('../models/User');
const Outreach = require('../models/DonorOutreach');
const Commitment = require('../models/DonorCommitment');
const Log = require('../models/EscalationLog');
const Notification = require('../models/Notification');
const { policyFromEnv, validCoordinates, distanceKm, freshLocation, candidateGroups } = require('./coordinationPolicy');

function fail(status, message) { const error = new Error(message); error.status = status; throw error; }
const same = (a, b) => String(a) === String(b);
const objectId = id => { if (!mongoose.isValidObjectId(id)) fail(400, 'Invalid ID'); return id; };

async function transaction(work) {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => { result = await work(session); });
    return result;
  } catch (err) {
    if (err.code === 11000) fail(409, 'This donor is already committed or this action was already recorded. Refresh and try again.');
    throw err;
  } finally { await session.endSession(); }
}

// Writing the same request first serializes owner, donor and worker operations.
// MongoDB retries write conflicts; unique indexes also protect across requests.
async function lockRequest(id, session) {
  const b = await Broadcast.findOneAndUpdate({ _id: objectId(id), coordinationVersion: 1 },
    { $inc: { coordinationRevision: 1 } }, { new: true, session });
  if (!b) fail(404, 'Request not found');
  return b;
}

async function log(b, reason, session, alertedCount = 0) {
  await Log.create([{ request: b._id, decisionId: randomUUID(), radiusKm: b.radiusKm, reason, alertedCount }], { session });
}

async function close(b, status, session) {
  b.status = status;
  b.searchStatus = 'stopped';
  b.nextEvaluationAt = null;
  await Commitment.deleteMany({ request: b._id }).session(session);
  await log(b, `Request ${status}; commitments released`, session);
  await b.save({ session });
  return b;
}

async function initialize() {
  // Transactions require Atlas or another replica set; never silently degrade.
  const hello = await mongoose.connection.db.admin().command({ hello: 1 });
  if (!hello.setName && hello.msg !== 'isdbgrid') throw new Error('Donor coordination requires a MongoDB replica set (such as Atlas)');
  for (const model of [Broadcast, User, Outreach, Commitment, Log, Notification]) await model.init();
}

async function createRequest(userId, input, { policy = policyFromEnv(), now = new Date() } = {}) {
  const { bloodGroup, hospital, district, hospitalLocation, urgency = 'normal', candidateTarget = 1, units = 1, state = '', message = '' } = input;
  if (!validCoordinates(hospitalLocation)) fail(400, 'Select the hospital location');
  if (typeof hospital !== 'string' || !hospital.trim() || hospital.length > 200 || typeof district !== 'string' || !district.trim() || district.length > 100) fail(400, 'Hospital and district are required (maximum 200 and 100 characters)');
  if (typeof state !== 'string' || state.length > 100 || typeof message !== 'string' || message.length > 300) fail(400, 'Invalid state or message');
  if (!['normal', 'urgent', 'critical'].includes(urgency)) fail(400, 'Invalid urgency');
  if (typeof bloodGroup !== 'string' || !bloodGroup || !Broadcast.schema.path('bloodGroup').enumValues.includes(bloodGroup)) fail(400, 'Choose a blood group');
  if (!Number.isInteger(candidateTarget) || candidateTarget < 1 || candidateTarget > 10 || !Number.isInteger(units) || units < 1 || units > 10) fail(400, 'Donors needed and units must each be between 1 and 10');
  return transaction(async session => {
    const user = await User.findOneAndUpdate({ _id: objectId(userId), isBanned: { $ne: true },
      $or: [{ lastCoordinationRequestAt: null }, { lastCoordinationRequestAt: { $lte: new Date(+now - policy.requestCooldownSeconds * 1000) } }] },
    { $set: { lastCoordinationRequestAt: now } }, { new: true, session });
    if (!user) fail(429, 'Please wait before posting another request, or check your account');
    const deadline = new Date(+now + ({ normal: 48, urgent: 24, critical: 6 }[urgency]) * 3600000);
    const stage = policy[urgency].startStage;
    const [b] = await Broadcast.create([{
      requestedBy: user._id, requesterName: user.fullName, requesterPhone: user.phone,
      bloodGroup, hospital: hospital.trim(), district: district.trim(), hospitalLocation, urgency, candidateTarget, units, state, message,
      coordinationVersion: 1, coordinationPolicy: policy, coordinationDeadline: deadline, expiresAt: deadline,
      searchStatus: 'searching', searchStage: stage, radiusKm: policy.radii[stage], nextEvaluationAt: now,
    }], { session });
    await log(b, `Search queued around hospital at ${b.radiusKm} km`, session);
    return b;
  });
}

async function evaluate(id, now = new Date()) {
  return transaction(async session => {
    const b = await lockRequest(id, session);
    if (b.status !== 'active') return b;
    if (b.coordinationDeadline <= now) return close(b, 'expired', session, now);
    if (b.searchStatus !== 'searching' || !b.nextEvaluationAt || b.nextEvaluationAt > now) return b;
    const p = b.coordinationPolicy;
    const settings = p[b.urgency];
    const waitUntil = () => new Date(Math.min(+b.coordinationDeadline, +now + settings.waitSeconds * 1000));
    await Outreach.updateMany({ request: b._id, state: 'notified', notifiedAt: { $lte: new Date(+now - settings.waitSeconds * 1000) } }, { $set: { state: 'no_response' } }).session(session);
    const selected = await Outreach.countDocuments({ request: b._id, state: 'selected' }).session(session);
    const offers = await Outreach.find({ request: b._id, state: 'willing' }).select('donor').session(session).lean();
    const busy = await Commitment.find({ request: { $ne: b._id }, expiresAt: { $gt: now } }).select('donor').session(session).lean();
    const busyIds = new Set(busy.map(c => String(c.donor)));
    const willing = await User.countDocuments({ _id: { $in: offers.map(o => o.donor).filter(id => !busyIds.has(String(id))) },
      isAvailable: true, isBanned: { $ne: true } }).session(session);
    if (selected >= b.candidateTarget) {
      b.searchStatus = 'paused_target'; b.nextEvaluationAt = null;
      await log(b, 'Enough donors selected; alerts paused', session);
      await b.save({ session }); return b;
    }
    if (selected + willing >= b.candidateTarget) {
      b.nextEvaluationAt = waitUntil();
      await log(b, 'Enough offers received; waiting for requester selection', session);
      await b.save({ session }); return b;
    }
    const previous = await Outreach.find({ request: b._id }).select('donor').session(session).lean();
    const commitments = await Commitment.find({ expiresAt: { $gt: now } }).select('donor').session(session).lean();
    const excluded = [b.requestedBy, ...previous.map(o => o.donor), ...commitments.map(c => c.donor)];
    const day = now.toISOString().slice(0, 10); // UTC daily budget
    const candidates = await User.find({ _id: { $nin: excluded }, isAvailable: true, isBanned: { $ne: true },
      bloodGroup: { $in: candidateGroups(b.bloodGroup) }, 'notifPrefs.bloodRequests': { $ne: false },
      'location.updatedAt': { $gte: new Date(+now - p.locationMaxAgeSeconds * 1000), $lte: now },
      $or: [{ coordinationAlertDay: { $ne: day } }, { coordinationAlertCount: { $lt: p.dailyAlertLimit } }],
    }).select('_id location coordinationAlertDay coordinationAlertCount').session(session).lean();
    // Prototype: in-memory distance calculation over fresh compatible candidates.
    // No donor coordinates leave this service. A geo index is a later scaling step.
    const ranked = candidates.filter(d => freshLocation(d.location, now, p))
      .map(d => ({ ...d, distance: distanceKm(b.hospitalLocation, d.location) }))
      .filter(d => d.distance <= 50).sort((a, c) => a.distance - c.distance || String(a._id).localeCompare(String(c._id)));
    while (true) {
      const batch = ranked.filter(d => d.distance <= b.radiusKm).slice(0, settings.batchSize);
      if (batch.length) {
        for (const donor of batch) {
          // Updating this user inside the transaction serializes the daily cap
          // with other requests. A conflicting transaction retries its query.
          await User.updateOne({ _id: donor._id }, { $set: { coordinationAlertDay: day,
            coordinationAlertCount: donor.coordinationAlertDay === day ? donor.coordinationAlertCount + 1 : 1 } }).session(session);
          await Outreach.create([{ request: b._id, donor: donor._id, notifiedAt: now,
            approximateDistanceKm: Math.round(donor.distance), locationSource: donor.location.source,
            locationRecordedAt: donor.location.updatedAt }], { session });
          await Notification.create([{ userId: donor._id, type: 'new_broadcast', broadcastId: b._id, coordinationRequest: true,
            title: `${b.bloodGroup} donor request at ${b.hospital}`, body: 'Open donor coordination to offer help or mark unavailable.' }], { session });
        }
        b.nextEvaluationAt = waitUntil();
        await log(b, `Invited ${batch.length} new donors within ${b.radiusKm} km; response window started`, session, batch.length);
        break;
      }
      if (b.searchStage === p.radii.length - 1) {
        b.searchStatus = 'exhausted'; b.nextEvaluationAt = null;
        await log(b, 'Automated search exhausted: no more eligible, unalerted donors within 50 km; use the blood-bank directory', session);
        break;
      }
      const oldRadius = b.radiusKm;
      b.searchStage += 1; b.radiusKm = p.radii[b.searchStage];
      await log(b, `No remaining eligible, unalerted donors within ${oldRadius} km; expanded to ${b.radiusKm} km`, session);
    }
    await b.save({ session }); return b;
  });
}

async function act(id, actorId, action, data = {}, now = new Date()) {
  return transaction(async session => {
    const b = await lockRequest(id, session);
    if (b.status !== 'active' || b.coordinationDeadline <= now) fail(409, 'This request has ended');
    const owner = same(b.requestedBy, actorId);
    if (['pause', 'resume', 'select', 'cancel', 'complete'].includes(action)) {
      if (!owner) fail(403, 'Only the requester can do this');
    } else if (!['willing', 'declined', 'withdraw'].includes(action)) fail(400, 'Unknown action');
    if (action === 'cancel') return close(b, 'cancelled', session, now);
    if (action === 'complete') {
      if (!Array.isArray(data.donors) || !data.donors.length || data.donors.length > 10 || new Set(data.donors).size !== data.donors.length) fail(400, 'Choose the selected donors who actually donated');
      data.donors.forEach(objectId);
      const selected = await Outreach.find({ request: b._id, state: 'selected', donor: { $in: data.donors } }).session(session);
      if (selected.length !== data.donors.length) fail(409, 'Only selected donors can be recorded as completed');
      await Outreach.updateMany({ _id: { $in: selected.map(o => o._id) } }, { $set: { state: 'completed', completedAt: now, completedBy: actorId } }).session(session);
      // Do not increment legacy donationCount: reporting will use the completed records.
      return close(b, 'fulfilled', session, now);
    }
    if (action === 'pause') {
      b.searchStatus = 'paused_manual'; b.nextEvaluationAt = null;
    } else if (action === 'resume') {
      const selected = await Outreach.countDocuments({ request: b._id, state: 'selected' }).session(session);
      if (selected >= b.candidateTarget) fail(409, 'Enough donors are already selected');
      b.searchStatus = 'searching'; b.searchStage = b.coordinationPolicy[b.urgency].startStage;
      b.radiusKm = b.coordinationPolicy.radii[b.searchStage]; b.nextEvaluationAt = now;
    } else if (action === 'select') {
      const offer = await Outreach.findOne({ request: b._id, donor: objectId(data.donorId), state: 'willing' }).session(session);
      if (!offer) fail(409, 'This donor has not offered help, or is no longer willing');
      const donor = await User.findOne({ _id: data.donorId, isBanned: { $ne: true }, isAvailable: true }).session(session);
      if (!donor) fail(409, 'Donor is unavailable');
      const count = await Outreach.countDocuments({ request: b._id, state: 'selected' }).session(session);
      if (count >= b.candidateTarget) fail(409, 'Donor target is already reached');
      await Commitment.deleteMany({ donor: donor._id, expiresAt: { $lte: now } }).session(session);
      await Commitment.create([{ donor: donor._id, request: b._id, expiresAt: b.coordinationDeadline }], { session });
      offer.state = 'selected'; offer.selectedAt = now; await offer.save({ session });
      if (count + 1 >= b.candidateTarget && b.searchStatus !== 'paused_manual') {
        b.searchStatus = 'paused_target'; b.nextEvaluationAt = null;
      }
    } else {
      const offer = await Outreach.findOne({ request: b._id, donor: objectId(actorId) }).session(session);
      if (!offer || owner) fail(403, 'You were not invited to this request');
      if (action === 'withdraw') {
        if (!['willing', 'selected'].includes(offer.state)) fail(409, 'Only a willing or selected donor can withdraw');
        const wasSelected = offer.state === 'selected';
        offer.state = 'withdrawn'; offer.withdrawnAt = now;
        await Commitment.deleteMany({ request: b._id, donor: actorId }).session(session);
        if (wasSelected && b.searchStatus !== 'paused_manual') {
          b.searchStatus = 'searching'; b.searchStage = b.coordinationPolicy[b.urgency].startStage;
          b.radiusKm = b.coordinationPolicy.radii[b.searchStage]; b.nextEvaluationAt = now;
        }
      } else {
        if (!['notified', 'no_response'].includes(offer.state)) fail(409, 'Your response has already been recorded');
        offer.state = action; offer.respondedAt = now;
      }
      await offer.save({ session });
    }
    await log(b, `Action: ${action}`, session);
    await b.save({ session }); return b;
  });
}

function summary(b, owner) {
  return { _id: b._id, owner, bloodGroup: b.bloodGroup, units: b.units, hospital: b.hospital,
    district: b.district, urgency: b.urgency, candidateTarget: b.candidateTarget,
    status: b.status, searchStatus: b.searchStatus, radiusKm: b.radiusKm,
    coordinationDeadline: b.coordinationDeadline, createdAt: b.createdAt };
}

async function list(userId) {
  const invited = await Outreach.find({ donor: userId }).sort({ createdAt: -1 }).limit(100).select('request state').lean();
  const rows = await Broadcast.find({ coordinationVersion: 1, $or: [{ requestedBy: userId }, { _id: { $in: invited.map(o => o.request) } }] })
    .sort({ createdAt: -1 }).limit(100).lean();
  return rows.map(b => ({ ...summary(b, same(b.requestedBy, userId)), donorState: invited.find(o => same(o.request, b._id))?.state }));
}

async function detail(id, userId) {
  const b = await Broadcast.findOne({ _id: objectId(id), coordinationVersion: 1 }).lean();
  if (!b) fail(404, 'Request not found');
  const owner = same(b.requestedBy, userId);
  const mine = owner ? null : await Outreach.findOne({ request: id, donor: userId }).lean();
  if (!owner && !mine) fail(403, 'Only request participants can view this request');
  const result = { ...summary(b, owner), hospitalLocation: b.hospitalLocation,
    message: b.message, nextEvaluationAt: b.nextEvaluationAt };
  const offers = owner ? await Outreach.find({ request: id }).populate('donor', 'fullName bloodGroup phone').lean() : [mine];
  result.donors = offers.map(o => ({ donorId: owner ? o.donor?._id : userId,
    name: owner ? o.donor?.fullName || 'Deleted account' : undefined,
    bloodGroup: owner ? o.donor?.bloodGroup : undefined,
    state: o.state, approximateDistanceKm: o.approximateDistanceKm,
    locationSource: o.locationSource, locationRecordedAt: o.locationRecordedAt,
    locationStale: !o.locationRecordedAt || Date.now() - new Date(o.locationRecordedAt) > b.coordinationPolicy.locationMaxAgeSeconds * 1000,
    ...(owner && o.state === 'selected' && b.status === 'active' && b.coordinationDeadline > new Date() ? { phone: o.donor?.phone } : {}),
  }));
  if (owner) {
    result.counts = { alerted: offers.length, willing: offers.filter(o => o.state === 'willing').length, selected: offers.filter(o => o.state === 'selected').length, completed: offers.filter(o => o.state === 'completed').length };
    result.timeline = await Log.find({ request: id }).sort({ createdAt: 1, _id: 1 }).select('radiusKm alertedCount reason createdAt').lean();
  } else if (mine.state === 'selected' && b.status === 'active' && b.coordinationDeadline > new Date()) {
    result.requesterPhone = b.requesterPhone;
  }
  return result;
}

async function emitUpdate(io, id) {
  if (!io) return;
  const b = await Broadcast.findById(id).select('requestedBy').lean();
  if (!b) return;
  const recipients = await Outreach.find({ request: id }).select('donor').lean();
  for (const recipient of [b.requestedBy, ...recipients.map(o => o.donor)]) {
    io.to(`user:${recipient}`).emit('coordination_updated', { requestId: String(id) });
  }
}

module.exports = { initialize, createRequest, evaluate, act, list, detail, emitUpdate };
