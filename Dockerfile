# ============================================
# CineWeb — Multi-stage Dockerfile
# Stage 1: Build frontend (Vite/React)
# Stage 2: Production server (Node + Nginx)
# ============================================

# --- Stage 1: Build frontend ---
FROM node:20-alpine AS frontend-build

WORKDIR /app

# Copy frontend package files
COPY package.json package-lock.json* ./
RUN npm ci --ignore-scripts

# Copy frontend source
COPY index.html vite.config.js ./
COPY public/ ./public/
COPY src/ ./src/

# Build args for Vite env vars (injected at build time)
ARG VITE_TMDB_API_KEY
ARG VITE_API_URL
ARG VITE_GOOGLE_CLIENT_ID

# Build frontend
RUN npm run build

# --- Stage 2: Production ---
FROM node:20-alpine AS production

RUN apk add --no-cache nginx tini

WORKDIR /app

# Copy backend package files & install
COPY server/package.json server/package-lock.json* ./server/
RUN cd server && npm ci --omit=dev

# Copy backend source
COPY server/ ./server/

# Copy built frontend
COPY --from=frontend-build /app/dist ./dist

# Copy nginx config
COPY nginx.conf /etc/nginx/http.d/default.conf

# Copy entrypoint
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Create data directory for SQLite
RUN mkdir -p /app/server/data

# Expose port 80 (Nginx) — Traefik/Coolify will route to this
EXPOSE 80

# Use tini for proper signal handling
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["/docker-entrypoint.sh"]
