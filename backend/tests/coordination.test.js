const { test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const mongoose = require('mongoose');
const { MongoMemoryReplSet } = require('mongodb-memory-server');
const User = require('../models/User');
const Broadcast = require('../models/Broadcast');
const Outreach = require('../models/DonorOutreach');
const Commitment = require('../models/DonorCommitment');
const Log = require('../models/EscalationLog');
const Notification = require('../models/Notification');
const coordinator = require('../services/coordinator');
const { policyFromEnv, validCoordinates, freshLocation } = require('../services/coordinationPolicy');
const { normalizeLocation } = require('../services/location');
const { runOnce, dispatchPending } = require('../jobs/coordination');

let database;
let serial = 0;
let now;
const policy = () => {
  const p = policyFromEnv({});
  p.normal.waitSeconds = 10; p.normal.batchSize = 2; p.requestCooldownSeconds = 1;
  return p;
};
const later = seconds => new Date(+now + seconds * 1000);
async function user(overrides = {}) {
  serial += 1;
  return User.create({ fullName: `Test ${serial}`, phone: `90000${String(serial).padStart(5, '0')}`,
    password: 'test-only-hash', bloodGroup: 'O+', district: 'Test district',
    location: { lat: 0, lng: 0.01, source: 'device', updatedAt: now, accuracyMeters: 20 }, ...overrides });
}
async function request(owner, overrides = {}, p = policy()) {
  return coordinator.createRequest(owner._id, { bloodGroup: 'O+', hospital: 'Test hospital', district: 'Test district',
    hospitalLocation: { lat: 0, lng: 0 }, candidateTarget: 1, urgency: 'normal', ...overrides }, { policy: p, now });
}
async function offer(b, donor) { return coordinator.act(b._id, donor._id, 'willing', {}, now); }
async function select(b, owner, donor) { return coordinator.act(b._id, owner._id, 'select', { donorId: String(donor._id) }, now); }

before(async () => {
  // This test creates its own isolated replica set; it never reads MONGO_URI.
  database = await MongoMemoryReplSet.create({ binary: { downloadDir: path.resolve(__dirname, '../node_modules/.cache/mongodb-memory-server') }, replSet: { count: 1 } });
  await mongoose.connect(database.getUri(), { dbName: 'lifelink_coordination_test' });
  await coordinator.initialize();
});
after(async () => { await mongoose.disconnect(); if (database) await database.stop(); });
beforeEach(async () => {
  now = new Date();
  for (const model of [User, Broadcast, Outreach, Commitment, Log, Notification]) await model.deleteMany({});
});

test('location validation accepts zero and rejects stale, imprecise or forged fixes', () => {
  assert.equal(validCoordinates({ lat: 0, lng: 0 }), true);
  assert.equal(validCoordinates({ lat: null, lng: 0 }), false);
  assert.throws(() => normalizeLocation({ lat: 91, lng: 0 }));
  assert.throws(() => normalizeLocation({ lat: 0, lng: 0, source: 'device', measuredAt: later(60), accuracyMeters: 20 }, now));
  const oldClient = normalizeLocation({ lat: 0, lng: 0, updatedAt: now }, now);
  assert.equal(oldClient.updatedAt, null);
  assert.equal(freshLocation(oldClient, now, policy()), false);
  const fix = normalizeLocation({ lat: 0, lng: 0, source: 'device', accuracyMeters: 20, measuredAt: now }, now);
  assert.equal(freshLocation(fix, now, policy()), true);
  assert.equal(freshLocation({ ...fix, accuracyMeters: 1500 }, now, policy()), false);
  assert.equal(freshLocation({ ...fix, updatedAt: later(-90000) }, now, policy()), false);
  assert.equal(freshLocation(normalizeLocation({ lat: 0, lng: 0, source: 'manual' }, now), now, policy()), true);
  assert.throws(() => policyFromEnv({ COORDINATION_RADII: '10,5,50' }));
});

test('empty nearby pools expand immediately; hospital is the centre', async () => {
  const owner = await user({ location: { lat: 20, lng: 20 } });
  const donor = await user({ location: { lat: 0, lng: 0.12, source: 'manual', updatedAt: now } });
  const b = await request(owner);
  const result = await coordinator.evaluate(b._id, now);
  assert.equal(result.radiusKm, 20);
  assert.equal(await Outreach.countDocuments({ donor: donor._id }), 1);
  assert.equal(await Log.countDocuments({ request: b._id }), 4);
  assert.equal(result.nextEvaluationAt.getTime(), +later(10));
});

test('parallel evaluations create one invitation and one durable notification per donor', async () => {
  const owner = await user(); await user(); await user();
  const b = await request(owner);
  await Promise.all([coordinator.evaluate(b._id, now), coordinator.evaluate(b._id, now)]);
  assert.equal(await Outreach.countDocuments(), 2);
  assert.equal(await Notification.countDocuments(), 2);
  assert.equal(await Notification.countDocuments({ coordinationRequest: true }), 2);
  await coordinator.evaluate(b._id, later(1));
  assert.equal(await Outreach.countDocuments(), 2);
  const result = await coordinator.evaluate(b._id, later(11));
  assert.equal(result.searchStatus, 'exhausted');
  assert.equal(result.radiusKm, 50);
  assert.equal(await Outreach.countDocuments({ state: 'no_response' }), 2);
  await coordinator.act(b._id, owner._id, 'resume', {}, later(12));
  await coordinator.evaluate(b._id, later(12));
  assert.equal(await Notification.countDocuments(), 2);
});

test('only fresh, available, compatible, unbanned, opted-in donors are invited', async () => {
  const owner = await user(); const eligible = await user();
  await user({ isBanned: true }); await user({ isAvailable: false }); await user({ bloodGroup: 'A+' });
  await user({ notifPrefs: { bloodRequests: false } });
  await user({ location: { lat: 0, lng: 0.01, source: 'device', updatedAt: later(-90000), accuracyMeters: 10 } });
  await user({ location: { lat: 0, lng: 0.01, source: 'device', updatedAt: now, accuracyMeters: 2000 } });
  const b = await request(owner); await coordinator.evaluate(b._id, now);
  assert.equal(await Outreach.countDocuments(), 1);
  assert.equal(String((await Outreach.findOne()).donor), String(eligible._id));
});

test('willing is not completed; selection pauses, withdrawal resumes without repeat alerts', async () => {
  const owner = await user(); const donor = await user(); const backup = await user();
  const b = await request(owner); await coordinator.evaluate(b._id, now); await offer(b, donor);
  assert.equal(await Outreach.countDocuments({ state: 'completed' }), 0);
  let result = await select(b, owner, donor);
  assert.equal(result.searchStatus, 'paused_target');
  assert.equal(await Commitment.countDocuments(), 1);
  result = await coordinator.act(b._id, donor._id, 'withdraw', {}, later(1));
  assert.equal(result.searchStatus, 'searching'); assert.equal(await Commitment.countDocuments(), 0);
  await offer(b, backup); await select(b, owner, backup);
  await coordinator.act(b._id, owner._id, 'complete', { donors: [String(backup._id)] }, later(2));
  assert.equal(await Outreach.countDocuments({ state: 'completed' }), 1);
  assert.equal(await Outreach.countDocuments({ state: 'withdrawn' }), 1);
  assert.equal(await Commitment.countDocuments(), 0);
  await assert.rejects(() => coordinator.act(b._id, owner._id, 'complete', { donors: [String(backup._id)] }), { status: 409 });
  assert.equal(await Outreach.countDocuments({ state: 'completed' }), 1);
});

test('withdrawal preserves a requester manual pause', async () => {
  const owner = await user(); const donor = await user(); const b = await request(owner);
  await coordinator.evaluate(b._id, now); await offer(b, donor); await select(b, owner, donor);
  await coordinator.act(b._id, owner._id, 'pause', {}, now);
  const result = await coordinator.act(b._id, donor._id, 'withdraw', {}, later(1));
  assert.equal(result.searchStatus, 'paused_manual'); assert.equal(result.nextEvaluationAt, null);
});

test('two requesters cannot concurrently select the same donor', async () => {
  const a = await user({ isAvailable: false }); const b = await user({ isAvailable: false }); const donor = await user();
  const first = await request(a); const second = await request(b);
  await coordinator.evaluate(first._id, now); await coordinator.evaluate(second._id, now);
  await offer(first, donor); await offer(second, donor);
  const results = await Promise.allSettled([select(first, a, donor), select(second, b, donor)]);
  assert.equal(results.filter(r => r.status === 'fulfilled').length, 1);
  assert.equal(results.find(r => r.status === 'rejected').reason.status, 409);
  assert.equal(await Commitment.countDocuments(), 1);
  assert.equal(await Outreach.countDocuments({ state: 'selected' }), 1);
});

test('daily donor cap survives concurrent requests', async () => {
  const a = await user({ isAvailable: false }); const b = await user({ isAvailable: false }); const donor = await user();
  const p = policy(); p.dailyAlertLimit = 1;
  const first = await request(a, {}, p); const second = await request(b, {}, p);
  await Promise.all([coordinator.evaluate(first._id, now), coordinator.evaluate(second._id, now)]);
  assert.equal(await Outreach.countDocuments({ donor: donor._id }), 1);
  assert.equal((await User.findById(donor._id)).coordinationAlertCount, 1);
});

test('a willing donor selected elsewhere does not stall this search', async () => {
  const a = await user({ isAvailable: false }); const b = await user({ isAvailable: false }); const donor = await user();
  const first = await request(a); const second = await request(b);
  await coordinator.evaluate(first._id, now); await coordinator.evaluate(second._id, now);
  await offer(first, donor); await offer(second, donor); await select(first, a, donor);
  const result = await coordinator.evaluate(second._id, later(11));
  assert.equal(result.searchStatus, 'exhausted');
  assert.equal(result.radiusKm, 50);
});

test('expiry releases commitments even while paused; cancellation does too', async () => {
  const owner = await user(); const donor = await user(); const b = await request(owner);
  await coordinator.evaluate(b._id, now); await offer(b, donor); await select(b, owner, donor);
  await runOnce(null, new Date(+b.coordinationDeadline + 1));
  assert.equal((await Broadcast.findById(b._id)).status, 'expired');
  assert.equal(await Commitment.countDocuments(), 0);
  await assert.rejects(() => coordinator.act(b._id, donor._id, 'withdraw'), { status: 409 });
  const owner2 = await user(); const next = await request(owner2);
  await coordinator.evaluate(next._id, now); await offer(next, donor); await select(next, owner2, donor);
  await coordinator.act(next._id, owner2._id, 'cancel', {}, now);
  assert.equal(await Commitment.countDocuments(), 0);
});

test('participant views hide contacts until selection and never reveal donor GPS', async () => {
  const owner = await user(); const donor = await user(); const outsider = await user({ isAvailable: false });
  const b = await request(owner); await coordinator.evaluate(b._id, now); await offer(b, donor);
  await assert.rejects(() => coordinator.detail(b._id, outsider._id), { status: 403 });
  let view = await coordinator.detail(b._id, owner._id);
  assert.equal(view.donors[0].phone, undefined); assert.equal(view.donors[0].location, undefined);
  assert.equal((await coordinator.detail(b._id, donor._id)).requesterPhone, undefined);
  await select(b, owner, donor);
  view = await coordinator.detail(b._id, owner._id); assert.equal(view.donors[0].phone, donor.phone);
  assert.equal((await coordinator.detail(b._id, donor._id)).requesterPhone, owner.phone);
  await coordinator.act(b._id, donor._id, 'withdraw', {}, now);
  assert.equal((await coordinator.detail(b._id, owner._id)).donors[0].phone, undefined);
});

test('late offers are accepted, but completion accepts only explicitly selected donors', async () => {
  const owner = await user(); const donor = await user(); const other = await user();
  const b = await request(owner, { candidateTarget: 2 });
  await coordinator.evaluate(b._id, now); await coordinator.evaluate(b._id, later(11));
  await offer(b, donor); await offer(b, other);
  await assert.rejects(() => coordinator.act(b._id, owner._id, 'complete', { donors: [String(donor._id)] }, now), { status: 409 });
  await select(b, owner, donor); await select(b, owner, other);
  await coordinator.act(b._id, owner._id, 'complete', { donors: [String(donor._id)] }, now);
  assert.equal(await Outreach.countDocuments({ state: 'completed' }), 1);
  assert.equal(await Commitment.countDocuments(), 0);
});

test('persistent stage, policy and notification delivery survive worker recreation', async () => {
  const owner = await user(); await user(); const b = await request(owner);
  await runOnce(null, now);
  delete require.cache[require.resolve('../jobs/coordination')];
  const restarted = require('../jobs/coordination');
  await restarted.runOnce(null, later(1));
  assert.equal(await Outreach.countDocuments(), 1);
  const events = []; const io = { to: room => ({ emit: (event, payload) => events.push({ room, event, payload }) }) };
  await dispatchPending(io); await dispatchPending(io);
  assert.equal(events.filter(e => e.event === 'new_notification').length, 1);
  assert.ok(events.every(e => e.room.startsWith('user:')));
  assert.equal((await Outreach.findOne()).deliveryAttempts, 1);
  await restarted.runOnce(null, later(11));
  assert.equal((await Broadcast.findById(b._id)).searchStatus, 'exhausted');
});

test('request cooldown and action ownership are enforced', async () => {
  const owner = await user(); const donor = await user(); const b = await request(owner);
  await assert.rejects(() => request(owner), { status: 429 });
  await assert.rejects(() => coordinator.act(b._id, donor._id, 'cancel'), { status: 403 });
  await assert.rejects(() => coordinator.act(b._id, donor._id, 'willing'), { status: 403 });
  await assert.rejects(() => request(donor, { hospitalLocation: { lat: '0', lng: 0 } }), { status: 400 });
});

test('HTTP endpoints reject reset tokens and prevent legacy routes bypassing coordination', async () => {
  const express = require('express'); const jwt = require('jsonwebtoken');
  process.env.JWT_SECRET = 'test-only-coordination-secret';
  const owner = await user(); const b = await request(owner);
  const app = express(); app.use(express.json());
  app.use('/api/coordination', require('../routes/coordination'));
  app.use('/api/broadcasts', require('../routes/broadcast'));
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const token = jwt.sign({ userId: String(owner._id) }, process.env.JWT_SECRET, { expiresIn: '1h' });
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  try {
    assert.equal((await fetch(`${base}/api/coordination`)).status, 401);
    const reset = jwt.sign({ userId: String(owner._id), purpose: 'reset' }, process.env.JWT_SECRET, { expiresIn: '1h' });
    assert.equal((await fetch(`${base}/api/coordination`, { headers: { Authorization: `Bearer ${reset}` } })).status, 401);
    assert.equal((await fetch(`${base}/api/coordination/${b._id}`, { headers })).status, 200);
    const location = await (await fetch(`${base}/api/coordination/location`, { headers })).json();
    assert.equal(location.eligibleLocation, true);
    assert.equal((await fetch(`${base}/api/coordination/location`, { method: 'PATCH', headers,
      body: JSON.stringify({ lat: 0, lng: 0, source: 'manual' }) })).status, 200);
    const saved = await (await fetch(`${base}/api/coordination/location`, { headers })).json();
    assert.equal(saved.location.lat, 0);
    assert.equal(saved.location.source, 'manual');
    assert.equal(saved.eligibleLocation, true);
    assert.deepEqual(await (await fetch(`${base}/api/broadcasts`, { headers })).json(), []);
    assert.equal((await fetch(`${base}/api/broadcasts/${b._id}/status`, { method: 'PATCH', headers, body: JSON.stringify({ status: 'fulfilled' }) })).status, 409);
    assert.equal((await fetch(`${base}/api/broadcasts/${b._id}/respond`, { method: 'POST', headers })).status, 409);
    assert.equal((await Broadcast.findById(b._id)).status, 'active');
  } finally { await new Promise(resolve => server.close(resolve)); }
});

test('rankings and personal achievements count completed donors, not willing or selected donors', async () => {
  const express = require('express'); const jwt = require('jsonwebtoken');
  process.env.JWT_SECRET = 'completion-test-secret';
  const owner = await user(); const donor = await user(); const other = await user();
  const b = await request(owner, { candidateTarget: 2 });
  await coordinator.evaluate(b._id, now); await offer(b, donor); await offer(b, other);
  await select(b, owner, donor); await select(b, owner, other);
  const app = express(); app.use('/leaderboard', require('../routes/leaderboard')); app.use('/users', require('../routes/users'));
  const server = app.listen(0, '127.0.0.1'); await new Promise(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const headers = { Authorization: `Bearer ${jwt.sign({ userId: String(donor._id) }, process.env.JWT_SECRET, { expiresIn: '1h' })}` };
  try {
    assert.equal((await (await fetch(`${base}/leaderboard`, { headers })).json()).leaderboard.length, 0);
    await coordinator.act(b._id, owner._id, 'complete', { donors: [String(donor._id)] }, now);
    const ranks = await (await fetch(`${base}/leaderboard`, { headers })).json();
    assert.equal(ranks.leaderboard.length, 1); assert.equal(ranks.leaderboard[0].donorId, String(donor._id));
    assert.equal(ranks.stats.completedDonations, 1);
    const stats = await (await fetch(`${base}/users/mystats`, { headers })).json();
    assert.equal(stats.completedDonations, 1);
    const reset = jwt.sign({ userId: String(donor._id), purpose: 'reset' }, process.env.JWT_SECRET, { expiresIn: '1h' });
    assert.equal((await fetch(`${base}/users/mystats`, { headers: { Authorization: `Bearer ${reset}` } })).status, 401);
  } finally { await new Promise(resolve => server.close(resolve)); }
});
