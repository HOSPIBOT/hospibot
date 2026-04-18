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

RUN ls -la dist/src/main.js && echo "✅ dist/src/main.js exists"

RUN npm prune --production

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

CMD sh -c "echo 'Running prisma db push...' && PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1 npx prisma db push --accept-data-loss && echo 'Running prisma db seed (idempotent upserts)...' && (PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1 npx prisma db seed || echo '⚠️  Seed failed but continuing — check logs') && echo 'Database ready!' && node dist/src/main"
