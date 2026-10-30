// Local-only synthetic demo. Never reads .env or connects to the deployed database.
const path = require('node:path');
const crypto = require('node:crypto');
const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { MongoMemoryReplSet } = require('mongodb-memory-server');
const { Server } = require('socket.io');
const User = require('../models/User');
const coordinator = require('../services/coordinator');
async function main() {
  process.env.JWT_SECRET = crypto.randomBytes(32).toString('hex');
  process.env.COORDINATION_REQUEST_COOLDOWN_SECONDS = '1';
  const db = await MongoMemoryReplSet.create({ binary: { version: '8.2.1', downloadDir: path.resolve(__dirname, '../node_modules/.cache/mongodb-memory-server') }, replSet: { count: 1 }, instanceOpts: [{ args: ['--wiredTigerCacheSizeGB', '0.25'] }] });
  await mongoose.connect(db.getUri(), { dbName: 'lifelink_local_preview' });
  await coordinator.initialize();
  const base = { password: 'not-a-login-password', bloodGroup: 'O+', district: 'Chennai', state: 'Tamil Nadu', country: 'India' };
  const people = await User.create([
    { ...base, fullName: 'Demo Requester', phone: '9000000011', isAvailable: false },
    { ...base, fullName: 'Demo Donor', phone: '9000000012', location: { lat: 13.08, lng: 80.27, source: 'manual', updatedAt: new Date() } },
    { ...base, fullName: 'Demo Backup Donor', phone: '9000000013', location: { lat: 13.09, lng: 80.28, source: 'manual', updatedAt: new Date() } },
  ]);
  const request = await coordinator.createRequest(people[0]._id, { bloodGroup: 'O+', hospital: 'Demo General Hospital', district: 'Chennai', hospitalLocation: { lat: 13.08, lng: 80.27 }, candidateTarget: 1, urgency: 'normal' });
  await coordinator.evaluate(request._id);
  await coordinator.act(request._id, people[1]._id, 'willing');
  const app = express(); app.set('demoMode', true);
  const server = require('node:http').createServer(app);
  const io = new Server(server); app.set('io', io); app.use(express.json({ limit: '10mb' }));
  io.use(require('../services/socketAuth').socketAuth({ secret: process.env.JWT_SECRET, findUser: id => User.findById(id).select('_id isBanned') }));
  io.on('connection', socket => { socket.join(`user:${socket.data.userId}`); socket.join('authenticated-feed'); });
  for (const [url, file] of Object.entries({ auth: 'auth', coordination: 'coordination', users: 'users', broadcasts: 'broadcast', notifications: 'notifications', leaderboard: 'leaderboard', stats: 'stats', events: 'events' })) app.use(`/api/${url}`, require(`../routes/${file}`));
  app.get('/api/push/vapid-public-key', (req, res) => res.json({ key: null }));
  app.get('/demo/:role', (req, res) => {
    const index = { requester: 0, donor: 1, backup: 2 }[req.params.role];
    if (index === undefined) return res.sendStatus(404);
    const u = people[index];
    const token = jwt.sign({ userId: String(u._id) }, process.env.JWT_SECRET, { expiresIn: '7d' });
    const profile = { id: String(u._id), _id: String(u._id), fullName: u.fullName, bloodGroup: u.bloodGroup, isAvailable: u.isAvailable };
    res.type('html').send(`<script>localStorage.setItem('token',${JSON.stringify(token)});localStorage.setItem('user',${JSON.stringify(JSON.stringify(profile))});localStorage.setItem('onboarding_dismissed','1');localStorage.setItem('ll-lang','en');location.replace('/dashboard');</script>`);
  });
  app.get('/demo', (req, res) => res.type('html').send('<h1>LifeLink local demo</h1><p>Synthetic accounts. Data resets when this process stops.</p><a href="/demo/requester">Open requester</a> · <a href="/demo/donor">Open donor</a> · <a href="/demo/backup">Open backup donor</a>'));
  app.use(express.static(path.resolve(__dirname, '../../frontend/dist')));
  app.get('/api/*', (req, res) => res.status(404).json({ message: 'Not available in local preview' }));
  app.get('*', (req, res) => res.sendFile(path.resolve(__dirname, '../../frontend/dist/index.html')));
  await new Promise(resolve => server.listen(4173, '127.0.0.1', resolve));
  const stop = require('../jobs/coordination').startCoordinationJob(io);
  async function close() { stop(); io.close(); server.close(); await mongoose.disconnect(); await db.stop(); process.exit(0); }
  process.on('SIGINT', close); process.on('SIGTERM', close);
  console.log('LifeLink demo ready: http://127.0.0.1:4173/demo/requester');
}
main().catch(error => { console.error(error); process.exit(1); });
