# Build: 2026-04-16 HospiBot v2
FROM node:18-bullseye-slim

RUN apt-get update && apt-get install -y openssl libssl-dev ca-certificates && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

# Install deps
RUN npm install

# Generate Prisma client
RUN PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1 npx prisma generate

COPY . .

RUN npm run build

# Create dist/main.js shim so Railway works whether its (possibly cached)
# dashboard startCommand is `node dist/main` or `node dist/src/main`.
# Both paths will work — they both end up executing dist/src/main.js.
RUN echo "require('./src/main');" > dist/main.js

RUN ls -la dist/src/main.js dist/main.js && echo "✅ both entrypoints exist"

# Do NOT run `npm prune --production` here.
# The runtime CMD below calls `npx prisma db push` and `npx prisma db seed`,
# both of which require the `prisma` CLI and `ts-node` — which are
# devDependencies. A prior version of this Dockerfile pruned them and the
# container then hung on boot (Railway healthcheck timed out after 5 min).
# The ~80 MB savings from pruning is not worth the debug nightmare.

EXPOSE 4000

# Default env vars — override these in Railway dashboard with real values
ENV NODE_ENV=production
ENV PORT=4000
ENV API_PREFIX=api/v1

# These MUST be set in Railway → Variables tab
# DATABASE_URL — your Supabase connection string
# JWT_SECRET — random 64-char string
# JWT_REFRESH_SECRET — different random 64-char string

# Optional — set these for full functionality
# SUPER_ADMIN_EMAIL — defaults to admin@hospibot.in
# SUPER_ADMIN_PASSWORD — defaults to HospiBot@2026! (CHANGE THIS)
# RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET / RAZORPAY_WEBHOOK_SECRET
# AWS_REGION / AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY / S3_BUCKET
# FRONTEND_URL — your Vercel URL
# HOSPIBOT_GSTIN — your GST number
# WHATSAPP_PHONE_NUMBER_ID / WHATSAPP_ACCESS_TOKEN

# Runtime startup sequence:
#   1. prisma db push (sync, bounded to 60s) — creates/alters tables for
#      any schema additions since last deploy. Uses --skip-generate since
#      the client was already generated at build time.
#   2. If db push hangs or fails, we log and start the app anyway — the
#      container must come up so Railway healthcheck passes. Requests that
#      depend on missing tables will 500, but the container is "up".
#   3. Seed runs in the background 15s after boot so it doesn't block
#      healthcheck. Seed is idempotent (upserts).
#   4. node dist/src/main starts the NestJS app on $PORT.
CMD sh -c '\
echo "═══════════════════════════════════════════════════════════" && \
echo "HospiBot API — boot sequence" && \
echo "Node: $(node --version)   PORT: ${PORT:-4000}   DB: ${DATABASE_URL:+set}${DATABASE_URL:-UNSET!}" && \
echo "═══════════════════════════════════════════════════════════" && \
echo "[1/3] Running prisma db push (60s timeout)..." && \
timeout 60 env PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1 npx prisma db push --accept-data-loss --skip-generate \
  && echo "      ✅ db push complete" \
  || echo "      ⚠️  db push failed or timed out — starting app anyway" ; \
echo "[2/3] Scheduling background seed (idempotent, starts in 15s)..." && \
( sleep 15 && \
  PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1 npx prisma db seed \
  && echo "      ✅ seed complete" \
  || echo "      ⚠️  seed failed — see logs above" \
) & \
echo "[3/3] Starting node dist/src/main..." && \
exec node dist/src/main'
