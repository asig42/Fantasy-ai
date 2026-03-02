# ─── Stage 1: Build ───────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Build React frontend
RUN npm run build

# Build TypeScript server
RUN npm run build:server

# ─── Stage 2: Production ──────────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

# Copy built artifacts
COPY --from=builder /app/dist ./dist

# Create persistent data directories
RUN mkdir -p data/sessions public/images/map public/images/npcs public/images/scenes

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["node", "dist/server/server/index.js"]
