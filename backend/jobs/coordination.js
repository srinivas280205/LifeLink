const Broadcast = require('../models/Broadcast');
const Outreach = require('../models/DonorOutreach');
const Notification = require('../models/Notification');
const coordinator = require('../services/coordinator');

async function dispatchPending(io) {
  if (!io) return;
  // The in-app notification was committed with the invitation. Socket delivery
  // is best effort: reconnecting clients reload the persistent inbox and requests.
  for (let i = 0; i < 200; i++) {
    const invitation = await Outreach.findOneAndUpdate({ deliveryState: 'pending' },
      { $set: { deliveryState: 'attempted' }, $inc: { deliveryAttempts: 1 } }, { new: true }).lean();
    if (!invitation) break;
    const b = await Broadcast.findById(invitation.request).select('status coordinationDeadline').lean();
    if (!b || b.status !== 'active' || b.coordinationDeadline <= new Date()) continue;
    const notification = await Notification.findOne({ userId: invitation.donor, broadcastId: invitation.request, type: 'new_broadcast' }).lean();
    io.to(`user:${invitation.donor}`).emit('coordination_updated', { requestId: String(invitation.request) });
    if (notification) io.to(`user:${invitation.donor}`).emit('new_notification', { userId: String(invitation.donor), notification });
  }
}

async function runOnce(io, now = new Date()) {
  const due = await Broadcast.find({ coordinationVersion: 1, status: 'active', $or: [
    { coordinationDeadline: { $lte: now } }, { searchStatus: 'searching', nextEvaluationAt: { $lte: now } },
  ] }).sort({ nextEvaluationAt: 1, _id: 1 }).limit(100).select('_id').lean();
  for (const b of due) {
    try { await coordinator.evaluate(b._id, now); await coordinator.emitUpdate(io, b._id); }
    catch (err) { console.error(`Coordination evaluation ${b._id}:`, err.message); }
  }
  await dispatchPending(io);
}

function startCoordinationJob(io) {
  let running = false;
  const tick = async () => {
    if (running) return;
    running = true;
    try { await runOnce(io); } catch (err) { console.error('Coordination job:', err.message); }
    finally { running = false; }
  };
  tick();
  const timer = setInterval(tick, 5000);
  timer.unref();
  return () => clearInterval(timer);
}

module.exports = { runOnce, dispatchPending, startCoordinationJob };
