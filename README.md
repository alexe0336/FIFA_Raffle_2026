# ⚽ FIFA World Cup 2026 Raffle — Full Deployment Guide

A self-hosted raffle website for the 2026 World Cup. Runs in Docker, exposed
via Cloudflare Zero Trust tunnel (no open ports on your server), with a
persistent CSV-backed data store that survives container restarts.

---

## Stack at a Glance

| Layer        | Tech                                        |
|--------------|---------------------------------------------|
| Backend      | Node.js 20 + Express                        |
| Frontend     | Vanilla HTML / CSS / JS                     |
| Persistence  | CSV + JSON in a Docker named volume         |
| Container    | Docker + Docker Compose                     |
| Tunnel       | Cloudflare Zero Trust (`cloudflared`)       |
| Domain       | Cloudflare-registered domain                |

---

## STEP 0 — Prerequisites

Install on your Linux server:

```bash
# Docker Engine (Ubuntu/Debian)
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER   # log out & back in after this

# Docker Compose plugin (included with Docker Engine >= 23)
docker compose version          # should print v2.x

# Verify
docker run --rm hello-world
```

---

## STEP 1 — Buy Your Domain on Cloudflare

1. Log in to [dash.cloudflare.com](https://dash.cloudflare.com)
2. Left sidebar → **Domain Registration → Register Domains**
3. Search for your desired name (e.g. `worldcup2026raffle.com`)
4. Purchase — Cloudflare is at-cost for most TLDs (~$10/yr for `.com`)
5. The domain auto-creates a Cloudflare zone. **Leave nameservers as-is.**
   Cloudflare manages DNS natively for domains registered here.

---

## STEP 2 — Set Up a Cloudflare Zero Trust Account

1. In the Cloudflare dashboard, click **Zero Trust** (left sidebar or
   [one.dash.cloudflare.com](https://one.dash.cloudflare.com))
2. Choose a team name (e.g. `myworldcupraffle`) — this is your org slug
3. Select the **Free plan** (handles thousands of requests, plenty for this)

---

## STEP 3 — Create the Tunnel

Inside Zero Trust dashboard:

1. **Networks → Tunnels → Create a tunnel**
2. Choose **Cloudflared** (the connector type)
3. Name it: `worldcup-raffle`
4. Click **Save tunnel**
5. Under *"Install and run a connector"*, copy the **tunnel token** —
   it looks like `eyJhIjoiYWJj...` (a long JWT string)
6. Click **Next** — you'll configure the route in the next step

---

## STEP 4 — Configure the Public Hostname

Still in the tunnel config:

1. **Add a public hostname**:
   - **Subdomain**: leave blank (or use `www`)
   - **Domain**: select your domain from the dropdown
   - **Path**: leave blank
   - **Type**: `HTTP`
   - **URL**: `web:3000`  ← this is the Docker service name + port

   > The tunnel container and the web container share the `internal` Docker
   > network, so `web:3000` resolves to the Express app directly.

2. Click **Save hostname** → **Save tunnel**

Cloudflare will automatically create a CNAME DNS record pointing your domain
to the tunnel. No further DNS config needed.

---

## STEP 5 — Clone / Copy Project to Your Server

```bash
# On your server
mkdir -p /srv/worldcup && cd /srv/worldcup

# Copy all project files here (scp, rsync, git clone, etc.)
# Your directory should look like:
# /srv/worldcup/
# ├── Dockerfile
# ├── docker-compose.yml
# ├── server.js
# ├── package.json
# ├── .env.example
# ├── .dockerignore
# └── public/
#     ├── index.html
#     ├── style.css
#     └── script.js
```

---

## STEP 6 — Create Your .env File

```bash
cd /srv/worldcup
cp .env.example .env
nano .env   # or vim, whatever you prefer
```

Paste your tunnel token:

```env
CLOUDFLARE_TUNNEL_TOKEN=eyJhIjoiYWJj...your...full...token...here
```

Save and close. Verify permissions:

```bash
chmod 600 .env    # only your user can read it
```

---

## STEP 7 — Build and Launch

```bash
cd /srv/worldcup

# Build the image and start both services in the background
docker compose up -d --build

# Watch logs to confirm everything started
docker compose logs -f
```

Expected output:
```
worldcup_web     | ⚽  World Cup Raffle server running on port 3000
worldcup_web     | 📂  Data directory: /data
worldcup_tunnel  | INF Starting tunnel...
worldcup_tunnel  | INF Registered tunnel connection connIndex=0
```

Visit your domain — the site should be live within ~30 seconds of the tunnel
connecting.

---

## STEP 8 — Verify Persistence

Data is stored in a Docker **named volume** (`raffle_data`), which lives at:

```
/var/lib/docker/volumes/worldcup_raffle_data/_data/
├── entries.csv    ← one row per registration
└── votes.json     ← live vote tallies
```

Test persistence:

```bash
# Submit a test entry on the website, then:
docker compose down          # stop and remove containers
docker compose up -d         # restart
# Your entry is still there ✓
```

To inspect the CSV directly:

```bash
docker exec worldcup_web cat /data/entries.csv
```

---

## STEP 9 — Automatic Restart on Server Reboot

Both services use `restart: unless-stopped`, so they auto-start with Docker.
Make sure Docker itself starts on boot:

```bash
sudo systemctl enable docker
sudo systemctl status docker   # should show "enabled"
```

---

## STEP 10 — (Optional) Cloudflare Access Policy

Since this is a public raffle site you probably want it open, but if you
ever want to password-protect it:

1. Zero Trust → **Access → Applications → Add an application**
2. Choose **Self-hosted**
3. Set the domain to your raffle domain
4. Add a policy: e.g. allow `everyone`, or restrict by email/IP

---

## Useful Commands

```bash
# View live logs
docker compose logs -f

# Restart after code changes
docker compose up -d --build

# Shell into the web container
docker exec -it worldcup_web sh

# Download the CSV to your local machine
docker cp worldcup_web:/data/entries.csv ./entries_backup.csv

# Stop everything
docker compose down

# Stop and wipe the data volume (DESTRUCTIVE)
docker compose down -v
```

---

## File Structure

```
/srv/worldcup/
├── Dockerfile            # Multi-stage, non-root user, healthcheck
├── docker-compose.yml    # web + cloudflared, named volume
├── server.js             # Express API + static file serving
├── package.json
├── .env                  # Tunnel token (DO NOT COMMIT)
├── .dockerignore
└── public/
    ├── index.html        # Full single-page site
    ├── style.css         # Stadium-night dark theme
    └── script.js         # Fetch, render, vote, register
```

---

## Security Notes

- The web container is **not** exposed to the host network. Port 3000 is only
  reachable by the `cloudflared` sidecar on the internal Docker bridge.
- Cloudflare terminates TLS — your server never needs an SSL certificate.
- The tunnel token is the only secret; keep it in `.env`, never in git.
- Input is validated on both client and server before writing to disk.
