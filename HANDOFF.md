# HospiBot — Developer Handoff
*112 commits · 149 pages · 24 backend modules · Last updated: April 2026*

## PRD Completion
**~92% of PRD implemented** — All 8 portals, 149 pages, 24 backend modules.
All P0/P1 PRD features complete. Remaining: Mobile App (React Native), ABDM HIE push/pull.

## Live URLs
- **Frontend:** https://hospibot-web.vercel.app
- **GitHub:** https://github.com/HOSPIBOT/hospibot

## Tech Stack
- Frontend: Next.js 14 + Tailwind CSS → Vercel (auto-deploy from main)
- Backend: NestJS + Prisma + PostgreSQL → Railway
- Auth: JWT (15m access + refresh)

## Key Design System
| Token | Value |
|---|---|
| Clinical Primary | #0D7C66 (teal) |
| Clinical Dark | #0A5E4F |
| Clinical Light BG | #E8F5F0 |
| Diagnostic Primary | #1E3A5F (navy) |
| Pharmacy Primary | #166834 (green) |
| HomeCare Primary | #6B21A8 (purple) |
| Equipment Primary | #1E40AF (blue) |
| Wellness Primary | #BE185D (pink) |
| Services Primary | #334155 (slate) |
| WhatsApp Green | #25D366 |
| Font | Roboto (UI), system-ui (public pages) |

## Portal Architecture
| Portal | Base URL | Nav Items | Notes |
|---|---|---|---|
| Clinical | /clinical/* | 20 items | Full-featured OPD portal |
| Diagnostic | /diagnostic/* | 8 items | Lab orders + collection |
| Pharmacy | /pharmacy/* | 9 items | Incl. suppliers + purchase orders |
| HomeCare | /homecare/* | 8 items | Home visits + staff dispatch |
| Equipment | /equipment/* | 6 items | B2B catalogue + orders |
| Wellness | /wellness/* | 7 items | Sessions + memberships |
| Services | /services/* | 7 items | Contracts + field staff |
| Super Admin | /super-admin/* | 15 items | Platform management |

## Public Pages (no auth)
| URL | Purpose |
|---|---|
| /book?clinic=slug | 4-step appointment booking |
| /register-patient?clinic=slug | Patient self-registration (DPDPA) |
| /check-in | Self check-in kiosk for tablets |
| /track-appointment?id= | Appointment status tracker |
| /clinical/feedback?id= | Post-consultation feedback form |
| /clinical/queue-display | TV/kiosk waiting room display |
| /clinical/queue-token?id= | 80mm thermal token print |
| /clinical/appointments/daysheet | A4 landscape day schedule print |
| /clinical/patients/[id]/summary | A4 health summary print |
| /clinical/prescriptions/[id] | A5 prescription print |
| /clinical/billing/patient/[id] | Billing ledger print |

## Key Backend Endpoints
```
Auth:        POST /auth/login  POST /auth/register
Tenant:      GET/PATCH /tenants/current
             POST /tenants/current/branches  PATCH /tenants/current/branches/:id
Appointments:GET /appointments  POST /appointments
             PUT /appointments/:id/status  POST /appointments/:id/reschedule
             GET /appointments/queue  GET /appointments/today/stats
Patients:    GET /patients  POST /patients  PUT|PATCH /patients/:id
Doctors:     GET /doctors  PATCH /doctors/:id  GET /doctors/:id/slots
             GET/POST/DELETE /doctors/departments
Billing:     GET /billing/invoices  POST /billing/invoices
             POST /billing/invoices/:id/payments
             POST /billing/invoices/:id/payment-link
             GET /billing/export/tally
Lab:         GET/POST /lab/orders  PATCH /lab/orders/:id/status
             PATCH /lab/orders/:id  POST /lab/orders/:id/deliver
             GET/POST /lab/catalog  GET/POST /lab/collection
WhatsApp:    GET /whatsapp/conversations  POST /whatsapp/send
             GET /whatsapp/conversations/:id/messages
             PATCH /whatsapp/conversations/:id
             GET/POST /whatsapp/templates
Analytics:   GET /analytics/dashboard  GET /analytics/revenue/trend
             GET /analytics/notifications  GET /analytics/doctors/top
             GET /analytics/appointments  GET /analytics/patients/demographics
Pharmacy:    GET /pharmacy/dashboard  GET/POST /pharmacy/products
             GET/POST /pharmacy/dispensing  GET/POST /pharmacy/suppliers
             GET /pharmacy/alerts  GET /pharmacy/inventory
CRM:         GET/POST /crm/leads  GET/POST /crm/campaigns
             POST /crm/campaigns/estimate
Prescriptions: GET/POST /prescriptions  POST /prescriptions/:id/send
Marketplace: GET /marketplace/products  POST /marketplace/products
             GET /marketplace/orders  PATCH /marketplace/orders/:id
             GET /marketplace/stats
Visits:      POST /visits  GET /visits/patient/:patientId
             GET /visits/appointment/:appointmentId  GET /visits/:id
Security:    GET /security/audit-logs
```

## Environment Variables (Production)
```bash
# Backend (Railway)
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret
JWT_EXPIRES_IN=15m
RAZORPAY_KEY_ID=rzp_...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...
ABHA_CLIENT_ID=...
ABHA_CLIENT_SECRET=...
WHATSAPP_WEBHOOK_VERIFY_TOKEN=hospibot-webhook-verify
APP_URL=https://hospibot-web.vercel.app

# Frontend (Vercel)
NEXT_PUBLIC_API_URL=https://your-backend.railway.app/api/v1
```

## Post-Deploy Commands
```bash
npx prisma migrate deploy && npx prisma db seed
```

## Scheduled Jobs
| Job | Schedule | Action |
|---|---|---|
| processAutomationJobs | Every 5 min | Run automation rules |
| scanTimeElapsed | Every 1 hour | Mark appointments elapsed |
| sendAppointmentReminders | 8AM IST daily | Next-day reminders |
| sendRefillReminders | 8AM IST daily | 5-day refill alerts |

## Notable Features Built
### Clinical
- Real-time OPD Queue Display (TV screen, 30s auto-refresh, kiosk mode)
- **WhatsApp Inbox** — filter tabs (All/Unread/Bot/Human/Closed), template picker with variable substitution, 15s auto-refresh, patient context panel (appointments + prescriptions), read receipts
- OPD Consultation Console (/clinical/visits/[appointmentId]) — vitals, diagnosis, prescription writer, lab orders, speech-to-text
- **Visit History** — Export CSV (respects all active filters, up to 5,000 records)
- **Appointments** — Export CSV upgraded from page-only to full-dataset fetch (up to 5,000)
- **Lab Orders** — Status filter tabs (All/Ordered/Collected/Processing/Ready/Delivered) + priority filter (Routine/Urgent/STAT)
- **Prescriptions** — Date range filter with From/To pickers + quick presets (Today/7 days/30 days)
- **Patients** — Gender + blood group filter panel; Export CSV button wired to live data
- Patient Self Check-In Kiosk (/check-in)
- Appointment Status Tracker for patients
- Invoice Aging Report with 4 brackets + WhatsApp reminders
- Doctor's My Schedule (daily view with advance buttons)
- Prescription Refill Tracker with WhatsApp reminders
- Patient Feedback form (post-consultation)
- Tally XML export for accounting
- ABHA health ID linking
- Multi-branch management
- Razorpay payment links
- Speech-to-text in OPD Console
- CSV import for patients
- WhatsApp Broadcast (6 audience segments)
- Revenue Engine automation rules

### HomeCare
- **Dashboard** — live from /appointments/today/stats + /analytics/revenue/trend (removed mock data)
- **Staff Dispatch** — status filter tabs, live from /doctors, dispatch button, status dot indicators

### Services
- **Dashboard** — live from /billing/invoices + /analytics/revenue/trend (removed hardcoded KPIs)
- **Billing** — live from /billing/invoices with search
- **Analytics** — live revenue bar chart + contract type pie chart
- **Staff** — live from /doctors with fallback seed

### Pharmacy
- **Purchase Orders** — full PO creation with supplier + item selection, status filters, supplier management tab
- **Receive Goods** — modal on SENT/PARTIAL POs: per-item received qty, batch number, expiry date, cost/MRP; hits `POST /pharmacy/purchase-orders/:id/receive`; auto-updates inventory stock

### Wellness
- **Dashboard** — fixed crash (undefined trend/stats), live API
- **Analytics** — portal-specific: session trend area chart, membership plan pie, session type breakdown bars, week/month toggle
- Membership management with plan enrollment

### Equipment
- **Dashboard** — fixed crash (undefined stats/orderTrend), live from /marketplace/stats + /marketplace/orders
- **Analytics** — portal-specific: B2B order trend bar chart, order status pie, top products by sales, week/month/quarter toggle

### Super Admin
- **Plans & Billing** — live tenant counts per plan via getAllTenants API; MRR calculated from real data

## Pages Needing Backend Modules (use seed/fallback data)
- Services portal — no dedicated /services/* backend module; uses /billing/invoices + /doctors
- HomeCare staff dispatch — uses /doctors endpoint as a proxy; no dedicated homecare-staff module
- Equipment dashboard — uses /marketplace/stats; no dedicated equipment-stats module

## Git Push
Token configured in remote URL. All pushes done from container automatically.
```bash
git add -A && git commit -m "..." && git push origin main
```

## Session History (recent)
| Commit | Feature |
|---|---|
| 4d4955e | feat: Equipment + Wellness analytics portal-specific; Super Admin plans live MRR |
| c76a7fc | feat: Pharmacy Purchase Orders — Receive Goods modal, auto stock update |
| 5cd20af | feat: Services dashboard live API + Visit History filters + HANDOFF update |
| 798c379 | fix: Wellness + Equipment dashboards — undefined vars, live API |
| 56824b8 | feat: HomeCare dashboard/staff live API; Services billing/analytics/staff off mock |
| 36099f0 | feat: WhatsApp Inbox — filter tabs, template picker, auto-refresh, patient panel |
| 0ea2b52 | feat: Patient Feedback + Refill Tracker |
| 4db4d56 | fix: My Schedule nav + Aging Report link |
| 9dbe360 | feat: Doctor My Schedule + Invoice Aging Report |
| ac532dd | feat: Pharmacy dispensing order detail + dashboard live API |
| ea92373 | feat: Clinical Staff Management + DPDPA Actions + Security |
