const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  try {
    const { fullName, phone, password, bloodGroup, country, state, district } = req.body;

    if (!fullName || !phone || !password) {
      return res.status(400).json({ message: 'Name, phone and password are required' });
    }

    const existing = await User.findOne({ phone });
    if (existing) {
      return res.status(409).json({ message: 'Phone number already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = new User({
      fullName,
      phone,
      password: hashedPassword,
      bloodGroup: bloodGroup || '',
      country:   country  || 'India',
      state:     state    || '',
      district:  district || '',
    });

    // First user ever → automatically becomes admin
    const adminExists = await User.exists({ isAdmin: true });
    if (!adminExists) {
      user.isAdmin = true;
      console.log(`👑 First user "${user.fullName}" auto-promoted to admin`);
    }

    await user.save();

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Account created successfully',
      token,
      user: {
        id:          user._id,
        fullName:    user.fullName,
        phone:       user.phone,
        bloodGroup:  user.bloodGroup,
        isVerified:  user.isVerified,
        country:     user.country,
        state:       user.state,
        district:    user.district,
        isAvailable: user.isAvailable,
        isAdmin:     user.isAdmin,
      },
    });
  } catch (err) {
    console.error('Signup error:', err.message);
    // Mongoose validation errors → send 400 with readable message
    if (err.name === 'ValidationError') {
      const msg = Object.values(err.errors).map(e => e.message).join('. ');
      return res.status(400).json({ message: msg });
    }
    // Duplicate key (race condition after findOne check)
    if (err.code === 11000) {
      return res.status(409).json({ message: 'Phone number already registered' });
    }
    res.status(500).json({ message: 'Server error during signup. Please try again.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({ message: 'Phone and password are required' });
    }

    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(401).json({ message: 'Invalid phone number or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid phone number or password' });
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id:          user._id,
        fullName:    user.fullName,
        phone:       user.phone,
        bloodGroup:  user.bloodGroup,
        isVerified:  user.isVerified,
        country:     user.country,
        state:       user.state,
        district:    user.district,
        isAvailable: user.isAvailable,
        isAdmin:     user.isAdmin,
      },
    });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// POST /api/auth/verify-otp — mock: any 6-digit code works
router.post('/verify-otp', async (req, res) => {
  try {
    const { phone, otp } = req.body;
    if (!otp || otp.length !== 6 || !/^\d{6}$/.test(otp)) {
      return res.status(400).json({ message: 'Enter a valid 6-digit OTP' });
    }
    const user = await User.findOneAndUpdate(
      { phone },
      { isVerified: true },
      { new: true }
    ).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'Phone verified successfully', user });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
