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
const verifyRoutes = require('./routes/verify');
const { startEscalationJob } = require('./jobs/escalation');

const coordinationEnabled = process.env.COORDINATION_ENABLED === 'true';
const app = express();
const server = http.createServer(app);

const {clientKey, corsOptions} = require('./services/networkPolicy');
const allowedCors = corsOptions();
const io = new Server(server, { cors: allowedCors });

app.set('io', io);
app.set('trust proxy', 1); // Required for Render.com — fixes rate-limit X-Forwarded-For error
app.use(helmet({ contentSecurityPolicy: false })); // CSP disabled — SPA handles it
app.use(cors(allowedCors));
app.use(express.json({ limit: '10mb' }));   // 10mb to allow base64 doc uploads
app.use(mongoSanitize());                   // strip $ and . from user input (NoSQL injection)

// ── Rate limiting ────────────────────────────────────────────────────────────
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 600,
  keyGenerator: clientKey,
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
app.use('/api/coordination', (req, res, next) => coordinationEnabled ? next() : res.status(503).json({ message: 'Donor coordination is not enabled yet' }), require('./routes/coordination'));
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/events',     eventRoutes);
app.use('/api/push',       pushRoutes);
app.use('/api/verify',     verifyRoutes);
app.get('/', (req, res) => res.json({ message: 'LifeLink API is running' }));
app.get('/api/demo', (req,res)=>res.json({enabled:process.env.NODE_ENV!=='production' && process.env.LOCAL_EXAM_DEMO==='true'}));
app.get('/health', (req, res) => res.status(mongoose.connection.readyState === 1 ? 200 : 503).json({ status: mongoose.connection.readyState === 1 ? 'ready' : 'unavailable', coordinationEnabled }));
app.get('/ping', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

const { socketAuth } = require('./services/socketAuth');
const SocketUser = require('./models/User');
io.use(socketAuth({
  secret: process.env.JWT_SECRET,
  findUser: id => SocketUser.findById(id).select('_id isBanned'),
}));
// Socket.io connection
io.on('connection', (socket) => {
  socket.join(`user:${socket.data.userId}`);
  socket.join('authenticated-feed');
  const expiryTimer = setTimeout(() => socket.disconnect(true),
    Math.max(0, socket.data.expiresAt - Date.now()));
  socket.on('disconnect', () => clearTimeout(expiryTimer));
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
    if (process.env.NODE_ENV === 'production') throw new Error('Production MongoDB connection failed; refusing temporary storage');
    console.log('⚠️  MongoDB connection failed — starting in-memory DB...', err.message);
    const { MongoMemoryReplSet } = require('mongodb-memory-server');
    const mongod = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
    mongoUri = mongod.getUri();
    await mongoose.connect(mongoUri);
    console.log('✅ In-memory MongoDB ready');
  }

  if (coordinationEnabled) {
    require('./services/coordinationPolicy').policyFromEnv();
    await require('./services/coordinator').initialize();
  }
  server.listen(PORT, () => {
    console.log(`🚀 LifeLink backend + Socket.io running on port ${PORT}`);
    startEscalationJob(io);
    if (coordinationEnabled) require('./jobs/coordination').startCoordinationJob(io);

    // Auto-expire active broadcasts past their expiresAt
    const Broadcast = require('./models/Broadcast');
    const expireJob = async () => {
      try {
        const expired = await Broadcast.find({
          status: 'active',
          coordinationVersion: { $ne: 1 },
          expiresAt: { $lte: new Date() },
        }).select('_id');
        for (const b of expired) {
          await Broadcast.findByIdAndUpdate(b._id, { status: 'cancelled' });
          io.to('authenticated-feed').emit('broadcast_updated', { broadcastId: b._id, status: 'cancelled' });
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
