# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app
# better-sqlite3 requires native compilation tools
RUN apk add --no-cache python3 make g++
COPY package*.json ./
RUN npm ci

# Stage 2: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Stage 3: Runtime
# ---------------------------------------------------------------------------
# Resource limits for k8s scheduling (reference values, not enforced in Docker):
#   requests:  cpu: 100m,  memory: 256Mi
#   limits:    cpu: 500m,  memory: 512Mi
# ---------------------------------------------------------------------------
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Create writable data directory owned by nextjs (before USER switch so chown runs as root).
RUN mkdir -p /app/data && chown nextjs:nodejs /app/data

COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy node_modules needed for database initialization scripts
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules

# Copy scripts for database initialization (needed by entrypoint)
COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts
COPY --from=builder --chown=nextjs:nodejs /app/data ./data
COPY --from=builder --chown=nextjs:nodejs /app/package*.json ./

# Create cache directory with correct ownership for Next.js runtime writes
RUN mkdir -p /app/.next/cache && chown -R nextjs:nodejs /app/.next

USER nextjs

EXPOSE 3000
# PORT can be overridden via env var by k8s (k8s injects via containerPort)
ENV PORT=3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health/live || exit 1

ENTRYPOINT ["node", "scripts/docker-entrypoint.mjs"]
CMD ["node", "server.js"]
