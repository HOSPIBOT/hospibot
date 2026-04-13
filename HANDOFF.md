# HospiBot — Developer Handoff
*68 commits · 132 pages · 22 backend modules · Last updated: April 2026*

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
| WhatsApp Green | #25D366 |
| Font | Roboto (UI), system-ui (public pages) |

## Portal Architecture
| Portal | Base URL | Nav Items |
|---|---|---|
| Clinical | /clinical/* | 20 items (dashboard, my-schedule, appointments, patients, doctors, billing, whatsapp, prescriptions, visits, lab, branches, departments, crm, analytics, automation, security, staff, vault, abha, chatbot, settings) |
| Diagnostic | /diagnostic/* | 8 items |
| Pharmacy | /pharmacy/* | 9 items (incl. suppliers) |
| HomeCare | /homecare/* | 8 items |
| Equipment | /equipment/* | 6 items |
| Wellness | /wellness/* | 7 items |
| Services | /services/* | 7 items |
| Super Admin | /super-admin/* | 15 items |

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
             GET/POST /whatsapp/templates
Analytics:   GET /analytics/dashboard  GET /analytics/revenue/trend
             GET /analytics/notifications  GET /analytics/doctors/top
Pharmacy:    GET /pharmacy/dashboard  GET/POST /pharmacy/products
             GET/POST /pharmacy/dispensing  GET/POST /pharmacy/suppliers
             GET /pharmacy/alerts  GET /pharmacy/inventory
CRM:         GET/POST /crm/leads  GET/POST /crm/campaigns
             POST /crm/campaigns/estimate
Prescriptions: GET/POST /prescriptions  POST /prescriptions/:id/send
Marketplace: GET /marketplace/products  POST /marketplace/products
             GET /marketplace/orders  PATCH /marketplace/orders/:id
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
- Real-time OPD Queue Display (TV screen, 30s auto-refresh)
- WhatsApp Broadcast with 6 audience segments
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
