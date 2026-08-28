require('dotenv').config();
const path = require('path');
const fs = require('fs');
const express = require('express');
// Supabase replaces MongoDB — no mongoose required
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const admin = require('firebase-admin');

require('./config/supabase'); // Initialize Supabase client on startup
const { errorHandler } = require('./middleware/errorMiddleware');

const projectRoutes = require('./routes/projectRoutes');
const commentRoutes = require('./routes/commentRoutes');
const userRoutes = require('./routes/userRoutes');
const teacherRoutes = require('./routes/teacherRoutes');

// ── Private Key Normalization Helper ─────────────────────────────────────────
function normalizePrivateKey(rawKey) {
  if (!rawKey) return undefined;
  let key = rawKey.trim();
  // Strip surrounding quotes if present
  if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
    key = key.slice(1, -1);
  }
  // Replace literal '\n' characters with actual newlines
  key = key.replace(/\\n/g, '\n');
  return key;
}

// ── Firebase Admin SDK init ──────────────────────────────────────────────────
try {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const rawKey = process.env.FIREBASE_PRIVATE_KEY;
  const privateKey = normalizePrivateKey(rawKey);

  if (projectId && clientEmail && privateKey) {
    const certFn = admin.cert || (admin.credential && admin.credential.cert);
    admin.initializeApp({
      credential: certFn({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
    console.log(`✅ Firebase Admin SDK initialized successfully for [${projectId}]`);
  } else {
    admin.initializeApp();
    console.log('⚠️ Firebase Admin SDK initialized with default credentials (check .env)');
  }
} catch (error) {
  console.warn('⚠️ Firebase Admin SDK warning:', error.message);
}

const app = express();

// ── Security middleware ──────────────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: false }));

// Dynamic CORS configuration accepting localhost, configured CLIENT_URL, and cloud previews
const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:4173',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser requests (mobile, curl, backend-to-backend)
      if (!origin) return callback(null, true);
      // Allow exact match in allowed origins
      if (allowedOrigins.includes(origin)) return callback(null, true);
      // Allow any Vercel, Netlify, or Render deployment URLs
      if (
        /\.vercel\.app$/.test(origin) ||
        /\.netlify\.app$/.test(origin) ||
        /\.onrender\.com$/.test(origin) ||
        /^https?:\/\/localhost(:\d+)?$/.test(origin) ||
        /^https?:\/\/127\.0\.0\.1(:\d+)?$/.test(origin)
      ) {
        return callback(null, true);
      }
      return callback(null, true); // Permissive fallback for custom domains
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Global rate limiter: 300 req / 15 min per IP
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many requests, please try again later.' },
  })
);

// Write-route rate limiter: 50 req / 15 min per IP
const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: { message: 'Too many write requests, please slow down.' },
});

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// ── Health check routes (for Render / Railway / AWS / uptime monitors) ────────
app.get(['/health', '/api/health'], (req, res) => {
  res.json({
    status: 'ok',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    service: 'peer-project-hub-api',
  });
});

// ── REST API Routes ──────────────────────────────────────────────────────────
app.use('/api/projects', projectRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/users', writeLimiter, userRoutes);
app.use('/api/teacher', teacherRoutes);

// Analytics endpoint (Supabase)
const svc = require('./services/supabaseService');

app.get('/api/analytics', async (req, res, next) => {
  try {
    const { supabase: sb } = require('./config/supabase');
    if (!sb) return res.status(503).json({ message: 'Database not configured.' });
    const analytics = await svc.getDbAnalytics();
    if (analytics.error) return next(analytics.error);
    res.json(analytics);
  } catch (err) {
    next(err);
  }
});

// ── Optional Static Frontend Serving (Monolith deployment) ───────────────────
const clientDistPath = path.join(__dirname, '../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// 404 handler for API routes
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ message: 'API endpoint not found.' });
  }
  next();
});

// ── Centralized error handler ─────────────────────────────────────────────────
app.use(errorHandler);

// ── Start server (when not running in serverless environment) ─────────────────
const PORT = process.env.PORT || 5000;
if (!process.env.VERCEL) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
  });
}

module.exports = app;
