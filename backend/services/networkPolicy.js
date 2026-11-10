const jwt = require('jsonwebtoken');
const { ipKeyGenerator } = require('express-rate-limit');
function clientKey(req) {
  const token = (req.headers.authorization || '').replace(/^Bearer /, '');
  try {
    const session = jwt.verify(token, process.env.JWT_SECRET);
    if (typeof session.userId === 'string' && !session.purpose) return `user:${session.userId}`;
  } catch {}
  return `ip:${ipKeyGenerator(req.ip)}`;
}
function corsOptions(env = process.env) {
  const origins = (env.FRONTEND_ORIGINS || '').split(',').map(x => x.trim().replace(/\/$/, '')).filter(Boolean);
  // Safe default for this app's existing public frontend; custom domains use FRONTEND_ORIGINS.
  if (env.NODE_ENV === 'production' && !origins.length) origins.push('https://life-link-liart.vercel.app');
  return { origin(origin, callback) {
    callback(null, !origin || origins.includes(origin) || (env.NODE_ENV !== 'production' && !origins.length));
  }, methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'] };
}
module.exports = {clientKey, corsOptions};
