# Cluegrid

A daily word puzzle game that combines Wordle-style deduction with crossword clue satisfaction.

## Overview

Cluegrid is a web-first daily word game where players guess a 5-letter main word using hints from intersecting "crosser" words. Each crosser has a clue, and solving a crosser reveals its intersection with the main word.

**Key Features:**
- 🧩 Daily puzzle with crossword-style clues
- ⏱️ 3-5 minute satisfying sessions
- 📊 Streak tracking and statistics
- 📤 Shareable results
- 🌙 Dark mode support
- ♿ Accessibility-first design

## Tech Stack

- **Frontend:** Next.js 14, TypeScript, Tailwind CSS, Zustand, Framer Motion
- **Backend:** Next.js API Routes, Supabase (Postgres)
- **Deployment:** Vercel
- **Analytics:** PostHog
- **Monitoring:** Sentry

## Getting Started

### Prerequisites

- Node.js 20+
- npm 10+
- A [Supabase](https://supabase.com) project (free tier works)

### Setup

```bash
# 1. Clone the repository
git clone <repo-url>
cd cluegrid

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local
# Edit .env.local with your credentials (see below)

# 4. Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to play.

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run test` | Run tests (when configured) |

## Environment Variables

Copy `.env.example` to `.env.local` and fill in the values:

| Variable | Required | Scope | Description |
|----------|----------|-------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Client + Server | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Client + Server | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Server only | Supabase admin key (never expose to client) |
| `DATABASE_URL` | Yes | Server only | Direct Postgres connection string |
| `NEXT_PUBLIC_APP_URL` | Yes | Client + Server | App base URL (`http://localhost:3000` for dev) |
| `NEXT_PUBLIC_POSTHOG_KEY` | No | Client | PostHog project API key (analytics disabled if empty) |
| `NEXT_PUBLIC_POSTHOG_HOST` | No | Client | PostHog ingest host |
| `NEXT_PUBLIC_SENTRY_DSN` | No | Client | Sentry DSN for client-side error tracking |
| `SENTRY_DSN` | No | Server only | Sentry DSN for server-side error tracking |
| `SENTRY_ORG` | No | Build only | Sentry organization slug (for source map uploads) |
| `SENTRY_PROJECT` | No | Build only | Sentry project slug |
| `SENTRY_AUTH_TOKEN` | No | CI only | Sentry auth token (for source map uploads in CI) |
| `ADMIN_USERNAME` | No | Server only | Admin panel username |
| `ADMIN_PASSWORD` | No | Server only | Admin panel password |

**Security notes:**
- Never commit `.env.local` (it is in `.gitignore`)
- Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser -- never use this prefix for secrets
- `SUPABASE_SERVICE_ROLE_KEY` has full database access; keep it server-side only

## CI/CD

CI runs automatically via GitHub Actions on every push to `main` and every pull request.

**Pipeline:** Lint -> Build (parallel with Test)

See [`.github/workflows/ci.yml`](./.github/workflows/ci.yml) for the full configuration.

Vercel handles deployments:
- **Preview deploys** on every PR (automatic)
- **Production deploys** on merge to `main`

See [DEVOPS_GUIDE.md](./DEVOPS_GUIDE.md) for full deployment, rollback, and monitoring documentation.

## Project Structure

```
cluegrid/
├── .github/workflows/ # CI pipeline
├── src/
│   ├── app/           # Next.js App Router (pages + API routes)
│   ├── components/    # React components
│   ├── hooks/         # Custom React hooks
│   ├── lib/           # Utilities, API clients, Sentry
│   ├── stores/        # Zustand state stores
│   ├── types/         # TypeScript types
│   └── utils/         # Helper functions
├── supabase/          # Database migrations and config
├── sentry.*.config.ts # Sentry initialization (client, server, edge)
└── public/            # Static assets
```

## Documentation

| Document | Description |
|----------|-------------|
| [PDD.md](./PDD.md) | Product Design Document |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Technical architecture |
| [GAME_RULES.md](./GAME_RULES.md) | Game mechanics specification |
| [SPRINT_PLAN.md](./SPRINT_PLAN.md) | Development timeline |
| [DEVOPS_GUIDE.md](./DEVOPS_GUIDE.md) | Deployment, monitoring, and rollback |
| [ANALYTICS.md](./ANALYTICS.md) | Analytics event schema and dashboards |

## Contributing

This is currently a private project in development.

## License

All rights reserved.
