const express = require('express');
const path = require('path');
const helmet = require('helmet');

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
      imgSrc:     ["'self'"],
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
  }
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// ── Static files ───────────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));

// ── Routes ─────────────────────────────────────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// ── Start ──────────────────────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  console.log(`⚽  World Cup tracker server running on port ${PORT}`);
});
