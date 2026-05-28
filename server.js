const express = require('express');
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const { stringify } = require('csv-stringify/sync');

const app = express();
const PORT = process.env.PORT || 3000;

// Persistent data directory (Docker volume mount point)
const DATA_DIR = process.env.DATA_DIR || '/data';
const ENTRIES_FILE = path.join(DATA_DIR, 'entries.csv');
const BUY_IN = 20; // Fixed buy-in amount

// ── Ensure data directory and files exist ──────────────────────────────────
function ensureDataFiles() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

  if (!fs.existsSync(ENTRIES_FILE)) {
    fs.writeFileSync(ENTRIES_FILE, 'timestamp,full_name,contact,buy_in_vote\n');
  }


}
ensureDataFiles();

// ── Middleware ─────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── 2026 World Cup Countries (48 teams) ───────────────────────────────────
const COUNTRIES = [
  // CONCACAF Hosts
  { name: 'United States',    code: 'us', confederation: 'CONCACAF' },
  { name: 'Canada',           code: 'ca', confederation: 'CONCACAF' },
  { name: 'Mexico',           code: 'mx', confederation: 'CONCACAF' },
  // CONCACAF Qualifiers
  { name: 'Panama',           code: 'pa', confederation: 'CONCACAF' },
  { name: 'Honduras',         code: 'hn', confederation: 'CONCACAF' },
  { name: 'Jamaica',          code: 'jm', confederation: 'CONCACAF' },
  // CONMEBOL
  { name: 'Argentina',        code: 'ar', confederation: 'CONMEBOL' },
  { name: 'Brazil',           code: 'br', confederation: 'CONMEBOL' },
  { name: 'Colombia',         code: 'co', confederation: 'CONMEBOL' },
  { name: 'Uruguay',          code: 'uy', confederation: 'CONMEBOL' },
  { name: 'Ecuador',          code: 'ec', confederation: 'CONMEBOL' },
  { name: 'Paraguay',         code: 'py', confederation: 'CONMEBOL' },
  // UEFA
  { name: 'France',           code: 'fr', confederation: 'UEFA' },
  { name: 'England',          code: 'gb-eng', confederation: 'UEFA' },
  { name: 'Germany',          code: 'de', confederation: 'UEFA' },
  { name: 'Spain',            code: 'es', confederation: 'UEFA' },
  { name: 'Portugal',         code: 'pt', confederation: 'UEFA' },
  { name: 'Netherlands',      code: 'nl', confederation: 'UEFA' },
  { name: 'Belgium',          code: 'be', confederation: 'UEFA' },
  { name: 'Italy',            code: 'it', confederation: 'UEFA' },
  { name: 'Croatia',          code: 'hr', confederation: 'UEFA' },
  { name: 'Switzerland',      code: 'ch', confederation: 'UEFA' },
  { name: 'Denmark',          code: 'dk', confederation: 'UEFA' },
  { name: 'Austria',          code: 'at', confederation: 'UEFA' },
  { name: 'Scotland',         code: 'gb-sct', confederation: 'UEFA' },
  { name: 'Serbia',           code: 'rs', confederation: 'UEFA' },
  { name: 'Turkey',           code: 'tr', confederation: 'UEFA' },
  { name: 'Hungary',          code: 'hu', confederation: 'UEFA' },
  { name: 'Romania',          code: 'ro', confederation: 'UEFA' },
  { name: 'Slovenia',         code: 'si', confederation: 'UEFA' },
  { name: 'Slovakia',         code: 'sk', confederation: 'UEFA' },
  { name: 'Albania',          code: 'al', confederation: 'UEFA' },
  // CAF
  { name: 'Morocco',          code: 'ma', confederation: 'CAF' },
  { name: 'Nigeria',          code: 'ng', confederation: 'CAF' },
  { name: 'Senegal',          code: 'sn', confederation: 'CAF' },
  { name: "Côte d'Ivoire",    code: 'ci', confederation: 'CAF' },
  { name: 'Egypt',            code: 'eg', confederation: 'CAF' },
  { name: 'Cameroon',         code: 'cm', confederation: 'CAF' },
  { name: 'Ghana',            code: 'gh', confederation: 'CAF' },
  { name: 'Tunisia',          code: 'tn', confederation: 'CAF' },
  { name: 'DR Congo',         code: 'cd', confederation: 'CAF' },
  // AFC
  { name: 'Japan',            code: 'jp', confederation: 'AFC' },
  { name: 'South Korea',      code: 'kr', confederation: 'AFC' },
  { name: 'Iran',             code: 'ir', confederation: 'AFC' },
  { name: 'Australia',        code: 'au', confederation: 'AFC' },
  { name: 'Saudi Arabia',     code: 'sa', confederation: 'AFC' },
  { name: 'Jordan',           code: 'jo', confederation: 'AFC' },
  // OFC
  { name: 'New Zealand',      code: 'nz', confederation: 'OFC' },
  // Playoff
  { name: 'Iraq',             code: 'iq', confederation: 'AFC' },
];

// ── Routes ─────────────────────────────────────────────────────────────────

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Countries list
app.get('/api/countries', (req, res) => res.json(COUNTRIES));

// Buy-in amount (fixed)
app.get('/api/buyin', (req, res) => res.json({ amount: BUY_IN }));

// Get entry count (no PII exposed)
app.get('/api/entries/count', (req, res) => {
  try {
    const content = fs.readFileSync(ENTRIES_FILE, 'utf8').trim();
    const lines = content.split('\n').filter(Boolean);
    // subtract header row
    const count = Math.max(0, lines.length - 1);
    res.json({ count });
  } catch {
    res.json({ count: 0 });
  }
});

// Submit registration
app.post('/api/register', (req, res) => {
  const { full_name, contact } = req.body;

  if (!full_name || typeof full_name !== 'string' || full_name.trim().length < 2) {
    return res.status(400).json({ error: 'Valid full name is required.' });
  }
  if (!contact || typeof contact !== 'string' || contact.trim().length < 3) {
    return res.status(400).json({ error: 'Email or phone number is required.' });
  }

  const timestamp = new Date().toISOString();
  const row = stringify([[timestamp, full_name.trim(), contact.trim(), BUY_IN]]);

  try {
    fs.appendFileSync(ENTRIES_FILE, row);
    res.json({ success: true, message: "You're in! See you at the draw on June 6th 🏆" });
  } catch (err) {
    console.error('Write error:', err);
    res.status(500).json({ error: 'Failed to save your entry. Please try again.' });
  }
});

// ── Start ──────────────────────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  console.log(`⚽  World Cup Raffle server running on port ${PORT}`);
  console.log(`📂  Data directory: ${DATA_DIR}`);
});
