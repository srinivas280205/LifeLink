const express  = require('express');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');

const User     = require('../models/User');


const router = express.Router();

// ── POST /api/auth/signup ─────────────────────────────────────────────────────
router.post('/signup', async (req, res) => {
  try {
    const { fullName, phone, password, gender, bloodGroup, country, state, district, dob, email } = req.body;

    if (!fullName || !phone || !password) {
      return res.status(400).json({ message: 'Name, phone and password are required' });
    }

    // Age validation: must be 18–65 if DOB provided
    if (dob) {
      const birthDate = new Date(dob);
      if (isNaN(birthDate.getTime())) {
        return res.status(400).json({ message: 'Invalid date of birth' });
      }
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age--;
      if (age < 18) return res.status(400).json({ message: 'You must be at least 18 years old to register as a blood donor.' });
      if (age > 65) return res.status(400).json({ message: 'Blood donor registration is available for people up to 65 years of age.' });
    }

    if (typeof fullName !== 'string' || typeof phone !== 'string' || typeof password !== 'string' || password.length < 8 || password.length > 128) return res.status(400).json({message:'Enter a name, phone and password of 8–128 characters'});
    if (email && (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) return res.status(400).json({message:'Enter a valid email address'});
    if (email && await User.exists({email:email.trim().toLowerCase()})) return res.status(409).json({message:'Email is already registered'});
    const existing = await User.findOne({ phone });
    if (existing) {
      return res.status(409).json({ message: 'Phone number already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = new User({
      fullName,
      phone,
      password: hashedPassword,
      gender:     gender     || '',
      bloodGroup: bloodGroup || '',
      country:    country   || 'India',
      state:      state     || '',
      district:   district  || '',
      dob:        dob       || null,
      email:      email     || '',
    });

    await user.save();

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Account created. Phone ownership has not been confirmed.',
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
    if (err.name === 'ValidationError') {
      const msg = Object.values(err.errors).map(e => e.message).join('. ');
      return res.status(400).json({ message: msg });
    }
    if (err.code === 11000) {
      return res.status(409).json({ message: 'Phone number already registered' });
    }
    res.status(500).json({ message: 'Server error during signup. Please try again.' });
  }
});

// ── POST /api/auth/login ──────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { password } = req.body;
    const identifier = req.body.identifier ?? req.body.phone ?? req.body.email;

    if (typeof identifier !== 'string' || typeof password !== 'string' || !identifier.trim() || !password) {
      return res.status(400).json({ message: 'Phone or email and password are required' });
    }

    const value = identifier.trim();
    const candidates = await User.find(value.includes('@') ? {email:value.toLowerCase()} : {phone:{$in:[value, ...( /^\d{10}$/.test(value) ? ['+91'+value] : [])]}}).limit(2);
    const user = candidates.length === 1 ? candidates[0] : null;
    if (!user) {
      return res.status(401).json({ message: 'Invalid login or password' });
    }

    // Check if account is banned
    if (user.isBanned) {
      return res.status(403).json({
        message: `Your account has been suspended. Reason: ${user.banReason || 'Violation of community guidelines'}. Contact support if you believe this is a mistake.`,
      });
    }

    // Check login lockout
    if (user.lockUntil && user.lockUntil > Date.now()) {
      const remainingMin = Math.ceil((user.lockUntil - Date.now()) / 60000);
      return res.status(423).json({
        message: `Account temporarily locked due to too many failed attempts. Try again in ${remainingMin} minute(s).`,
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      const attempts = (user.loginAttempts || 0) + 1;
      const update = { loginAttempts: attempts };
      if (attempts >= 5) {
        update.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // lock 15 min
        update.loginAttempts = 0;
      }
      await User.findByIdAndUpdate(user._id, update);
      const left = Math.max(0, 5 - attempts);
      const msg = attempts >= 5
        ? 'Too many failed attempts. Account locked for 15 minutes.'
        : `Invalid login or password. ${left} attempt(s) remaining before lockout.`;
      return res.status(401).json({ message: msg });
    }

    // Successful login — reset lockout state
    if (user.loginAttempts > 0 || user.lockUntil) {
      await User.findByIdAndUpdate(user._id, { loginAttempts: 0, lockUntil: null });
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
        id:            user._id,
        fullName:      user.fullName,
        phone:         user.phone,
        bloodGroup:    user.bloodGroup,
        isVerified:    user.isVerified,
        country:       user.country,
        state:         user.state,
        district:      user.district,
        isAvailable:   user.isAvailable,
        isAdmin:       user.isAdmin,
        emailVerified: user.emailVerified,
        docStatus:     user.docStatus,
        donationCount: user.donationCount,
      },
    });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Password recovery will use email; SMS/code recovery has been removed.
router.post('/forgot-password', (req, res) => res.status(503).json({message:'Email password recovery is not available yet. If signed in, change your password in account settings.'}));

// POST /api/auth/refresh — silently renew a valid token
router.post('/refresh', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.purpose) return res.status(401).json({message:'Invalid session'});
    const user = await User.findById(decoded.userId).select('fullName phone bloodGroup country state district isAvailable isAdmin isVerified isBanned');
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.isBanned) return res.status(403).json({ message: 'Account suspended' });
    // Issue a fresh 7-day token
    const newToken = jwt.sign(
      { userId: user._id, phone: user.phone, isAdmin: user.isAdmin },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.json({ token: newToken, user });
  } catch {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
});

module.exports = router;
