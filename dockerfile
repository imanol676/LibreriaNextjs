
# Install dependencies only when needed
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY nextjsLibreria/package.json nextjsLibreria/package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY nextjsLibreria/ ./

# Set build-time environment variables
ARG MONGODB_URL
ARG JWT_SECRET

# Generate Prisma Client
RUN npx prisma generate

# Build Next.js application
RUN npm run build

# Install production dependencies only
FROM node:20-alpine AS prod-deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY nextjsLibreria/package.json nextjsLibreria/package-lock.json* ./
RUN npm ci --omit=dev

# Production image, copy all the files and run next
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
# Disable telemetry during build.
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy the standalone output
COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=prod-deps --chown=nextjs:nodejs /app/node_modules ./node_modules

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
