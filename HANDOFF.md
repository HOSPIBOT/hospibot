# HospiBot — Complete Handoff Document

## Live URLs
- **Frontend:** https://hospibot-web.vercel.app  
- **GitHub:** https://github.com/HOSPIBOT/hospibot  
- **Token:** [REDACTED — set in .env or CI/CD secrets]

## Tech Stack
| Layer | Technology |
|---|---|
| Frontend | Next.js 14, Tailwind CSS, Recharts, Zustand |
| Backend | NestJS, Prisma ORM |
| Database | Supabase PostgreSQL |
| Hosting | Vercel (frontend), Railway (backend) |
| Auth | JWT (short-lived) + refresh tokens |

## Environment Variables

### Backend (Railway)
```
DATABASE_URL=postgresql://...
JWT_SECRET=...
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
WHATSAPP_WEBHOOK_VERIFY_TOKEN=hospibot-webhook-verify
RAZORPAY_KEY_ID=rzp_live_...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...
ABHA_CLIENT_ID=...          # NHA developer portal
ABHA_CLIENT_SECRET=...
APP_URL=https://hospibot-web.vercel.app
```

### Frontend (Vercel)
```
NEXT_PUBLIC_API_URL=https://your-api.railway.app/api/v1
NEXT_PUBLIC_ROOT_DOMAIN=hospibot.in
```

## Portal Architecture

| Portal | URL Pattern | Color |
|---|---|---|
| Clinical / Hospital | /clinical/* | Teal #0D7C66 |
| Diagnostic / Lab | /diagnostic/* | Navy #1E3A5F |
| Pharmacy | /pharmacy/* | Forest #166534 |
| Home Care | /homecare/* | Purple #6B21A8 |
| Equipment | /equipment/* | Steel #1E40AF |
| Wellness | /wellness/* | Crimson #BE185D |
| Super Admin | /super-admin/* | Slate |

## Key User Flows

### Full OPD Flow
1. `/clinical/appointments` → Book appointment or check in patient
2. `/clinical/appointments/queue` → Live queue board (Kiosk mode for TV)
3. `/clinical/visits/[appointmentId]` → OPD Console (vitals, notes, Rx, bill)
4. `/clinical/billing/[id]` → Print invoice / Razorpay Pay Now

### Prescription → WhatsApp
1. Doctor opens OPD Console → Rx tab
2. Adds medications (autocomplete, voice dictation supported)
3. Clicks "Save Prescription" → saved to DB + auto-sent to patient WhatsApp

### Lab Order → Report Delivery
1. Create lab order → barcode generated, WhatsApp confirmation to patient
2. Collect sample → status update → WhatsApp "Sample Collected"
3. Upload report URL → auto-WhatsApp PDF link to patient → added to Health Vault

### Health Vault Consent Flow
1. Staff looks up patient by phone → /clinical/vault
2. System sends WhatsApp to patient with 4 consent options
3. Patient replies 1/2/3/4 → consent recorded
4. Staff sees cross-provider history (respects scope)

## Backend Modules (22 total)
```
Auth, Tenant, Patient, Doctor, Appointment, Billing,
WhatsApp, CRM, Automation, Analytics, Portal, SuperAdmin,
Chatbot, Scheduler, Vault, Lab, Pharmacy, Marketplace,
Security, Prescription, Visit, (AbhaModule planned)
```

## Database Tables (40+)
Core: tenants, users, patients, doctors, appointments, invoices, payments  
Clinical: visits, prescriptions, lab_orders, beds  
Pharmacy: pharmacy_products, pharmacy_batches, dispensing_orders, suppliers, purchase_orders  
WhatsApp: conversations, messages, whatsapp_templates, chatbot_states  
CRM: leads, campaigns, automation_rules, automation_logs, automation_jobs  
Vault: universal_health_records, health_records, consent_grants, consent_audit_log  
Marketplace: marketplace_products, marketplace_orders  
Platform: portal_families, tenant_sub_types, portal_themes, platform_assets  
Security: audit_logs, announcements  

## WhatsApp Chatbot Intents (14)
BOOKING, REPORT, BILLING, PRESCRIPTION, RECORDS, EMERGENCY,
HUMAN, GREETING, CONFIRM, CANCEL, BOOK_NOW, REMIND_LATER, NOT_NEEDED,
plus self-service vault commands

## Scheduled Jobs (Cron)
| Job | Schedule | Purpose |
|---|---|---|
| processAutomationJobs | Every 5 min | Execute pending automation jobs |
| scanTimeElapsed | Every hour | Check TIME_ELAPSED automation rules |
| sendAppointmentReminders | 8:00 AM IST | Next-day appointment WhatsApp reminders |
| sendRefillReminders | 8:00 AM IST | 5-day prescription refill WhatsApp reminders |

## External Integrations
| Service | Purpose | Config |
|---|---|---|
| Meta WhatsApp Business API | Messaging | PHONE_NUMBER_ID + ACCESS_TOKEN per tenant |
| Razorpay | Payments | RAZORPAY_KEY_ID + KEY_SECRET in backend env |
| NHA ABDM | ABHA health ID | ABHA_CLIENT_ID + CLIENT_SECRET |
| Supabase | PostgreSQL DB | DATABASE_URL |
| Railway | Backend hosting | Auto-deploys from main branch |
| Vercel | Frontend hosting | Auto-deploys from main branch |

## After Deployment (run on Railway)
```bash
npx prisma migrate deploy
npx prisma db seed
```

## SUPER_ADMIN Login
Set in seed.ts — default admin@hospibot.in / hospibot@123  
(change immediately in production)

## Git History Summary
```
Sprint 1-3: Multi-portal architecture + Clinical portal
Sprint 4: WhatsApp Engine + AI Chatbot (14 intents, 4-step booking flow)
Sprint 5: CRM Lead Pipeline + WhatsApp Campaigns
Sprint 6: Universal Health Vault (consent + cross-provider records)
Sprint 7: Diagnostic Portal (25 default tests, home collection, report delivery)
Sprint 8: Pharmacy Portal (drug catalogue, dispensing, purchase orders)
Sprint 9: Commerce Marketplace + HomeCare/Equipment/Wellness portals
Sprint 10: Security & Compliance (RBAC, 28 permissions, DPDPA)
Post-Sprint: OPD Console, Queue Board, Prescriptions, Invoice PDF,
             Analytics live data, Razorpay, Voice Dictation, ABHA
```
