# Cluegrid - DevOps & Deployment Guide

## 1. CI/CD Pipeline

### 1.1 Pipeline Overview

```
Push/PR to main
    |
    v
[Lint] --> [Test] --> [Build] --> [Deploy]
                                     |
                          +----------+----------+
                          |                     |
                     PR branch              main branch
                          |                     |
                   Preview Deploy         Production Deploy
                  (*.vercel.app)           (cluegrid.app)
```

### 1.2 GitHub Actions Workflow

The pipeline lives at `.github/workflows/deploy.yml` and runs on every push to `main` and every pull request targeting `main`.

**Jobs:**

| Job | Trigger | Steps | Duration (target) |
|-----|---------|-------|--------------------|
| `lint` | push, PR | Checkout, install, `npm run lint` | <30s |
| `test` | push, PR | Checkout, install, `npm run test` | <60s |
| `build` | push, PR (needs lint + test) | Checkout, install, `npm run build` | <90s |
| `deploy` | push to main only (needs build) | Vercel production deploy | <60s |

```yaml
# .github/workflows/deploy.yml
name: CI/CD

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: 20

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      - run: npm ci
      - run: npm run lint

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      - run: npm ci
      - run: npm run test

  build:
    needs: [lint, test]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      - run: npm ci
      - run: npm run build
        env:
          NEXT_PUBLIC_APP_URL: ${{ vars.NEXT_PUBLIC_APP_URL }}
          NEXT_PUBLIC_POSTHOG_KEY: ${{ vars.NEXT_PUBLIC_POSTHOG_KEY }}
          SENTRY_DSN: ${{ secrets.SENTRY_DSN }}

  deploy-production:
    needs: build
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v4
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

### 1.3 Preview Deploys

Vercel automatically creates preview deployments for every PR via its GitHub integration. No additional configuration is needed beyond connecting the Vercel project to the GitHub repo.

- Each PR gets a unique URL: `cluegrid-<hash>-<org>.vercel.app`
- Preview deploys use the **Preview** environment variables in Vercel
- Preview URLs are posted as PR comments automatically

### 1.4 Branch Strategy

| Branch | Purpose | Deploys To |
|--------|---------|------------|
| `main` | Production-ready code | cluegrid.app |
| `feature/*` | Feature development | Preview (via PR) |
| `fix/*` | Bug fixes | Preview (via PR) |
| `hotfix/*` | Urgent production fixes | Preview, then fast-track to main |

All merges to `main` require:
- Passing CI (lint + test + build)
- At least 1 PR review (recommended)
- No merge conflicts

---

## 2. Environment Setup

### 2.1 Environments

| Environment | URL | Purpose | Deploy Trigger |
|-------------|-----|---------|----------------|
| Development | `localhost:3000` | Local development | Manual (`npm run dev`) |
| Preview | `*.vercel.app` | PR review & QA | Automatic on PR |
| Staging | `staging.cluegrid.app` | Pre-production validation | Manual promote or branch deploy |
| Production | `cluegrid.app` | Live application | Push to `main` |

### 2.2 Local Development Setup

```bash
# 1. Clone the repository
git clone git@github.com:<org>/cluegrid.git
cd cluegrid

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local
# Edit .env.local with your local/dev values (see Section 3)

# 4. Start development server
npm run dev

# 5. Verify at http://localhost:3000
```

### 2.3 Vercel Project Setup

```bash
# Install Vercel CLI
npm i -g vercel

# Link to Vercel project
vercel link

# Pull environment variables for local dev
vercel env pull .env.local
```

**Vercel project settings:**
- **Framework Preset:** Next.js
- **Build Command:** `npm run build`
- **Output Directory:** `.next`
- **Install Command:** `npm ci`
- **Node.js Version:** 20.x

---

## 3. Environment Variables

### 3.1 Variable Reference

| Variable | Scope | Required | Description |
|----------|-------|----------|-------------|
| `NEXT_PUBLIC_APP_URL` | Client + Server | Yes | Application base URL |
| `SUPABASE_URL` | Server | Yes | Supabase project URL |
| `SUPABASE_ANON_KEY` | Server | Yes | Supabase anonymous/public key |
| `SUPABASE_SERVICE_KEY` | Server | Yes | Supabase service role key (admin) |
| `NEXT_PUBLIC_POSTHOG_KEY` | Client | Yes | PostHog project API key |
| `SENTRY_DSN` | Client + Server | Yes | Sentry data source name |
| `SENTRY_AUTH_TOKEN` | CI only | Yes (CI) | Sentry auth token for source maps |
| `VERCEL_TOKEN` | CI only | Yes (CI) | Vercel deployment token |
| `VERCEL_ORG_ID` | CI only | Yes (CI) | Vercel organization ID |
| `VERCEL_PROJECT_ID` | CI only | Yes (CI) | Vercel project ID |

### 3.2 Values Per Environment

| Variable | Development | Preview | Production |
|----------|-------------|---------|------------|
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` | `https://<preview>.vercel.app` | `https://cluegrid.app` |
| `SUPABASE_URL` | Dev project URL | Dev project URL | Prod project URL |
| `SUPABASE_ANON_KEY` | Dev anon key | Dev anon key | Prod anon key |
| `SUPABASE_SERVICE_KEY` | Dev service key | Dev service key | Prod service key |
| `NEXT_PUBLIC_POSTHOG_KEY` | (empty, disabled) | Dev PostHog key | Prod PostHog key |
| `SENTRY_DSN` | (empty, disabled) | Dev Sentry DSN | Prod Sentry DSN |

### 3.3 Setting Variables in Vercel

```bash
# Add a secret for production
vercel env add SUPABASE_SERVICE_KEY production

# Add a secret for all environments
vercel env add SENTRY_DSN production preview development

# List configured variables
vercel env ls
```

In the Vercel dashboard: **Project Settings > Environment Variables**

### 3.4 Security Rules

- **NEVER** commit `.env.local` or any `.env.*` file with real values
- **NEVER** prefix server-only secrets with `NEXT_PUBLIC_` (this exposes them to the browser)
- `SUPABASE_SERVICE_KEY` must remain server-side only (API routes)
- `SENTRY_AUTH_TOKEN` should only exist in CI secrets, not in Vercel env
- Rotate keys immediately if any secret is accidentally committed

### 3.5 .env.example Template

```bash
# .env.example - Copy to .env.local and fill in values
# DO NOT commit .env.local

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

# Analytics (leave empty to disable in dev)
NEXT_PUBLIC_POSTHOG_KEY=
SENTRY_DSN=
```

---

## 4. Monitoring Setup

### 4.1 Sentry (Error Tracking)

**Purpose:** Capture and alert on JavaScript exceptions and API errors.

**Setup steps:**

1. Create a Sentry project (Next.js platform)
2. Install the SDK:
   ```bash
   npx @sentry/wizard@latest -i nextjs
   ```
3. This generates:
   - `sentry.client.config.ts`
   - `sentry.server.config.ts`
   - `sentry.edge.config.ts`
   - Updates `next.config.js` with Sentry webpack plugin

**Configuration (`sentry.client.config.ts`):**

```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,        // 10% of transactions for performance
  replaysSessionSampleRate: 0,   // No replays (use PostHog for this)
  replaysOnErrorSampleRate: 1.0, // Replay on errors
});
```

**Alert rules:**

| Alert | Condition | Channel |
|-------|-----------|---------|
| New issue | First occurrence of any error | Slack |
| Error spike | >5% error rate in 5 minutes | Slack + Email |
| Unresolved critical | P0 unresolved for >1 hour | Slack + Email |

**Source maps:**
- Sentry automatically uploads source maps during `npm run build` via the webpack plugin
- Requires `SENTRY_AUTH_TOKEN` in CI environment

### 4.2 Vercel Analytics (Performance)

**Purpose:** Track Core Web Vitals and real-user performance metrics.

**Setup:**

1. Enable in Vercel dashboard: **Project > Analytics > Enable**
2. Install the package:
   ```bash
   npm install @vercel/analytics
   ```
3. Add to root layout:
   ```tsx
   // app/layout.tsx
   import { Analytics } from '@vercel/analytics/react';

   export default function RootLayout({ children }) {
     return (
       <html>
         <body>
           {children}
           <Analytics />
         </body>
       </html>
     );
   }
   ```

**Metrics tracked:**

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| LCP (Largest Contentful Paint) | <1.5s | >2.5s |
| FID (First Input Delay) | <100ms | >300ms |
| CLS (Cumulative Layout Shift) | <0.1 | >0.25 |
| TTI (Time to Interactive) | <2s | >3.5s |
| Bundle size (gzipped JS) | <100KB | >150KB |

### 4.3 PostHog (Product Analytics)

**Purpose:** Track user behavior, retention, and engagement.

Refer to [ANALYTICS.md](/ANALYTICS.md) for the full event schema and dashboard definitions.

**Key dashboards to create in PostHog:**

1. **Executive Dashboard** - DAU, new users, games completed, win rate
2. **Retention Dashboard** - Cohort analysis, streak distribution
3. **Engagement Dashboard** - Session length, share rate, funnel analysis
4. **Content Dashboard** - Per-puzzle difficulty, clue effectiveness

### 4.4 Vercel Logs

**Purpose:** API route debugging and serverless function monitoring.

- Access via Vercel dashboard: **Project > Logs**
- Filter by function, status code, or time range
- Logs retain for 1 hour (Hobby) or 3 days (Pro)
- For persistent logging, forward to an external service via Vercel Log Drains

### 4.5 Uptime Monitoring

Set up a simple uptime check for production:

| Check | URL | Interval | Alert |
|-------|-----|----------|-------|
| Homepage | `https://cluegrid.app` | 5 min | Slack + Email |
| API health | `https://cluegrid.app/api/puzzle/today` | 5 min | Slack + Email |

**Recommended tool:** Vercel's built-in checks, or a free tier of BetterUptime / UptimeRobot.

---

## 5. Deployment Checklist

### 5.1 Pre-Deployment (Every PR)

- [ ] All CI checks pass (lint, test, build)
- [ ] Preview deploy is functional and reviewed
- [ ] No new Sentry errors in preview
- [ ] No `console.log` or debug code left in
- [ ] Environment variables are set for target environment
- [ ] Database migrations applied (if any)

### 5.2 Production Deployment

Production deploys happen automatically when a PR is merged to `main`. Before merging:

- [ ] PR has been reviewed
- [ ] CI pipeline is green
- [ ] Preview deploy has been manually tested
- [ ] No breaking API changes without migration path
- [ ] Supabase schema changes applied to production database first

### 5.3 Post-Deployment Verification

After every production deploy:

- [ ] Visit `https://cluegrid.app` and verify page loads
- [ ] Start a puzzle and submit a guess (smoke test)
- [ ] Check Sentry for new errors (wait 5 minutes)
- [ ] Check Vercel Analytics for performance regressions
- [ ] Verify API health: `GET /api/puzzle/today` returns 200
- [ ] Check Vercel deployment logs for warnings

### 5.4 Database Migration Checklist

When deploying schema changes:

1. [ ] Test migration against a copy of production data
2. [ ] Apply migration to production Supabase **before** deploying code
3. [ ] Verify migration success in Supabase Studio
4. [ ] Deploy code that depends on the new schema
5. [ ] Confirm no errors in Sentry related to database
6. [ ] Keep rollback SQL ready (see Section 6)

---

## 6. Rollback Procedures

### 6.1 Vercel Instant Rollback

Vercel keeps every deployment immutable. Rolling back is instant:

**Via Dashboard:**
1. Go to **Vercel > Project > Deployments**
2. Find the last known-good deployment
3. Click the three-dot menu and select **Promote to Production**
4. The rollback takes effect in <10 seconds

**Via CLI:**
```bash
# List recent deployments
vercel ls

# Promote a specific deployment to production
vercel promote <deployment-url>
```

### 6.2 Git Rollback

If the Vercel rollback is not sufficient (e.g., the bad code must be removed from `main`):

```bash
# Revert the most recent merge commit
git revert HEAD --no-edit
git push origin main

# This triggers a new deploy with the reverted code
```

Do NOT use `git reset --hard` or `git push --force` on `main`.

### 6.3 Database Rollback

For schema migrations that need reverting:

1. Prepare rollback SQL alongside every migration
2. Execute rollback in Supabase SQL Editor
3. Verify data integrity
4. Then rollback the application code (Section 6.1 or 6.2)

**Example migration + rollback pair:**

```sql
-- Migration: add difficulty_rating column
ALTER TABLE puzzles ADD COLUMN difficulty_rating INT;

-- Rollback: remove difficulty_rating column
ALTER TABLE puzzles DROP COLUMN IF EXISTS difficulty_rating;
```

### 6.4 Environment Variable Rollback

If a bad environment variable causes issues:

1. Go to **Vercel > Project Settings > Environment Variables**
2. Edit or revert the variable
3. Trigger a redeploy: **Deployments > Latest > Redeploy**

### 6.5 Rollback Decision Matrix

| Symptom | Action | Time to Recovery |
|---------|--------|-----------------|
| Page won't load | Vercel instant rollback | <1 minute |
| API returning errors | Vercel instant rollback | <1 minute |
| Data corruption | Database rollback + code rollback | 5-15 minutes |
| Wrong env variable | Update variable + redeploy | 2-3 minutes |
| Subtle UI bug | Git revert + deploy | 5-10 minutes |

---

## 7. Security Checklist

### 7.1 Application Security

- [ ] Server-side guess validation only (answers never sent to client)
- [ ] Rate limiting on API routes (60 req/min per IP)
- [ ] Input sanitization on all API endpoints
- [ ] CORS restricted to known origins
- [ ] CSP headers configured in `next.config.js`
- [ ] `X-Frame-Options: DENY` set
- [ ] `X-Content-Type-Options: nosniff` set
- [ ] `Referrer-Policy: strict-origin-when-cross-origin` set

### 7.2 Infrastructure Security

- [ ] No secrets in source code or git history
- [ ] `.env.local` in `.gitignore`
- [ ] `SUPABASE_SERVICE_KEY` only used in server-side API routes
- [ ] Vercel environment variables scoped by environment
- [ ] GitHub branch protection on `main`
- [ ] Dependabot or npm audit enabled for dependency vulnerabilities
- [ ] Sentry source maps uploaded via auth token (not hardcoded)

### 7.3 Supabase Security

- [ ] Row Level Security (RLS) enabled on all tables
- [ ] Anon key has minimal permissions (read-only on published puzzles)
- [ ] Service key never exposed to client
- [ ] API access restricted to application needs

### 7.4 Monitoring Security

- [ ] Sentry configured to scrub PII
- [ ] PostHog session recording masks all text input
- [ ] No PII in analytics events
- [ ] GDPR opt-out mechanism implemented
- [ ] Data retention policies configured (events: 12 months, recordings: 30 days)

---

## 8. Useful Commands

```bash
# Local development
npm run dev          # Start dev server
npm run build        # Production build
npm run lint         # Run ESLint
npm run test         # Run Vitest

# Vercel CLI
vercel               # Deploy to preview
vercel --prod        # Deploy to production
vercel ls            # List deployments
vercel logs <url>    # View deployment logs
vercel env ls        # List environment variables
vercel promote <url> # Rollback to a specific deployment

# Debugging
vercel inspect <url> # Inspect a deployment
```

---

## 9. Incident Response

### 9.1 Severity Levels

| Level | Definition | Response Time | Example |
|-------|------------|---------------|---------|
| P0 | Site is down or data loss | Immediate | 500 errors on all requests |
| P1 | Major feature broken | <1 hour | Puzzle loading fails |
| P2 | Minor feature broken | <4 hours | Share button not working |
| P3 | Cosmetic / low impact | Next sprint | Animation glitch |

### 9.2 Incident Response Steps

1. **Detect** - Sentry alert, uptime monitor, or user report
2. **Assess** - Determine severity (P0-P3)
3. **Mitigate** - Rollback if P0/P1 (see Section 6)
4. **Investigate** - Check Vercel logs, Sentry, and PostHog
5. **Fix** - Implement fix on a branch, PR, and deploy
6. **Postmortem** - Document what happened and how to prevent recurrence
