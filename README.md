# HospiBot — Healthcare Operating System

WhatsApp-first multi-tenant SaaS platform for diagnostic labs, clinics, pharmacies, and healthcare providers across India.

## Quick Start

```bash
# Clone
git clone https://github.com/HOSPIBOT/hospibot.git
cd hospibot

# Backend
cd server
cp .env.example .env  # Fill in your values
npm install
npx prisma generate
npm run dev

# Frontend (new terminal)
cd apps/web
npm install
npm run dev
```

## Architecture

| Component | Technology | Hosting |
|-----------|-----------|---------|
| Backend | NestJS + Prisma ORM | Railway |
| Frontend | Next.js 14 | Vercel |
| Database | PostgreSQL | Supabase |
| Payments | Razorpay | — |
| WhatsApp | Meta Cloud API | — |
| SMS | MSG91 (configurable) | — |

## Platform Stats

- **133 diagnostic pages** across 34 lab subtypes
- **25 super admin pages**
- **170 Prisma models**
- **118 backend modules**
- **65+ API endpoints**
- **7 compliance hard-blocks** (PC-PNDT, AERB, NACO, BMW, ART Act, Biosafety, Chain of Custody)
- **20 WhatsApp templates**
- **4 languages** (English, Hindi, Telugu, Tamil)

## 34 Diagnostic Subtypes

| Group | Subtypes |
|-------|----------|
| Collection | PSC, Pickup Point, Home Collection |
| Pathology | Clinical Lab, Histopath, Molecular/PCR, Microbiology, Genetics, Blood Bank |
| Imaging | Radiology, USG, PET, Nuclear Med, Mammography, DEXA, Dental, Ophthalmic |
| Physiological | Cardiac, PFT, Neuro (EEG/EMG), Allergy, Sleep Lab, Audiology, Urodynamics, Endoscopy |
| Packages | Health Checkup, Corporate Wellness |
| Specialty | IVF/Embryology, Stem Cell/HLA, Forensic/Toxicology, Cancer Screening |
| Digital | Reference Lab, Tele-Radiology, DTC Genomics |

## 4 Pricing Tiers

| Tier | Price | Volume | Branches |
|------|-------|--------|----------|
| Starter | ₹999/mo | Up to 50/day | 1 |
| Growth | ₹2,999/mo | 50-300/day | 3 |
| Professional | ₹7,999/mo | 300-1,000/day | 10 |
| Enterprise | Custom | 1,000+/day | Unlimited |

## Key Directories

```
server/
├── src/modules/diagnostic/     # Core diagnostic logic (65+ endpoints)
├── src/modules/super-admin/    # Platform admin
├── src/modules/whatsapp/       # WhatsApp integration + chatbot
├── src/modules/auth/           # JWT auth + registration
├── src/common/guards/          # TenantGuard, TierGuard, ComplianceGuard
├── prisma/schema.prisma        # 170 models
└── prisma/migrations/          # SQL seeds

apps/web/
├── app/diagnostic/             # 133 diagnostic pages
├── app/super-admin/            # 25 admin pages
├── app/register/               # 7-step registration wizard
├── lib/subtype-tier-features.ts  # 845 lines — feature config per subtype
├── lib/subtype-nav-config.ts     # 466 lines — nav per subtype
└── lib/portal-feature-flags.ts   # 695 lines — feature gates
```

## Running SQL Migrations

Run in Supabase SQL Editor (in order):
1. `server/prisma/migrations/new_12_subtypes.sql`
2. `server/prisma/migrations/analyzer_interface.sql`
3. `server/prisma/migrations/communication_configs.sql` (v3)
4. `server/prisma/migrations/seed_tier_configs.sql`
5. `server/prisma/migrations/seed_feature_definitions.sql`
6. `server/prisma/migrations/seed_demo_tenants.sql`

## Smoke Test

```bash
bash scripts/smoke-test.sh https://your-api.railway.app/api/v1
```

## License

Proprietary — HospiBot Internal
