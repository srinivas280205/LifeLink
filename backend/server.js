const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// ── Validate required env vars at startup ────────────────────────────────────
const REQUIRED_ENV = ['JWT_SECRET', 'ADMIN_SECRET'];
REQUIRED_ENV.forEach(key => {
  if (!process.env[key]) {
    console.error(`❌ Missing required env var: ${key}`);
    process.exit(1);
  }
});

const authRoutes = require('./routes/auth');
const broadcastRoutes = require('./routes/broadcast');
const userRoutes = require('./routes/users');
const notificationRoutes = require('./routes/notifications');
const statsRoutes = require('./routes/stats');
const adminRoutes = require('./routes/admin');
const leaderboardRoutes = require('./routes/leaderboard');
const eventRoutes       = require('./routes/events');
const { router: pushRoutes } = require('./routes/push');
const { startEscalationJob } = require('./jobs/escalation');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST', 'PATCH'] },
});

app.set('io', io);
app.use(helmet({ contentSecurityPolicy: false })); // CSP disabled — SPA handles it
app.use(cors());
app.use(express.json({ limit: '50kb' }));   // reject oversized payloads
app.use(mongoSanitize());                   // strip $ and . from user input (NoSQL injection)

// ── Rate limiting ────────────────────────────────────────────────────────────
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later.' },
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // 20 auth attempts per 15 min
  message: { message: 'Too many login attempts, please try again later.' },
});
app.use('/api/', generalLimiter);
app.use('/api/auth/login',  authLimiter);
app.use('/api/auth/signup', authLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/broadcasts', broadcastRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/events',     eventRoutes);
app.use('/api/push',       pushRoutes);
app.get('/', (req, res) => res.json({ message: 'LifeLink API is running' }));

// Socket.io connection
io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);
  socket.on('disconnect', () => {
    console.log(`❌ Client disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 3456;

async function startServer() {
  let mongoUri = process.env.MONGO_URI;
  try {
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 10000 });
    console.log('✅ MongoDB connected');
  } catch (err) {
    console.log('⚠️  MongoDB connection failed — starting in-memory DB...', err.message);
    const { MongoMemoryServer } = require('mongodb-memory-server');
    const mongod = await MongoMemoryServer.create();
    mongoUri = mongod.getUri();
    await mongoose.connect(mongoUri);
    console.log('✅ In-memory MongoDB ready');
  }

  server.listen(PORT, () => {
    console.log(`🚀 LifeLink backend + Socket.io running on port ${PORT}`);
    startEscalationJob(io);

    // Auto-expire active broadcasts past their expiresAt
    const Broadcast = require('./models/Broadcast');
    const expireJob = async () => {
      try {
        const expired = await Broadcast.find({
          status: 'active',
          expiresAt: { $lte: new Date() },
        }).select('_id');
        for (const b of expired) {
          await Broadcast.findByIdAndUpdate(b._id, { status: 'cancelled' });
          io.emit('broadcast_updated', { broadcastId: b._id, status: 'cancelled' });
        }
        if (expired.length) console.log(`⏰ Expired ${expired.length} broadcast(s)`);
      } catch (e) { /* ignore */ }
    };
    expireJob();
    setInterval(expireJob, 10 * 60 * 1000); // every 10 minutes
  });
}

startServer().catch((err) => {
  console.error('Startup failed:', err.message);
  process.exit(1);
});
