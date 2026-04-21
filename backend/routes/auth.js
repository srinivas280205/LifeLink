const express  = require('express');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const axios    = require('axios');
const User     = require('../models/User');
const OTP      = require('../models/OTP');

const router = express.Router();

// ── Helpers ──────────────────────────────────────────────────────────────────
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Send OTP via Fast2SMS (India SMS gateway).
 * Falls back to console log if FAST2SMS_API_KEY not set (dev mode).
 */
async function sendSMS(phone, otp) {
  const apiKey = process.env.FAST2SMS_API_KEY;

  // No API key → dev mode
  if (!apiKey) {
    console.log(`📱 [DEV OTP] Phone: ${phone} → OTP: ${otp}`);
    return { success: true, dev: true };
  }

  // Strip country code for Fast2SMS (needs 10-digit India number only)
  const digits = phone.replace(/^\+91/, '').replace(/\D/g, '');

  try {
    const res = await axios.get('https://www.fast2sms.com/dev/bulkV2', {
      params: {
        authorization:    apiKey,
        route:            'otp',
        variables_values: otp,
        flash:            0,
        numbers:          digits,
      },
      timeout: 8000,
    });
    console.log(`📱 SMS sent to ${phone}:`, res.data);
    return { success: true };
  } catch (err) {
    const errData = err?.response?.data || err.message;
    console.error('Fast2SMS error:', errData);
    // Always fall back to console log so admin can see OTP in Render logs
    console.log(`📱 [FALLBACK OTP] Phone: ${phone} → OTP: ${otp}`);
    return { success: true, dev: true, fallback: true };
  }
}

// ── POST /api/auth/signup ─────────────────────────────────────────────────────
router.post('/signup', async (req, res) => {
  try {
    const { fullName, phone, password, gender, bloodGroup, country, state, district } = req.body;

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
      gender:     gender     || '',
      bloodGroup: bloodGroup || '',
      country:    country   || 'India',
      state:      state     || '',
      district:   district  || '',
    });

    // First user ever → automatically becomes admin
    const adminExists = await User.exists({ isAdmin: true });
    if (!adminExists) {
      user.isAdmin = true;
      console.log(`👑 First user "${user.fullName}" auto-promoted to admin`);
    }

    await user.save();

    // Generate + send OTP
    const otp       = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    await OTP.findOneAndUpdate(
      { phone },
      { phone, otp, attempts: 0, expiresAt },
      { upsert: true, new: true }
    );

    const smsResult = await sendSMS(phone, otp);

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: smsResult.dev
        ? 'Account created — OTP printed to server console (dev mode)'
        : 'Account created — OTP sent to your mobile',
      otpSent: true,
      devMode: !!smsResult.dev,
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

// ── POST /api/auth/resend-otp ────────────────────────────────────────────────
router.post('/resend-otp', async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ message: 'Phone is required' });

    const user = await User.findOne({ phone });
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.isVerified) return res.status(400).json({ message: 'Phone already verified' });

    const otp       = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await OTP.findOneAndUpdate(
      { phone },
      { phone, otp, attempts: 0, expiresAt },
      { upsert: true, new: true }
    );

    const smsResult = await sendSMS(phone, otp);
    if (!smsResult.success && !smsResult.dev) {
      return res.status(502).json({ message: 'Failed to send SMS. Try again shortly.' });
    }

    res.json({ message: smsResult.dev ? 'OTP printed to console (dev)' : 'OTP resent successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ── POST /api/auth/verify-otp ────────────────────────────────────────────────
router.post('/verify-otp', async (req, res) => {
  try {
    const { phone, otp } = req.body;

    if (!otp || !/^\d{6}$/.test(otp)) {
      return res.status(400).json({ message: 'Enter a valid 6-digit OTP' });
    }

    const record = await OTP.findOne({ phone });

    if (!record) {
      return res.status(400).json({ message: 'OTP expired or not sent. Request a new one.' });
    }

    // Too many wrong attempts
    if (record.attempts >= 5) {
      await OTP.deleteOne({ phone });
      return res.status(400).json({ message: 'Too many wrong attempts. Request a new OTP.' });
    }

    if (record.otp !== otp) {
      await OTP.findOneAndUpdate({ phone }, { $inc: { attempts: 1 } });
      const left = 4 - record.attempts;
      return res.status(400).json({ message: `Wrong OTP. ${left} attempt(s) left.` });
    }

    // ✅ Correct OTP
    await OTP.deleteOne({ phone });

    const user = await User.findOneAndUpdate(
      { phone },
      { isVerified: true },
      { new: true }
    ).select('-password');

    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({ message: 'Phone verified successfully', user });
  } catch (err) {
    console.error('verify-otp error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// ── POST /api/auth/login ──────────────────────────────────────────────────────
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

    // Check if account is banned
    if (user.isBanned) {
      return res.status(403).json({
        message: `Your account has been suspended. Reason: ${user.banReason || 'Violation of community guidelines'}. Contact support if you believe this is a mistake.`,
      });
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

// ── POST /api/auth/forgot-password ───────────────────────────────────────────
router.post('/forgot-password', async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ message: 'Phone is required' });

    const user = await User.findOne({ phone });
    if (!user) return res.status(404).json({ message: 'No account found with this phone number' });

    const otp       = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    await OTP.findOneAndUpdate(
      { phone },
      { phone, otp, attempts: 0, expiresAt },
      { upsert: true, new: true }
    );

    const smsResult = await sendSMS(phone, otp);

    res.json({
      message: smsResult.dev
        ? 'OTP printed to server console (dev mode)'
        : 'OTP sent to your mobile',
      devMode: !!smsResult.dev,
    });
  } catch (err) {
    console.error('forgot-password error:', err.message);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
});

// ── POST /api/auth/verify-forgot-otp ─────────────────────────────────────────
router.post('/verify-forgot-otp', async (req, res) => {
  try {
    const { phone, otp } = req.body;

    if (!otp || !/^\d{6}$/.test(otp)) {
      return res.status(400).json({ message: 'Enter a valid 6-digit OTP' });
    }

    const record = await OTP.findOne({ phone });

    if (!record) {
      return res.status(400).json({ message: 'OTP expired or not sent. Request a new one.' });
    }

    if (record.attempts >= 5) {
      await OTP.deleteOne({ phone });
      return res.status(400).json({ message: 'Too many wrong attempts. Request a new OTP.' });
    }

    if (record.otp !== otp) {
      await OTP.findOneAndUpdate({ phone }, { $inc: { attempts: 1 } });
      const left = 4 - record.attempts;
      return res.status(400).json({ message: `Wrong OTP. ${left} attempt(s) left.` });
    }

    // Correct OTP — do NOT delete yet; delete after password reset
    const user = await User.findOne({ phone });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const resetToken = jwt.sign(
      { userId: user._id, purpose: 'reset' },
      process.env.JWT_SECRET,
      { expiresIn: '10m' }
    );

    await OTP.deleteOne({ phone });

    res.json({ message: 'OTP verified', resetToken });
  } catch (err) {
    console.error('verify-forgot-otp error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// ── POST /api/auth/reset-password ─────────────────────────────────────────────
router.post('/reset-password', async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;

    if (!resetToken || !newPassword) {
      return res.status(400).json({ message: 'Reset token and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    let payload;
    try {
      payload = jwt.verify(resetToken, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ message: 'Reset link has expired. Please start again.' });
    }

    if (payload.purpose !== 'reset') {
      return res.status(401).json({ message: 'Invalid reset token' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    const user = await User.findByIdAndUpdate(
      payload.userId,
      { password: hashedPassword },
      { new: true }
    );

    if (!user) return res.status(404).json({ message: 'User not found' });

    // Clean up any leftover OTP records for this user's phone
    await OTP.deleteMany({ phone: user.phone });

    res.json({ message: 'Password reset successfully. You can now log in.' });
  } catch (err) {
    console.error('reset-password error:', err.message);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
});

module.exports = router;
