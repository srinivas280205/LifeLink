const express = require('express');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const Broadcast = require('../models/Broadcast');
const Outreach = require('../models/DonorOutreach');
const User = require('../models/User');

const router = express.Router();

const auth = require('../middleware/memberAuth');

// GET /api/leaderboard — top 20 donors by confirmed completion count
router.get('/', auth, async (req, res) => {
  try {
    // Count explicit completed outreach records, never willingness
    const topDonors = await Outreach.aggregate([
      { $match: { state: 'completed' } },
      { $group: {
          _id: '$donor',
          donationsGiven: { $sum: 1 },
        }
      },
      { $sort: { donationsGiven: -1, _id: 1 } },
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
      Outreach.countDocuments({ state: 'completed' }),
      Broadcast.countDocuments({ status: 'fulfilled' }),
    ]);

    res.json({
      leaderboard: result,
      stats: {
        totalDonors,
        completedDonations: totalResponses,
        fulfilledCount,
      },
    });
  } catch (err) {
    console.error('Leaderboard error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
