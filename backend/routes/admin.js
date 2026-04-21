const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Broadcast = require('../models/Broadcast');
const Notification = require('../models/Notification');

const router = express.Router();

// Auth + admin guard
function adminAuth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ message: 'Invalid token' });
  }
  User.findById(req.user.userId).select('isAdmin').then((u) => {
    if (!u || !u.isAdmin) return res.status(403).json({ message: 'Admin access required' });
    next();
  }).catch(() => res.status(500).json({ message: 'Server error' }));
}

// POST /api/admin/promote — make a user admin using the admin secret
// Usage: POST { phone, secret }
router.post('/promote', async (req, res) => {
  try {
    const { phone, secret } = req.body;
    if (secret !== process.env.ADMIN_SECRET) {
      return res.status(403).json({ message: 'Invalid admin secret' });
    }
    const user = await User.findOneAndUpdate({ phone }, { isAdmin: true }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: `${user.fullName} is now an admin`, user });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/admin/stats — detailed stats
router.get('/stats', adminAuth, async (req, res) => {
  try {
    const [
      totalUsers,
      verifiedUsers,
      usersWithBlood,
      bannedUsers,
      totalBroadcasts,
      activeBroadcasts,
      fulfilledBroadcasts,
      cancelledBroadcasts,
      sosBroadcasts,
      bloodGroupAgg,
      stateAgg,
      recentSignups,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isVerified: true }),
      User.countDocuments({ bloodGroup: { $nin: ['', null] } }),
      User.countDocuments({ isBanned: true }),
      Broadcast.countDocuments(),
      Broadcast.countDocuments({ status: 'active' }),
      Broadcast.countDocuments({ status: 'fulfilled' }),
      Broadcast.countDocuments({ status: 'cancelled' }),
      Broadcast.countDocuments({ isSOS: true }),
      User.aggregate([
        { $match: { bloodGroup: { $nin: ['', null] } } },
        { $group: { _id: '$bloodGroup', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      User.aggregate([
        { $match: { state: { $ne: '' } } },
        { $group: { _id: '$state', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
      User.find().sort({ createdAt: -1 }).limit(5).select('fullName phone bloodGroup state createdAt isVerified').lean(),
    ]);

    const totalResponses = await Broadcast.aggregate([
      { $project: { responseCount: { $size: '$responses' } } },
      { $group: { _id: null, total: { $sum: '$responseCount' } } },
    ]);

    res.json({
      users: { total: totalUsers, verified: verifiedUsers, withBloodGroup: usersWithBlood, banned: bannedUsers },
      broadcasts: {
        total: totalBroadcasts, active: activeBroadcasts,
        fulfilled: fulfilledBroadcasts, cancelled: cancelledBroadcasts, sos: sosBroadcasts,
        totalResponses: totalResponses[0]?.total || 0,
      },
      bloodGroupDistribution: bloodGroupAgg,
      topStates: stateAgg,
      recentSignups,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/admin/users?page=1&search=&bloodGroup=
router.get('/users', adminAuth, async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page) || 1);
    const limit = 20;
    const skip  = (page - 1) * limit;

    const filter = {};
    if (req.query.search) {
      const re = new RegExp(req.query.search, 'i');
      filter.$or = [{ fullName: re }, { phone: re }];
    }
    if (req.query.bloodGroup) filter.bloodGroup = req.query.bloodGroup;
    if (req.query.state)      filter.state      = req.query.state;

    const [users, total] = await Promise.all([
      User.find(filter).select('-password').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      User.countDocuments(filter),
    ]);

    res.json({ users, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/admin/users/export — CSV download (must be BEFORE /users/:id routes)
router.get('/users/export', adminAuth, async (req, res) => {
  try {
    const users = await User.find({}).select('-password').lean();
    const headers = 'Name,Phone,Gender,Blood Group,State,District,Verified,Admin,Banned,Joined';
    const rows = users.map(u => [
      u.fullName, u.phone, u.gender || '', u.bloodGroup || '',
      u.state || '', u.district || '',
      u.isVerified ? 'Yes' : 'No', u.isAdmin ? 'Yes' : 'No', u.isBanned ? 'Yes' : 'No',
      new Date(u.createdAt).toLocaleDateString('en-IN'),
    ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));
    const csv = [headers, ...rows].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="lifelink-users.csv"');
    res.send(csv);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/admin/users/:id/detail — full user profile + broadcast/response counts
router.get('/users/:id/detail', adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password').lean();
    if (!user) return res.status(404).json({ message: 'User not found' });
    const [requestsPosted, responsesGiven] = await Promise.all([
      Broadcast.countDocuments({ requestedBy: user._id }),
      Broadcast.countDocuments({ 'responses.donorId': user._id.toString() }),
    ]);
    res.json({ ...user, requestsPosted, responsesGiven });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/admin/broadcasts?page=1&status=&bloodGroup=
router.get('/broadcasts', adminAuth, async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page) || 1);
    const limit = 20;
    const skip  = (page - 1) * limit;

    const filter = {};
    if (req.query.status)     filter.status     = req.query.status;
    if (req.query.bloodGroup) filter.bloodGroup = req.query.bloodGroup;
    if (req.query.state)      filter.state      = req.query.state;

    const [broadcasts, total] = await Promise.all([
      Broadcast.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Broadcast.countDocuments(filter),
    ]);

    res.json({ broadcasts, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /api/admin/users/:id/verify — toggle verified status
router.patch('/users/:id/verify', adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('isVerified');
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.isVerified = !user.isVerified;
    await user.save();
    res.json({ isVerified: user.isVerified });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/admin/users/:id
router.delete('/users/:id', adminAuth, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    await Notification.deleteMany({ userId: req.params.id });
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /api/admin/broadcasts/:id/cancel
router.patch('/broadcasts/:id/cancel', adminAuth, async (req, res) => {
  try {
    const b = await Broadcast.findByIdAndUpdate(
      req.params.id, { status: 'cancelled' }, { new: true }
    );
    if (!b) return res.status(404).json({ message: 'Not found' });
    const io = req.app.get('io');
    if (io) io.emit('broadcast_updated', { broadcastId: b._id, status: 'cancelled' });
    res.json({ message: 'Broadcast cancelled', broadcast: b });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/admin/broadcasts/:id — hard delete a broadcast
router.delete('/broadcasts/:id', adminAuth, async (req, res) => {
  try {
    await Broadcast.findByIdAndDelete(req.params.id);
    res.json({ message: 'Broadcast deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/admin/announce — send notification to all users
router.post('/announce', adminAuth, async (req, res) => {
  try {
    const { title, body } = req.body;
    if (!title || !body) return res.status(400).json({ message: 'Title and body required' });
    const allUsers = await User.find({}).select('_id').lean();
    const notifs = allUsers.map(u => ({
      userId: u._id,
      type: 'announcement',
      title,
      body,
    }));
    await Notification.insertMany(notifs);
    const io = req.app.get('io');
    if (io) {
      allUsers.forEach(u => {
        io.emit('new_notification', {
          userId: u._id.toString(),
          notification: { type: 'announcement', title, body, createdAt: new Date(), read: false },
        });
      });
    }
    res.json({ message: `Announcement sent to ${allUsers.length} users` });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/admin/users/:id/message — send direct message to a specific user
router.post('/users/:id/message', adminAuth, async (req, res) => {
  try {
    const { title, body } = req.body;
    if (!title || !body) return res.status(400).json({ message: 'Title and body are required' });
    const target = await User.findById(req.params.id).select('_id fullName');
    if (!target) return res.status(404).json({ message: 'User not found' });

    const notif = await Notification.create({
      userId: target._id,
      type: 'admin_dm',
      title,
      body,
    });

    const io = req.app.get('io');
    if (io) {
      io.emit('new_notification', {
        userId: target._id.toString(),
        notification: { ...notif.toObject() },
      });
    }

    res.json({ message: `Message sent to ${target.fullName}` });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /api/admin/users/:id/ban — ban a user
router.patch('/users/:id/ban', adminAuth, async (req, res) => {
  try {
    const { reason } = req.body;
    const u = await User.findById(req.params.id).select('isAdmin fullName isBanned');
    if (!u) return res.status(404).json({ message: 'User not found' });
    if (u.isAdmin) return res.status(400).json({ message: 'Cannot ban an admin user' });
    u.isBanned   = true;
    u.banReason  = reason || 'Violation of community guidelines';
    await u.save();
    res.json({ isBanned: true, banReason: u.banReason, fullName: u.fullName });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /api/admin/users/:id/unban — unban a user
router.patch('/users/:id/unban', adminAuth, async (req, res) => {
  try {
    const u = await User.findById(req.params.id).select('fullName isBanned banReason');
    if (!u) return res.status(404).json({ message: 'User not found' });
    u.isBanned  = false;
    u.banReason = '';
    await u.save();
    res.json({ isBanned: false, fullName: u.fullName });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /api/admin/users/:id/toggle-admin — grant or revoke admin
router.patch('/users/:id/toggle-admin', adminAuth, async (req, res) => {
  try {
    const u = await User.findById(req.params.id).select('isAdmin fullName');
    if (!u) return res.status(404).json({ message: 'User not found' });
    u.isAdmin = !u.isAdmin;
    await u.save();
    res.json({ isAdmin: u.isAdmin, fullName: u.fullName });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/admin/events
router.get('/events', adminAuth, async (req, res) => {
  try {
    const Event = require('../models/Event');
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = 20;
    const skip = (page - 1) * limit;
    const [events, total] = await Promise.all([
      Event.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Event.countDocuments(),
    ]);
    res.json({ events, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/admin/events/:id
router.delete('/events/:id', adminAuth, async (req, res) => {
  try {
    const Event = require('../models/Event');
    await Event.findByIdAndDelete(req.params.id);
    res.json({ message: 'Event deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/admin/activity — recent 15 events (signups + broadcasts)
router.get('/activity', adminAuth, async (req, res) => {
  try {
    const [recentBroadcasts, recentUsers] = await Promise.all([
      Broadcast.find().sort({ createdAt: -1 }).limit(10)
        .select('bloodGroup requesterName district state urgency status isSOS createdAt').lean(),
      User.find().sort({ createdAt: -1 }).limit(10)
        .select('fullName bloodGroup state isVerified createdAt').lean(),
    ]);
    const feed = [
      ...recentBroadcasts.map(b => ({
        type: 'broadcast', time: b.createdAt,
        text: `${b.isSOS ? '🆘 SOS' : '📡'} ${b.bloodGroup} by ${b.requesterName} in ${b.district || b.state || '—'}`,
        status: b.status, urgency: b.urgency,
      })),
      ...recentUsers.map(u => ({
        type: 'signup', time: u.createdAt,
        text: `👤 ${u.fullName} joined${u.bloodGroup ? ` · ${u.bloodGroup}` : ''}${u.state ? ` · ${u.state}` : ''}`,
      })),
    ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 15);
    res.json({ feed });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/admin/stats/trends — daily signups + broadcasts for last 14 days
router.get('/stats/trends', adminAuth, async (req, res) => {
  try {
    const since = new Date();
    since.setDate(since.getDate() - 13);
    since.setHours(0, 0, 0, 0);

    const [userTrend, broadcastTrend] = await Promise.all([
      User.aggregate([
        { $match: { createdAt: { $gte: since } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      Broadcast.aggregate([
        { $match: { createdAt: { $gte: since } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
    ]);

    // Fill all 14 days even if count=0
    const days = [];
    for (let i = 0; i < 14; i++) {
      const d = new Date(since);
      d.setDate(since.getDate() + i);
      days.push(d.toISOString().slice(0, 10));
    }
    const uMap = Object.fromEntries(userTrend.map(r => [r._id, r.count]));
    const bMap = Object.fromEntries(broadcastTrend.map(r => [r._id, r.count]));

    res.json({
      days,
      users:      days.map(d => uMap[d] || 0),
      broadcasts: days.map(d => bMap[d] || 0),
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
