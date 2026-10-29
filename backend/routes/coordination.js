const express = require('express');
const rateLimit = require('express-rate-limit');
const memberAuth = require('../middleware/memberAuth');
const coordinator = require('../services/coordinator');
const { normalizeLocation } = require('../services/location');
const User = require('../models/User');
const { freshLocation, policyFromEnv } = require('../services/coordinationPolicy');

const router = express.Router();
router.use(memberAuth);
const postingLimit = rateLimit({ windowMs: 3600000, limit: 6, keyGenerator: req => req.user.userId,
  standardHeaders: true, legacyHeaders: false, message: { message: 'Request limit reached. Please try later.' } });
const handler = fn => async (req, res, next) => {
  try { await fn(req, res); } catch (err) { next(err); }
};

router.get('/', handler(async (req, res) => res.json(await coordinator.list(req.user.userId))));
router.get('/location', handler(async (req, res) => {
  const user = await User.findById(req.user.userId).select('location').lean();
  res.json({ location: user.location, eligibleLocation: freshLocation(user.location, new Date(), policyFromEnv()) });
}));
router.patch('/location', handler(async (req, res) => {
  if (!['device', 'manual'].includes(req.body.source)) return res.status(400).json({ message: 'Choose device or manual location' });
  const location = normalizeLocation(req.body);
  await User.updateOne({ _id: req.user.userId }, { $set: { location } }, { runValidators: true });
  res.json({ location, eligibleLocation: freshLocation(location, new Date(), policyFromEnv()) });
}));
router.post('/', postingLimit, handler(async (req, res) => {
  const b = await coordinator.createRequest(req.user.userId, req.body);
  // The persisted worker processes the queued request, including after a restart.
  res.status(201).json(await coordinator.detail(b._id, req.user.userId));
}));
router.get('/:id', handler(async (req, res) => res.json(await coordinator.detail(req.params.id, req.user.userId))));
router.post('/:id/actions', handler(async (req, res) => {
  await coordinator.act(req.params.id, req.user.userId, req.body.action, req.body);
  // A notification failure must not report that a committed action failed.
  coordinator.emitUpdate(req.app.get('io'), req.params.id).catch(err => console.error('Coordination update:', err.message));
  res.json(await coordinator.detail(req.params.id, req.user.userId));
}));
router.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  const status = err.status || (err.name === 'ValidationError' || err.name === 'CastError' ? 400 : 500);
  if (status === 500) console.error('Coordination error:', err.message);
  res.status(status).json({ message: status === 500 ? 'Unable to process request. Please retry.' : err.message });
});
module.exports = router;
