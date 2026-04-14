const express = require('express');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const Broadcast = require('../models/Broadcast');
const User = require('../models/User');

const router = express.Router();

function auth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token' });
  try { req.user = jwt.verify(token, process.env.JWT_SECRET); next(); }
  catch { res.status(401).json({ message: 'Invalid token' }); }
}

// GET /api/leaderboard — top 20 donors by response count
router.get('/', auth, async (req, res) => {
  try {
    // Aggregate donors by number of responses given
    const topDonors = await Broadcast.aggregate([
      { $unwind: '$responses' },
      { $group: {
          _id: '$responses.donorId',
          donationsGiven: { $sum: 1 },
          bloodGroup:     { $first: '$responses.bloodGroup' },
          donorName:      { $first: '$responses.donorName' },
        }
      },
      { $sort: { donationsGiven: -1 } },
      { $limit: 20 },
    ]);

    // Enrich with user location details
    const ids = topDonors.map(d => d._id).filter(Boolean);
    const users = await User.find({ _id: { $in: ids } })
      .select('fullName bloodGroup state district isAvailable')
      .lean();
    const userMap = Object.fromEntries(users.map(u => [u._id.toString(), u]));

    const result = topDonors.map((d, i) => {
      const u = userMap[d._id?.toString()] || {};
      return {
        rank:           i + 1,
        donorId:        d._id,
        donorName:      u.fullName || d.donorName || 'Anonymous',
        bloodGroup:     u.bloodGroup || d.bloodGroup || '—',
        state:          u.state || '',
        district:       u.district || '',
        isAvailable:    u.isAvailable ?? true,
        donationsGiven: d.donationsGiven,
      };
    });

    // Also return total platform stats
    const [totalDonors, totalResponses, fulfilledCount] = await Promise.all([
      User.countDocuments({ bloodGroup: { $nin: ['', null] }, isAvailable: true }),
      Broadcast.aggregate([{ $project: { c: { $size: '$responses' } } }, { $group: { _id: null, t: { $sum: '$c' } } }]),
      Broadcast.countDocuments({ status: 'fulfilled' }),
    ]);

    res.json({
      leaderboard: result,
      stats: {
        totalDonors,
        totalResponses: totalResponses[0]?.t || 0,
        fulfilledCount,
      },
    });
  } catch (err) {
    console.error('Leaderboard error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
