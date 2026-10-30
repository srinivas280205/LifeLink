const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');

module.exports = async function memberAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    if (!header.startsWith('Bearer ')) return res.status(401).json({ message: 'Please sign in' });
    const claims = jwt.verify(header.slice(7), process.env.JWT_SECRET);
    if (claims.purpose || !claims.exp || !mongoose.isValidObjectId(claims.userId)) return res.status(401).json({ message: 'Please sign in again' });
    const user = await User.findById(claims.userId).select('_id isBanned');
    if (!user || user.isBanned) return res.status(403).json({ message: 'Account unavailable' });
    req.user = { userId: String(user._id) };
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError' || err.name === 'NotBeforeError') return res.status(401).json({ message: 'Please sign in again' });
    next(err);
  }
};
