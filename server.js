const express = require('express');
const fs = require('fs');
const path = require('path');
const { stringify } = require('csv-stringify/sync');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Allowed origin for CORS — set via env var in production (e.g. https://yoursite.com)
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || null;

const app = express();
const PORT = process.env.PORT || 3100;

const DATA_DIR = process.env.DATA_DIR || '/data';
const ENTRIES_FILE = path.join(DATA_DIR, 'entries.csv');
const BUY_IN = 20;

// In-memory entry count — avoids re-reading the CSV on every /api/entries/count request
let entryCount = 0;

// Input limits
const MAX_NAME_LEN = 120;
const MAX_CONTACT_LEN = 200;
// Characters that trigger formula execution in spreadsheets
const FORMULA_RE = /^[=+\-@\t\r]/;

function ensureDataFiles() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(ENTRIES_FILE)) {
    fs.writeFileSync(ENTRIES_FILE, 'timestamp,full_name,contact,buy_in_vote\n');
  }
}
ensureDataFiles();

// Seed in-memory count from existing CSV on startup
try {
  const lines = fs.readFileSync(ENTRIES_FILE, 'utf8').trim().split('\n').filter(Boolean);
  entryCount = Math.max(0, lines.length - 1);
} catch { entryCount = 0; }

// ── Security middleware ────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc:  ["'self'"],                      // no unsafe-inline — JS lives in app.js
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
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  }
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// ── General middleware ─────────────────────────────────────────────────────
app.use(express.json({ limit: '4kb' }));
app.use(express.static(path.join(__dirname, 'public')));

// ── Rate limiters ──────────────────────────────────────────────────────────
const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many sign-up attempts. Please try again in 15 minutes.' },
});

const countLimiter = rateLimit({
  windowMs: 60 * 1000,  // 1 minute
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
});

// ── Routes ─────────────────────────────────────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Tournament data served through API so it is never a raw public static file
app.get('/api/tournament', (req, res) => {
  try {
    const data = fs.readFileSync(
      path.join(__dirname, 'data', 'tournament.json'), 'utf8'
    );
    res.type('application/json').send(data);
  } catch {
    res.status(500).json({ error: 'Tournament data unavailable.' });
  }
});

// Entry count — served from in-memory cache, rate limited
app.get('/api/entries/count', countLimiter, (req, res) => {
  res.json({ count: entryCount });
});

// Submit registration — rate-limited
app.post('/api/register', registerLimiter, (req, res) => {
  const { full_name, contact } = req.body;

  if (!full_name || typeof full_name !== 'string') {
    return res.status(400).json({ error: 'Valid full name is required.' });
  }
  if (!contact || typeof contact !== 'string') {
    return res.status(400).json({ error: 'Email or phone number is required.' });
  }

  const name = full_name.trim();
  const info = contact.trim();

  if (name.length < 2)   return res.status(400).json({ error: 'Full name is too short.' });
  if (name.length > MAX_NAME_LEN)
    return res.status(400).json({ error: `Name must be ${MAX_NAME_LEN} characters or fewer.` });
  if (info.length < 3)   return res.status(400).json({ error: 'Contact info is too short.' });
  if (info.length > MAX_CONTACT_LEN)
    return res.status(400).json({ error: `Contact info must be ${MAX_CONTACT_LEN} characters or fewer.` });

  // Block spreadsheet formula injection
  if (FORMULA_RE.test(name) || FORMULA_RE.test(info)) {
    return res.status(400).json({ error: 'Invalid characters in submission.' });
  }

  const row = stringify([[new Date().toISOString(), name, info, BUY_IN]]);
  fs.appendFile(ENTRIES_FILE, row, (err) => {
    if (err) {
      console.error('Write error:', err);
      return res.status(500).json({ error: 'Failed to save your entry. Please try again.' });
    }
    entryCount++;
    res.json({ success: true, message: "You're in! 🏆" });
  });
});

// ── Start ──────────────────────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  console.log(`⚽  World Cup tracker server running on port ${PORT}`);
});
