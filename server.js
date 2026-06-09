const express = require('express');
const fs = require('fs');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Allowed origin for CORS — set via env var in production (e.g. https://yoursite.com)
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || null;

const app = express();
const PORT = process.env.PORT || 3100;

// ── Security middleware ────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc:  ["'self'"],
      styleSrc:   ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc:    ["'self'", 'https://fonts.gstatic.com'],
      imgSrc:     ["'self'", 'https://flagcdn.com', 'https://images.unsplash.com', 'data:'],
      connectSrc: ["'self'"],
    },
  },
}));

// ── CORS — only allow requests from the configured origin ─────────────────
app.use(function(req, res, next) {
  const origin = req.headers.origin;
  if (ALLOWED_ORIGIN && origin === ALLOWED_ORIGIN) {
    res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  }
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// ── General middleware ─────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));

// ── Rate limiter for API routes ────────────────────────────────────────────
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
});

// ── Routes ─────────────────────────────────────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Tournament data served through API so it is never a raw public static file
app.get('/api/tournament', apiLimiter, (req, res) => {
  try {
    const data = fs.readFileSync(
      path.join(__dirname, 'data', 'tournament.json'), 'utf8'
    );
    res.type('application/json').send(data);
  } catch {
    res.status(500).json({ error: 'Tournament data unavailable.' });
  }
});

// ── Start ──────────────────────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  console.log(`⚽  World Cup tracker server running on port ${PORT}`);
});
