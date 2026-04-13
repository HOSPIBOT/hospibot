# HospiBot — Developer Handoff Document
*Last updated: April 2026 · Auto-generated*

## Project Overview

WhatsApp-first Healthcare Operating System. Multi-tenant SaaS supporting Hospitals, Clinics,
Diagnostic Centres, Pharmacies, Home Healthcare, Equipment Vendors, and Wellness centres.

**Stack:** Next.js 14 + Tailwind CSS (Vercel) · NestJS + Prisma + PostgreSQL (Railway)  
**GitHub:** HOSPIBOT/hospibot  
**Live:** hospibot-web.vercel.app  
**Stats:** 50 commits · 116 pages · 22 backend service modules

---

## Repository Structure

```
hospibot/
├── apps/web/              # Next.js 14 frontend (Vercel)
│   ├── app/               # App Router pages
│   │   ├── clinical/      # Core clinical portal (20+ pages)
│   │   ├── diagnostic/    # Lab/diagnostic portal (8 pages)
│   │   ├── pharmacy/      # Pharmacy portal (7 pages)
│   │   ├── homecare/      # Home healthcare portal (9 pages)
│   │   ├── equipment/     # Equipment vendor portal (6 pages)
│   │   ├── wellness/      # Wellness centre portal (7 pages)
│   │   ├── services/      # B2B services portal (7 pages)
│   │   ├── marketplace/   # Public product catalog
│   │   ├── super-admin/   # Platform admin (15 pages)
│   │   ├── book/          # Public appointment booking
│   │   └── register-patient/ # Public patient self-registration
│   ├── components/
│   │   ├── portal/PortalLayout.tsx  # Main nav + notification bell
│   │   └── ui/            # ConfirmDialog, DictationButton, etc.
│   └── lib/
│       ├── api.ts          # Axios instance with auth interceptors
│       ├── utils.ts        # formatINR, formatDate, formatTime
│       ├── store.ts        # Zustand auth store
│       └── super-admin-api.ts  # Super admin typed API functions
└── server/                # NestJS backend (Railway)
    └── src/modules/       # 22 modules (see below)
```

---

## Clinical Portal Pages (/clinical/*)

| Page | Description |
|------|-------------|
| dashboard | Live KPIs, revenue trend, queue preview, quick actions |
| appointments | Full CRUD, filters, reschedule modal, CSV export |
| appointments/queue | Live Kanban board, kiosk mode, token print |
| patients | Search, add, import CSV, paginated list |
| patients/[id] | Patient 360: 6 tabs, WhatsApp messaging, Print Summary |
| patients/[id]/summary | A4 printable health summary |
| patients/import | Drag-drop CSV import with validation |
| doctors | List, availability toggle, Profile → link |
| doctors/[id] | 3-tab: profile edit, weekly schedule, stats |
| billing | Invoices, create, pay link, Record Payment modal |
| billing/[id] | Invoice PDF print, Razorpay embedded checkout |
| prescriptions | Write, send via WhatsApp, list with search |
| prescriptions/[id] | A5 printable prescription with Rx symbol |
| visits | Paginated visit history (completed consultations) |
| visits/[appointmentId] | OPD Console: vitals, voice dictation, Rx, billing |
| whatsapp | Inbox: conversations, reply, send media |
| whatsapp-templates | Template manager with live WA preview |
| whatsapp-broadcast | Segment targeting, audience estimate, campaign history |
| chatbot | Bot name, 8 intent toggles, greeting/fallback messages |
| crm | Kanban leads board + list view |
| crm/campaigns | Campaign builder with segment analytics |
| analytics | Revenue, appointments, doctors, demographics charts |
| automation | Rules engine: triggers, conditions, actions |
| security | User management, permissions, audit |
| abha | ABHA health ID linking with OTP flow |
| vault | Health Vault document storage |
| lab | Clinical lab order creation with test catalog |
| branches | Multi-branch CRUD + activate/deactivate |
| departments | Department management (Clinical/Ancillary/Admin) |
| registration-qr | A4 printable QR poster for patient self-reg |
| queue-token | 80mm thermal token print |
| settings | General, WhatsApp config, Departments, Notifications |

---

## Backend Modules (server/src/modules/)

```
auth           appointment     patient        doctor
billing        whatsapp        analytics      crm
automation     lab             pharmacy       marketplace
portal         super-admin     chatbot        scheduler
vault          notification    prescription   visit
security       tenant
```

---

## Key API Endpoints Reference

```
Auth:          POST /auth/login · POST /auth/register
Tenant:        GET/PATCH /tenants/current · GET /tenants/current/branches
               POST /tenants/current/branches · PATCH /tenants/current/branches/:id
Appointments:  GET /appointments · POST /appointments · PUT /appointments/:id/status
               POST /appointments/:id/reschedule · GET /appointments/queue
               GET /appointments/today/stats
Patients:      GET /patients · POST /patients · PUT|PATCH /patients/:id
Doctors:       GET /doctors · POST /doctors · PUT|PATCH /doctors/:id
               GET /doctors/:id/slots · GET/POST/DELETE /doctors/departments
Billing:       GET /billing/invoices · POST /billing/invoices
               POST /billing/invoices/:id/payments (record payment)
               POST /billing/invoices/:id/payment-link (Razorpay)
               POST /billing/invoices/:id/checkout-order
               POST /billing/webhook/razorpay
Lab:           GET /lab/orders · POST /lab/orders · GET /lab/orders/:id
               PATCH /lab/orders/:id/status · POST /lab/orders/:id/deliver
               PATCH /lab/orders/:id · GET/POST /lab/catalog
               GET/POST/PATCH /lab/collection
WhatsApp:      GET /whatsapp/conversations · POST /whatsapp/send
               GET/POST /whatsapp/templates · POST /whatsapp/templates/seed-defaults
CRM:           GET/POST /crm/leads · GET/POST /crm/campaigns
               POST /crm/campaigns/estimate
Analytics:     GET /analytics/dashboard · GET /analytics/revenue/trend
               GET /analytics/appointments · GET /analytics/notifications
               GET /analytics/doctors/top · GET /analytics/patients/demographics
               GET /analytics/whatsapp
Pharmacy:      GET /pharmacy/dashboard · GET /pharmacy/products
               GET /pharmacy/orders · GET /pharmacy/inventory · GET /pharmacy/alerts
ABHA:          POST /billing/abha/generate-otp · POST /billing/abha/verify-otp
               POST /billing/abha/link-profile
Prescriptions: GET/POST /prescriptions · POST /prescriptions/:id/send
Vault:         GET /vault/stats · POST /vault/request-access
Security:      GET /security/users · GET /security/audit-logs
```

---

## Environment Variables

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

---

## Post-Deploy Commands (Railway)

```bash
npx prisma migrate deploy && npx prisma db seed
```

---

## Design System

| Token | Value |
|-------|-------|
| Clinical Primary | #0D7C66 (teal) |
| Clinical Dark | #0A5E4F |
| Clinical Light BG | #E8F5F0 |
| Diagnostic Primary | #1E3A5F (navy) |
| Pharmacy Primary | #166534 (green) |
| HomeCare Primary | #6B21A8 (purple) |
| WhatsApp Green | #25D366 |
| Accent Amber | #F59E0B |
| Surface | #F8FAFC |
| Text | #1E293B |
| Font: UI | Roboto |

---

## Scheduled Jobs (scheduler.service.ts)

| Job | Schedule | Action |
|-----|----------|--------|
| processAutomationJobs | Every 5 min | Run pending automation rules |
| scanTimeElapsed | Every hour | Mark appointments as elapsed |
| sendAppointmentReminders | 8:00 AM IST | Next-day appointment reminders |
| sendRefillReminders | 8:00 AM IST | 5-day medication refill alerts |

---

## Public Pages (no auth required)

| URL | Description |
|-----|-------------|
| /book?clinic=slug | 4-step appointment booking wizard |
| /register-patient?clinic=slug | Patient self-registration with DPDPA consent |
| /clinical/queue-token?id=apptId | 80mm thermal token print |
| /clinical/prescriptions/[id] | Printable prescription (A5) |
| /clinical/patients/[id]/summary | A4 health summary (token-linked) |

---

*For session-specific change history, see the git log.*
