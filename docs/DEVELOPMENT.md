# HospiBot Development Guide

## Prerequisites

- Node.js 18+ (recommended: 20 LTS)
- npm 9+
- PostgreSQL 15+ (or Supabase account)
- Redis (or Upstash account)

## Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/HOSPIBOT/hospibot.git
cd hospibot
npm install
```

### 2. Environment Setup

```bash
# Backend
cp server/.env.example server/.env
# Edit server/.env with your database URL, JWT secrets, etc.

# Frontend
cp apps/web/.env.example apps/web/.env.local
# Edit apps/web/.env.local with your API URL
```

### 3. Database Setup

```bash
# Generate Prisma client
npm run db:generate

# Run migrations (creates all tables)
npm run db:migrate

# (Optional) Open Prisma Studio to view data
npm run db:studio
```

### 4. Start Development

```bash
# Start both frontend and backend
npm run dev

# Or start individually
npm run dev:server  # Backend at http://localhost:4000
npm run dev:web     # Frontend at http://localhost:3000
```

### 5. API Documentation

Visit http://localhost:4000/docs for Swagger API docs (development only).

## Project Structure

```
hospibot/
├── apps/web/           → Next.js 14 frontend (Vercel)
│   ├── app/            → App router pages
│   ├── components/     → React components
│   ├── lib/            → API client, store, utilities
│   └── styles/         → Tailwind CSS
├── server/             → NestJS backend (Railway)
│   ├── src/
│   │   ├── modules/    → Feature modules (auth, patient, etc.)
│   │   ├── common/     → Guards, decorators, filters
│   │   └── database/   → Prisma service
│   └── prisma/         → Schema & migrations
├── packages/shared/    → Shared types & constants
└── infra/              → Docker & deployment configs
```

## Key Technologies

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | Next.js 14 | React SSR framework |
| Styling | Tailwind CSS | Utility-first CSS |
| State | Zustand | Client state management |
| Backend | NestJS | TypeScript API framework |
| ORM | Prisma | Type-safe database client |
| Database | PostgreSQL | Primary data store |
| Cache | Redis | Sessions, queues, cache |
| Auth | JWT + Passport | Token authentication |
| Docs | Swagger | Auto-generated API docs |

## Deployment

- **Frontend**: Auto-deploys to Vercel on push to `main`
- **Backend**: Auto-deploys to Railway on push to `main`
- **Database**: Supabase (managed PostgreSQL)

## Branch Strategy

- `main` → Production
- `develop` → Staging / integration
- `feature/*` → Feature branches
