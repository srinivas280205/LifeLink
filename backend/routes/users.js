const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Broadcast = require('../models/Broadcast');

const router = express.Router();

function auth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token' });
  try { req.user = jwt.verify(token, process.env.JWT_SECRET); next(); }
  catch { res.status(401).json({ message: 'Invalid token' }); }
}

// GET /api/users/me — get own profile
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /api/users/profile — update profile
router.patch('/profile', auth, async (req, res) => {
  try {
    const { fullName, gender, country, state, district, isAvailable, location, bloodGroup } = req.body;
    const update = {};
    if (fullName    !== undefined) update.fullName    = fullName;
    if (gender      !== undefined) update.gender      = gender;
    if (country     !== undefined) update.country     = country;
    if (state       !== undefined) update.state       = state;
    if (district    !== undefined) update.district    = district;
    if (isAvailable !== undefined) update.isAvailable = isAvailable;
    if (location    !== undefined) update.location    = location;
    // Allow blood group update for donors (they may have entered wrong group)
    if (bloodGroup  !== undefined) update.bloodGroup  = bloodGroup;

    const user = await User.findByIdAndUpdate(
      req.user.userId, { $set: update }, { new: true }
    ).select('-password');

    const io = req.app.get('io');
    if (io) io.emit('donor_updated', {
      userId: user._id,
      district: user.district,
      state: user.state,
      isAvailable: user.isAvailable,
      location: user.location,
    });

    res.json({ message: 'Profile updated', user });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /api/users/password — change own password
router.patch('/password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new password required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }
    const user = await User.findById(req.user.userId);
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Current password is incorrect' });

    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();
    res.json({ message: 'Password changed successfully' });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/users/donors — all users with a blood group set who are available
router.get('/donors', auth, async (req, res) => {
  try {
    const { state, district } = req.query;
    const filter = { bloodGroup: { $nin: ['', null] }, isAvailable: true };
    if (state)    filter.state    = state;
    if (district) filter.district = district;

    const donors = await User.find(filter)
      .select('fullName bloodGroup country state district location isAvailable')
      .lean();
    res.json(donors);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/users/mystats — personal activity stats
router.get('/mystats', auth, async (req, res) => {
  try {
    const uid = req.user.userId;
    const [requestsPosted, responsesGiven, fulfilled, sos] = await Promise.all([
      Broadcast.countDocuments({ requestedBy: uid }),
      Broadcast.countDocuments({ 'responses.donorId': uid }),
      Broadcast.countDocuments({ requestedBy: uid, status: 'fulfilled' }),
      Broadcast.countDocuments({ requestedBy: uid, isSOS: true }),
    ]);
    res.json({ requestsPosted, responsesGiven, fulfilled, sos });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/users/resend-verification — resend OTP for existing unverified user
router.post('/resend-verification', auth, async (req, res) => {
  try {
    const OTP = require('../models/OTP');
    const user = await User.findById(req.user.userId).select('phone isVerified');
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.isVerified) return res.status(400).json({ message: 'Phone already verified' });
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    await OTP.findOneAndUpdate(
      { phone: user.phone },
      { phone: user.phone, otp, attempts: 0, expiresAt },
      { upsert: true, new: true }
    );
    console.log(`📱 [REVERIFY OTP] ${user.phone} → ${otp}`);
    res.json({ message: 'OTP sent to your phone', phone: user.phone });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/users/me — delete own account
router.delete('/me', auth, async (req, res) => {
  try {
    const Notification = require('../models/Notification');
    await Promise.all([
      User.findByIdAndDelete(req.user.userId),
      Notification.deleteMany({ userId: req.user.userId }),
    ]);
    res.json({ message: 'Account deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
