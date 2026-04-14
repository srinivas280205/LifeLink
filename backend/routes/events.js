const express = require('express');
const jwt = require('jsonwebtoken');
const Event = require('../models/Event');

const router = express.Router();

function auth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token' });
  try { req.user = jwt.verify(token, process.env.JWT_SECRET); next(); }
  catch { res.status(401).json({ message: 'Invalid token' }); }
}

// GET /api/events — list upcoming + ongoing events
router.get('/', auth, async (req, res) => {
  try {
    const filter = { status: { $in: ['upcoming', 'ongoing'] } };
    if (req.query.state)    filter.state    = req.query.state;
    if (req.query.district) filter.district = req.query.district;
    const events = await Event.find(filter).sort({ date: 1 }).limit(50).lean();
    res.json(events);
  } catch { res.status(500).json({ message: 'Server error' }); }
});

// POST /api/events — create event
router.post('/', auth, async (req, res) => {
  try {
    const user = require('../models/User');
    const u = await user.findById(req.user.userId).select('fullName phone').lean();
    if (!u) return res.status(404).json({ message: 'User not found' });
    const { title, description, venue, state, district, date, endDate, bloodGroupsNeeded, targetDonors } = req.body;
    if (!title || !venue || !date) return res.status(400).json({ message: 'title, venue and date are required' });
    const event = await Event.create({
      title, description, venue, state, district,
      date: new Date(date),
      endDate: endDate ? new Date(endDate) : null,
      bloodGroupsNeeded: bloodGroupsNeeded || [],
      targetDonors: targetDonors || 50,
      organizer: req.user.userId,
      organizerName: u.fullName,
      organizerPhone: u.phone,
    });
    res.status(201).json(event);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// POST /api/events/:id/join — join an event
router.post('/:id/join', auth, async (req, res) => {
  try {
    const user = require('../models/User');
    const u = await user.findById(req.user.userId).select('fullName bloodGroup').lean();
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    const already = event.attendees.some(a => String(a.userId) === req.user.userId);
    if (already) return res.status(400).json({ message: 'Already joined' });
    event.attendees.push({ userId: req.user.userId, name: u.fullName, bloodGroup: u.bloodGroup || '' });
    await event.save();
    res.json({ attendees: event.attendees.length });
  } catch { res.status(500).json({ message: 'Server error' }); }
});

// DELETE /api/events/:id/leave — leave an event
router.delete('/:id/leave', auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    event.attendees = event.attendees.filter(a => String(a.userId) !== req.user.userId);
    await event.save();
    res.json({ attendees: event.attendees.length });
  } catch { res.status(500).json({ message: 'Server error' }); }
});

module.exports = router;
