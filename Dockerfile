# ── Stage 1: Install dependencies ────────────────────────────────────────
FROM oven/bun:1.3 AS deps

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# ── Stage 2: Production image ────────────────────────────────────────────
FROM oven/bun:1.3-slim AS runner

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source code and config
COPY package.json bun.lock tsconfig.json drizzle.config.ts ./
COPY src ./src

# Expose port
ENV PORT=3000
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD bun -e "fetch('http://localhost:3000/health').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

# Start the app
CMD ["bun", "run", "src/main.ts"]
