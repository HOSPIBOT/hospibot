# HospiBot

**Global WhatsApp-Driven Healthcare Operating System**

HospiBot is a multi-tenant SaaS platform that unifies hospital management, patient communication, and recurring revenue automation — all through WhatsApp.

## Architecture

- **Frontend**: Next.js 14 (App Router) + Tailwind CSS → Deployed on Vercel
- **Backend**: NestJS + TypeScript (Modular Monolith) → Deployed on Railway
- **Database**: PostgreSQL with Row-Level Security (Supabase → AWS RDS)
- **Cache**: Redis (Upstash)
- **Storage**: AWS S3
- **Messaging**: WhatsApp Cloud API (Meta)
- **Payments**: Razorpay

## Project Structure

```
hospibot/
├── apps/web/          → Next.js frontend
├── server/            → NestJS backend
├── packages/shared/   → Shared types & utilities
├── infra/             → Docker & deployment configs
└── docs/              → Documentation
```

## Getting Started

```bash
# Install dependencies
npm install

# Set up environment variables
cp server/.env.example server/.env
cp apps/web/.env.example apps/web/.env.local

# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:migrate

# Start development servers
npm run dev
```

## Environment Setup

See `server/.env.example` and `apps/web/.env.example` for required environment variables.

## License

Proprietary - All rights reserved.
