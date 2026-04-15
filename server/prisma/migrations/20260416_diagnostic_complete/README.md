# Diagnostic Portal Migration Guide

## Apply database migration (Supabase)

```bash
cd server

# Option A — Prisma migrate (recommended for local/staging)
npx prisma migrate dev --name diagnostic_portal_complete

# Option B — Direct SQL (production Supabase)
# Copy the SQL from prisma/migrations/20260416_diagnostic_complete/migration.sql
# Run in Supabase SQL Editor (https://app.supabase.com → SQL Editor)

# After migration, regenerate Prisma client
npx prisma generate
```

## Seed recharge packs and default data

```bash
cd server
npx prisma db seed
```

## Environment variables required

Add to Railway (backend) `.env`:

```
# AWS S3 — for PDF report storage
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
S3_BUCKET=hospibot-reports

# Razorpay — for wallet recharge
RAZORPAY_KEY_ID=rzp_live_xxxxx
RAZORPAY_KEY_SECRET=your_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret

# Report delivery URL
FRONTEND_URL=https://hospibot-web.vercel.app

# HospiBot GSTIN (for invoice generation)
HOSPIBOT_GSTIN=29AAACI1681G1ZJ
```

## Frontend deployment (Vercel)

```bash
cd apps/web
# No new env vars needed — uses existing NEXT_PUBLIC_API_URL
```

## Post-deployment checklist

- [ ] Run SQL migration on Supabase
- [ ] Run `npx prisma generate` on Railway
- [ ] Add env vars on Railway
- [ ] Seed recharge packs: `npx prisma db seed`
- [ ] Set up Razorpay webhook: `POST /api/v1/diagnostic/billing/webhook/razorpay`
- [ ] Configure WhatsApp Business API phone number ID in tenant settings
- [ ] Seed default test catalog per tenant: `POST /api/v1/diagnostic/catalog/seed`
- [ ] Create initial pathologist user with role PATHOLOGIST
- [ ] Verify Critical Value Alert flow end-to-end

## What was built (Phase 1 + 2 + 3)

### Backend
- `DiagnosticModule` — 50+ API endpoints at `/api/v1/diagnostic/*`
- `DiagnosticService` — 8-stage lifecycle, result entry, critical values, vault save
- `DiagnosticBillingService` — Razorpay wallet recharge, invoice generation
- `DiagnosticReportService` — HTML report builder, S3 PDF upload, patient viewer
- SchedulerService additions — Revenue Engine cron, TAT escalation, critical ACK timeout
- WhatsApp webhook — ACK handling, BOOK/STOP response processing

### Schema
- 25 new tables + LabOrder extensions
- All indexes optimized for multi-tenant queries

### Frontend
- 20 pages for the diagnostic portal
- Public report viewer at `/report/[orderId]?token=xxx`
- Real Razorpay checkout for wallet recharges
