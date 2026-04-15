const express = require('express');
const router  = express.Router();
const webpush = require('web-push');
const jwt     = require('jsonwebtoken');
const PushSub = require('../models/PushSubscription');

// Auto-fix: ensure VAPID_MAILTO has mailto: prefix
const vapidMailto = (() => {
  const m = process.env.VAPID_MAILTO || 'mailto:lifelink@example.com';
  return m.startsWith('mailto:') ? m : `mailto:${m}`;
})();

webpush.setVapidDetails(
  vapidMailto,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY,
);

// ── Auth middleware ─────────────────────────────────────────────────────────
function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ message: 'No token' });
  try {
    req.user = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
}

// GET /api/push/vapid-public-key — frontend needs this to subscribe
router.get('/vapid-public-key', (_req, res) => {
  res.json({ key: process.env.VAPID_PUBLIC_KEY });
});

// POST /api/push/subscribe — save subscription
router.post('/subscribe', auth, async (req, res) => {
  try {
    const { endpoint, keys } = req.body;
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return res.status(400).json({ message: 'Invalid subscription object' });
    }
    await PushSub.findOneAndUpdate(
      { endpoint },
      { user: req.user.id, endpoint, keys },
      { upsert: true, new: true },
    );
    res.json({ ok: true });
  } catch (err) {
    console.error('push subscribe error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/push/unsubscribe — remove subscription
router.post('/unsubscribe', auth, async (req, res) => {
  try {
    await PushSub.deleteOne({ endpoint: req.body.endpoint, user: req.user.id });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ── Helper: send push to one user ──────────────────────────────────────────
async function sendPushToUser(userId, payload) {
  const subs = await PushSub.find({ user: userId });
  const results = await Promise.allSettled(
    subs.map(sub =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: sub.keys },
        JSON.stringify(payload),
      ).catch(async (err) => {
        // 410 Gone = subscription expired, clean up
        if (err.statusCode === 410) await PushSub.deleteOne({ _id: sub._id });
        throw err;
      })
    )
  );
  return results;
}

module.exports = { router, sendPushToUser };
