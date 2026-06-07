const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3100;

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

// ── Start ──────────────────────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  console.log(`⚽  World Cup tracker server running on port ${PORT}`);
});
