/**
 * /api/verify — Email verification + blood group document upload
 *
 * Routes:
 *   POST /api/verify/send-email     — send email verification link
 *   GET  /api/verify/email          — click link to verify (redirects to frontend)
 *   POST /api/verify/upload-doc     — upload blood group proof document
 *   GET  /api/verify/status         — get current trust status
 */
const express  = require('express');
const jwt      = require('jsonwebtoken');
const crypto   = require('crypto');
const multer   = require('multer');
const nodemailer = require('nodemailer');
const User     = require('../models/User');

const router = express.Router();

// ── Auth middleware ───────────────────────────────────────────────────────────
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

// ── Multer: memory storage, accept images + PDF, max 3 MB ────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 3 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (allowed.includes(file.mimetype)) return cb(null, true);
    cb(Object.assign(new Error('Only JPG, PNG, and PDF files are allowed'), { status: 400 }));
  },
});

// ── Email helper ─────────────────────────────────────────────────────────────
function createTransporter() {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  if (!user || !pass) return null;
  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  });
}

async function sendVerificationEmail(toEmail, token, userName) {
  const backendUrl  = process.env.BACKEND_URL  || `http://localhost:${process.env.PORT || 3456}`;
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const verifyLink  = `${backendUrl}/api/verify/email?token=${token}&redirect=${encodeURIComponent(frontendUrl + '/profile')}`;

  const transporter = createTransporter();
  if (!transporter) {
    console.log(`📧 [DEV EMAIL] To: ${toEmail} | Link: ${verifyLink}`);
    return { success: true, dev: true };
  }

  try {
    await transporter.sendMail({
      from:    `"LifeLink 🩸" <${process.env.EMAIL_USER}>`,
      to:      toEmail,
      subject: 'Verify your email — LifeLink Emergency Blood Network',
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px">
          <div style="text-align:center;margin-bottom:24px">
            <span style="font-size:2.5rem">❤️</span>
            <h2 style="color:#d32f2f;margin:8px 0 0">LifeLink</h2>
          </div>
          <h3 style="color:#333">Hi ${userName},</h3>
          <p style="color:#555;line-height:1.6">
            Thank you for joining India's Emergency Blood Network.<br/>
            Please verify your email address to increase your trust score and help the community trust you as a verified donor.
          </p>
          <div style="text-align:center;margin:32px 0">
            <a href="${verifyLink}"
               style="background:#d32f2f;color:#fff;padding:14px 32px;border-radius:8px;
                      text-decoration:none;font-weight:700;font-size:1rem;display:inline-block">
              ✅ Verify Email Address
            </a>
          </div>
          <p style="color:#888;font-size:0.85rem">
            This link expires in <strong>1 hour</strong>. If you didn't request this, ignore this email.
          </p>
          <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
          <p style="color:#aaa;font-size:0.8rem;text-align:center">
            LifeLink · India's Emergency Blood Donor Network
          </p>
        </div>
      `,
    });
    return { success: true };
  } catch (err) {
    console.error('Email send error:', err.message);
    console.log(`📧 [FALLBACK EMAIL] To: ${toEmail} | Link: ${verifyLink}`);
    return { success: true, dev: true, fallback: true };
  }
}

// ── POST /api/verify/send-email ───────────────────────────────────────────────
router.post('/send-email', auth, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: 'Please provide a valid email address' });
    }

    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.emailVerified && user.email === email.toLowerCase()) {
      return res.status(400).json({ message: 'Email is already verified' });
    }

    // Rate-limit: don't resend if token is still fresh (< 5 min old)
    if (user.emailVerifyExpires && user.emailVerifyExpires - Date.now() > 55 * 60 * 1000) {
      return res.status(429).json({ message: 'Email already sent. Please check your inbox or wait a few minutes.' });
    }

    const token   = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await User.findByIdAndUpdate(user._id, {
      email:              email.toLowerCase(),
      emailVerified:      false,
      emailVerifyToken:   token,
      emailVerifyExpires: expires,
    });

    const result = await sendVerificationEmail(email, token, user.fullName);

    res.json({
      message: result.dev
        ? 'Verification link printed to server console (dev mode — no EMAIL_USER set)'
        : 'Verification email sent! Check your inbox.',
      devMode: !!result.dev,
    });
  } catch (err) {
    console.error('send-email error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// ── GET /api/verify/email?token=xxx&redirect=url ──────────────────────────────
router.get('/email', async (req, res) => {
  try {
    const { token, redirect } = req.query;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const base = redirect || `${frontendUrl}/profile`;

    if (!token) {
      return res.redirect(`${base}?emailVerified=error&reason=missing`);
    }

    const user = await User.findOne({
      emailVerifyToken:   token,
      emailVerifyExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.redirect(`${base}?emailVerified=error&reason=expired`);
    }

    await User.findByIdAndUpdate(user._id, {
      emailVerified:      true,
      emailVerifyToken:   null,
      emailVerifyExpires: null,
    });

    res.redirect(`${base}?emailVerified=success`);
  } catch (err) {
    console.error('email verify error:', err.message);
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/profile?emailVerified=error&reason=server`);
  }
});

// ── POST /api/verify/upload-doc ───────────────────────────────────────────────
router.post('/upload-doc', auth, upload.single('doc'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded. Please select an image or PDF.' });
    }

    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.docStatus === 'approved') {
      return res.status(400).json({ message: 'Your document is already approved. No need to re-upload.' });
    }

    // Convert buffer to base64 data URI
    const base64 = req.file.buffer.toString('base64');
    const dataUri = `data:${req.file.mimetype};base64,${base64}`;

    await User.findByIdAndUpdate(user._id, {
      bloodGroupDoc:     dataUri,
      bloodGroupDocName: req.file.originalname,
      bloodGroupDocType: req.file.mimetype,
      docStatus:         'pending',
      docRejectedReason: '',
    });

    res.json({
      message: 'Document uploaded successfully! Admin will review it within 24 hours.',
      docStatus: 'pending',
    });
  } catch (err) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File too large. Maximum size is 3 MB.' });
    }
    if (err.message && err.message.includes('Only')) {
      return res.status(400).json({ message: err.message });
    }
    console.error('upload-doc error:', err.message);
    res.status(500).json({ message: 'Server error during upload' });
  }
});

// ── GET /api/verify/status ────────────────────────────────────────────────────
router.get('/status', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select(
      'isVerified emailVerified email docStatus docRejectedReason donationCount'
    );
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Compute trust score
    let trustScore = 0;
    let trustLevel = 'new';
    if (user.isVerified)            { trustScore = 1; trustLevel = 'phone'; }
    if (user.emailVerified)         { trustScore = 2; trustLevel = 'email'; }
    if (user.docStatus === 'pending')  { trustScore = 3; trustLevel = 'doc_pending'; }
    if (user.docStatus === 'approved') { trustScore = 4; trustLevel = 'doc_approved'; }
    if (user.docStatus === 'approved' && user.donationCount >= 10) {
      trustScore = 5; trustLevel = 'trusted';
    }

    res.json({
      isVerified:        user.isVerified,
      emailVerified:     user.emailVerified,
      email:             user.email,
      docStatus:         user.docStatus,
      docRejectedReason: user.docRejectedReason,
      donationCount:     user.donationCount,
      trustScore,
      trustLevel,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
