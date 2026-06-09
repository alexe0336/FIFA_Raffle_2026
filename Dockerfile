# ── Stage 1: Install dependencies ─────────────────────────────────────────
FROM node:20-alpine AS deps

WORKDIR /app
COPY package*.json ./
# Install production deps only
RUN npm ci --omit=dev

# ── Stage 2: Final image ───────────────────────────────────────────────────
FROM node:20-alpine

# Non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Copy deps from stage 1
COPY --from=deps /app/node_modules ./node_modules

# Copy application source
COPY server.js ./
COPY public/   ./public/
# Copy tournament data as root and lock it read-only so the app process cannot modify it
COPY --chown=root:root data/ ./data/
RUN chmod -R 444 ./data/

# Persistent data volume mount point
# (actual volume is declared in docker-compose.yml)
RUN mkdir -p /data && chown appuser:appgroup /data

USER appuser

ENV PORT=3100
ENV DATA_DIR=/data
ENV NODE_ENV=production

EXPOSE 3100

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3100/health || exit 1

CMD ["node", "server.js"]
