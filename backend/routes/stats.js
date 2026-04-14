const express = require('express');
const User = require('../models/User');
const Broadcast = require('../models/Broadcast');

const router = express.Router();

// GET /api/stats — public stats for landing page
router.get('/', async (req, res) => {
  try {
    const [totalDonors, livesSaved, broadcasts, stateAgg] = await Promise.all([
      User.countDocuments({ bloodGroup: { $nin: ['', null] }, isAvailable: true }),
      Broadcast.countDocuments({ status: 'fulfilled' }),
      Broadcast.find({ 'responses.0': { $exists: true } }).select('createdAt responses').lean(),
      User.distinct('state', { bloodGroup: { $nin: ['', null] }, state: { $ne: '' } }),
    ]);

    let avgMinutes = null;
    if (broadcasts.length > 0) {
      const total = broadcasts.reduce((sum, b) => {
        const firstResp = b.responses[0]?.respondedAt;
        if (!firstResp) return sum;
        return sum + (new Date(firstResp) - new Date(b.createdAt)) / 60000;
      }, 0);
      avgMinutes = Math.round(total / broadcasts.length);
    }

    const avgLabel = avgMinutes === null ? '—'
      : avgMinutes < 2 ? '<2 min' : `${avgMinutes} min`;

    res.json({
      totalDonors,
      livesSaved,
      statesCovered: stateAgg.length,
      avgResponseTime: avgLabel,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
