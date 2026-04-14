/**
 * Escalation job — runs every 5 minutes.
 * If an active broadcast has 0 responses and was created > 10 min ago
 * and hasn't been escalated yet → bump urgency to 'critical' and re-notify.
 */
const Broadcast = require('../models/Broadcast');
const User = require('../models/User');
const Notification = require('../models/Notification');

const COMPATIBLE_DONORS = {
  'A+':  ['A+','A-','O+','O-'],
  'A-':  ['A-','O-'],
  'B+':  ['B+','B-','O+','O-'],
  'B-':  ['B-','O-'],
  'AB+': ['A+','A-','B+','B-','AB+','AB-','O+','O-'],
  'AB-': ['A-','B-','AB-','O-'],
  'O+':  ['O+','O-'],
  'O-':  ['O-'],
};

async function runEscalation(io) {
  try {
    const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000);

    // Find active broadcasts with 0 responses, older than 10 min, not yet escalated
    const stale = await Broadcast.find({
      status:   'active',
      urgency:  { $ne: 'critical' },
      'responses.0': { $exists: false },
      createdAt: { $lt: tenMinAgo },
      escalated: { $ne: true },
    });

    for (const b of stale) {
      // Bump to critical + mark escalated
      b.urgency   = 'critical';
      b.escalated = true;
      await b.save();

      // Emit real-time update
      if (io) io.emit('broadcast_updated', { broadcastId: b._id, urgency: 'critical', escalated: true });

      // Re-notify compatible available users
      const compatibleGroups = COMPATIBLE_DONORS[b.bloodGroup] || [];
      const donors = await User.find({
        _id: { $ne: b.requestedBy },
        isAvailable: true,
        bloodGroup: { $in: compatibleGroups },
      }).select('_id');

      if (donors.length > 0) {
        const notifDocs = donors.map(d => ({
          userId: d._id,
          type:  'new_broadcast',
          title: `🔴 URGENT: ${b.bloodGroup} blood still needed in ${b.district}`,
          body:  `No donor found yet${b.hospital ? ` at ${b.hospital}` : ''}. Please respond if you can help.`,
          broadcastId: b._id,
        }));
        await Notification.insertMany(notifDocs);

        if (io) {
          donors.forEach(d => {
            io.emit('new_notification', {
              userId: d._id.toString(),
              notification: {
                type:  'new_broadcast',
                title: `🔴 URGENT: ${b.bloodGroup} blood still needed in ${b.district}`,
                body:  `No donor found yet. Please respond if you can help.`,
                broadcastId: b._id,
                createdAt: new Date(),
                read: false,
              },
            });
          });
        }
      }

      console.log(`⚡ Escalated broadcast ${b._id} (${b.bloodGroup} in ${b.district})`);
    }
  } catch (err) {
    console.error('Escalation job error:', err.message);
  }
}

function startEscalationJob(io) {
  // Run immediately on start, then every 5 minutes
  runEscalation(io);
  setInterval(() => runEscalation(io), 5 * 60 * 1000);
  console.log('⏱️  Escalation job started (runs every 5 min)');
}

module.exports = { startEscalationJob };
