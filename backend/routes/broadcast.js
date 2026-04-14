const express = require('express');
const jwt = require('jsonwebtoken');
const Broadcast = require('../models/Broadcast');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { sendPushToUser } = require('./push');

// Haversine distance in km between two lat/lng points
function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Who can donate to a given blood group
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

const router = express.Router();

function auth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
}

// POST /api/broadcasts — any user can create a broadcast
router.post('/', auth, async (req, res) => {
  try {
    const { bloodGroup, units, state, district, hospital, message, urgency } = req.body;
    if (!bloodGroup || !district) {
      return res.status(400).json({ message: 'Blood group and district are required' });
    }

    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const broadcast = await Broadcast.create({
      requestedBy:    user._id,
      requesterName:  user.fullName,
      requesterPhone: user.phone,
      bloodGroup,
      units:    units || 1,
      state:    state || user.state || '',
      district,
      hospital,
      message,
      urgency:  urgency || 'urgent',
    });

    const io = req.app.get('io');
    if (io) io.emit('new_broadcast', broadcast);

    // Notify all available compatible users who have a blood group set
    const compatibleGroups = COMPATIBLE_DONORS[bloodGroup] || [];
    const potentialDonors = await User.find({
      _id: { $ne: user._id },
      isAvailable: true,
      bloodGroup: { $in: compatibleGroups },
    }).select('_id');

    if (potentialDonors.length > 0) {
      const notifDocs = potentialDonors.map((d) => ({
        userId: d._id,
        type: 'new_broadcast',
        title: `🩸 ${bloodGroup} blood needed in ${district}`,
        body: hospital
          ? `${units || 1} unit(s) required at ${hospital}, ${district}. Tap to respond.`
          : `${units || 1} unit(s) required in ${district}. Tap to respond.`,
        broadcastId: broadcast._id,
      }));
      await Notification.insertMany(notifDocs);

      // Send push notifications (non-blocking)
      const pushPayload = {
        title: `🩸 ${bloodGroup} blood needed in ${district}`,
        body: hospital
          ? `${units || 1} unit(s) at ${hospital}. Tap to respond.`
          : `${units || 1} unit(s) needed in ${district}. Tap to respond.`,
        icon: '/logo.svg',
        badge: '/logo.svg',
        tag: `broadcast-${broadcast._id}`,
        data: { url: '/dashboard' },
      };
      potentialDonors.forEach((d) => {
        sendPushToUser(d._id, pushPayload).catch(() => {/* ignore push errors */});
      });

      if (io) {
        potentialDonors.forEach((d) => {
          io.emit('new_notification', {
            userId: d._id.toString(),
            notification: {
              type: 'new_broadcast',
              title: `🩸 ${bloodGroup} blood needed in ${district}`,
              body: hospital
                ? `${units || 1} unit(s) required at ${hospital}, ${district}.`
                : `${units || 1} unit(s) required.`,
              broadcastId: broadcast._id,
              createdAt: new Date(),
              read: false,
            },
          });
        });
      }
    }

    res.status(201).json({ message: 'Broadcast sent', broadcast });
  } catch (err) {
    console.error('Broadcast error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/broadcasts — list active broadcasts
router.get('/', auth, async (req, res) => {
  try {
    const broadcasts = await Broadcast.find({ status: 'active' })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(broadcasts);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/broadcasts/sos — emergency SOS (GPS radius-based)
router.post('/sos', auth, async (req, res) => {
  try {
    const { bloodGroup, lat, lng, hospital, units, message, radius = 50 } = req.body;
    if (!bloodGroup) return res.status(400).json({ message: 'Blood group required' });
    if (!lat || !lng)  return res.status(400).json({ message: 'Location required for SOS' });

    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const district = user.district || 'Unknown';
    const state    = user.state    || '';

    const broadcast = await Broadcast.create({
      requestedBy:    user._id,
      requesterName:  user.fullName,
      requesterPhone: user.phone,
      bloodGroup,
      units:    units || 1,
      state,
      district,
      hospital: hospital || '',
      message:  message  || '🆘 SOS Emergency — immediate help needed',
      urgency:  'critical',
      isSOS:    true,
      sosLocation: { lat, lng },
      sosRadius:   radius,
    });

    const io = req.app.get('io');
    if (io) io.emit('new_broadcast', broadcast);

    // Find all available compatible users with GPS location, within radius
    const compatibleGroups = COMPATIBLE_DONORS[bloodGroup] || [];
    const allNearby = await User.find({
      _id: { $ne: user._id },
      isAvailable: true,
      bloodGroup: { $in: compatibleGroups },
      'location.lat': { $ne: null },
      'location.lng': { $ne: null },
    }).select('_id fullName location');

    const nearbyDonors = allNearby.filter((d) => {
      if (!d.location?.lat || !d.location?.lng) return false;
      return haversineKm(lat, lng, d.location.lat, d.location.lng) <= radius;
    });

    if (nearbyDonors.length > 0) {
      const notifDocs = nearbyDonors.map((d) => ({
        userId: d._id,
        type:   'new_broadcast',
        title:  `🆘 SOS: ${bloodGroup} blood needed urgently${hospital ? ` at ${hospital}` : ''}`,
        body:   `Emergency within ${radius}km of you. Tap to respond now.`,
        broadcastId: broadcast._id,
      }));
      await Notification.insertMany(notifDocs);

      if (io) {
        nearbyDonors.forEach((d) => {
          io.emit('sos_alert', {
            userId: d._id.toString(),
            broadcast: {
              ...broadcast.toObject(),
              _distanceKm: Math.round(haversineKm(lat, lng, d.location.lat, d.location.lng)),
            },
          });
          io.emit('new_notification', {
            userId: d._id.toString(),
            notification: {
              type:  'new_broadcast',
              title: `🆘 SOS: ${bloodGroup} blood needed urgently`,
              body:  `Emergency within ${radius}km of you. Tap to respond now.`,
              broadcastId: broadcast._id,
              createdAt: new Date(),
              read: false,
            },
          });
        });
      }
    }

    res.status(201).json({
      message: `SOS sent to ${nearbyDonors.length} donor(s) within ${radius}km`,
      broadcast,
      donorsNotified: nearbyDonors.length,
    });
  } catch (err) {
    console.error('SOS error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/broadcasts/:id/respond — any user can respond (except the poster)
router.post('/:id/respond', auth, async (req, res) => {
  try {
    const broadcast = await Broadcast.findById(req.params.id);
    if (!broadcast) return res.status(404).json({ message: 'Broadcast not found' });
    if (broadcast.status !== 'active') {
      return res.status(400).json({ message: 'Broadcast is no longer active' });
    }
    if (broadcast.requestedBy.toString() === req.user.userId) {
      return res.status(400).json({ message: 'You cannot respond to your own request' });
    }

    const user = await User.findById(req.user.userId);
    const alreadyResponded = broadcast.responses.some(
      (r) => r.donorId.toString() === req.user.userId
    );
    if (alreadyResponded) {
      return res.status(400).json({ message: 'You already responded to this request' });
    }

    broadcast.responses.push({
      donorId:    user._id,
      donorName:  user.fullName,
      donorPhone: user.phone,
      bloodGroup: user.bloodGroup,
    });
    await broadcast.save();

    const io = req.app.get('io');
    if (io) io.emit('broadcast_response', {
      broadcastId: broadcast._id,
      donor: { name: user.fullName, phone: user.phone, bloodGroup: user.bloodGroup },
    });

    const notif = await Notification.create({
      userId: broadcast.requestedBy,
      type: 'donor_responded',
      title: `✅ Someone offered to help your ${broadcast.bloodGroup} request`,
      body: `${user.fullName}${user.bloodGroup ? ` (${user.bloodGroup})` : ''} has agreed to donate in ${broadcast.district}.`,
      broadcastId: broadcast._id,
    });
    if (io) {
      io.emit('new_notification', {
        userId: broadcast.requestedBy.toString(),
        notification: {
          type: 'donor_responded',
          title: notif.title,
          body:  notif.body,
          broadcastId: broadcast._id,
          createdAt: notif.createdAt,
          read: false,
        },
      });
    }

    res.json({ message: 'Response sent successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /api/broadcasts/:id/status
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const broadcast = await Broadcast.findById(req.params.id);
    if (!broadcast) return res.status(404).json({ message: 'Not found' });
    if (broadcast.requestedBy.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    broadcast.status = req.body.status;
    await broadcast.save();

    const io = req.app.get('io');
    if (io) io.emit('broadcast_updated', { broadcastId: broadcast._id, status: broadcast.status });

    res.json({ message: 'Status updated', broadcast });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/broadcasts/mine — own broadcasts posted
router.get('/mine', auth, async (req, res) => {
  try {
    const broadcasts = await Broadcast.find({ requestedBy: req.user.userId })
      .sort({ createdAt: -1 }).limit(50);
    res.json(broadcasts);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/broadcasts/myresponses — broadcasts user has responded to
router.get('/myresponses', auth, async (req, res) => {
  try {
    const broadcasts = await Broadcast.find({ 'responses.donorId': req.user.userId })
      .sort({ createdAt: -1 }).limit(50);
    res.json(broadcasts);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
