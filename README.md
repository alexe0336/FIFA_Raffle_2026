# ⚽ FIFA World Cup 2026 Raffle

A static, read-only website for a 2026 World Cup raffle. It displays the seeded
team draw, the raffle rules, and tiebreaker logic. There is no backend, no
database, and no user input — every page is pre-rendered and served as static
files by Nginx.

## Run it

```bash
docker compose up --build -d
```

Then open http://localhost:3100

## Stack

- **Nginx** (`nginx:alpine`) serves the static files in `public/`.
- **No Node.js / no runtime** — `index.html`, `style.css`, `fonts.css`,
  `draw.js`, and self-hosted fonts are all the site is.
- Security headers (CSP, X-Frame-Options, etc.) are set in `nginx.conf`.
- Google Fonts are self-hosted in `public/fonts/` — no external CDN calls.
