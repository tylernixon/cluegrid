# Cluegrid - Backend Setup Plan

## 1. Supabase Project Setup

### 1.1 Create the Supabase Project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) and create a new project.
2. **Project name:** `cluegrid`
3. **Region:** US East (us-east-1) -- closest to Vercel's default edge region.
4. **Database password:** Generate a strong password. Store it in a password manager immediately -- you will not see it again.
5. Once the project is provisioned (~2 minutes), note the following from **Settings > API**:
   - Project URL (`https://<project-ref>.supabase.co`)
   - `anon` public key (safe for client-side, respects RLS)
   - `service_role` secret key (bypasses RLS, **server-side only**)

### 1.2 Enable Required Extensions

In the Supabase SQL Editor, run:

```sql
CREATE EXTENSION IF NOT EXISTS "pgcrypto";  -- gen_random_uuid()
```

`pgcrypto` is typically enabled by default on Supabase, but confirm explicitly.

### 1.3 Configure Row-Level Security (RLS)

RLS will be enabled on **every table** from the start. Even though we are using server-side API routes (which use the `service_role` key and bypass RLS), enabling RLS is a defense-in-depth measure. If someone discovers the `anon` key they still cannot read answers.

```sql
-- Enable RLS on all tables after creation
ALTER TABLE puzzles ENABLE ROW LEVEL SECURITY;
ALTER TABLE crossers ENABLE ROW LEVEL SECURITY;
ALTER TABLE words ENABLE ROW LEVEL SECURITY;
ALTER TABLE puzzle_stats ENABLE ROW LEVEL SECURITY;

-- No policies are needed for the anon role in MVP.
-- All data access goes through Next.js API routes using the service_role key.
-- This means the anon key has ZERO access to any table -- which is exactly what we want.
```

### 1.4 Configure Supabase Auth (Future)

Auth is **not used in MVP**. Game state is stored in `localStorage` on the client. When auth is introduced post-launch:

1. Enable email/magic-link provider.
2. Add a `user_games` table linking authenticated users to their game state.
3. Add RLS policies scoped to `auth.uid()`.

---

## 2. Database Migration Strategy

### 2.1 Migration Tool

We will use **raw SQL migration files** tracked in the repo under `supabase/migrations/`. This approach:

- Keeps migrations in version control alongside application code.
- Works with the Supabase CLI (`supabase db push` for remote, `supabase db reset` for local).
- Avoids ORM overhead for a small schema.

### 2.2 Local Development with Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Initialize local Supabase (inside project root)
supabase init

# Start local Supabase (Postgres + Studio on localhost)
supabase start

# Apply migrations to local database
supabase db reset
```

The local Supabase instance runs Postgres on `localhost:54322` and Studio on `localhost:54323`.

### 2.3 Migration File Structure

```
supabase/
├── config.toml                          # Supabase CLI config
├── migrations/
│   ├── 20260301000000_initial_schema.sql   # Tables, indexes, triggers
│   ├── 20260301000001_rls_policies.sql     # Row-level security
│   ├── 20260301000002_stored_procedures.sql# increment_puzzle_stats, etc.
│   └── 20260301000003_seed_words.sql       # Word dictionary import
└── seed.sql                             # Dev-only seed data (sample puzzles)
```

### 2.4 Migration Ordering

**Migration 1 -- Initial Schema** (`20260301000000_initial_schema.sql`):
- `puzzles` table with all columns, constraints, indexes
- `crossers` table with foreign key to puzzles
- `words` table (dictionary)
- `puzzle_stats` table
- `update_updated_at()` trigger function
- Triggers on `puzzles` and `puzzle_stats`

**Migration 2 -- RLS Policies** (`20260301000001_rls_policies.sql`):
- Enable RLS on all four tables
- Zero anon-role policies (all access via service_role)

**Migration 3 -- Stored Procedures** (`20260301000002_stored_procedures.sql`):
- `increment_puzzle_stats(p_puzzle_id, p_won, p_guess_count)` -- atomic stats upsert

**Migration 4 -- Word Dictionary** (`20260301000003_seed_words.sql`):
- Bulk insert of 5-letter English words
- Sourced from a curated word list (see Section 2.5)
- Top ~3,000 common words marked as `is_valid_answer = true`
- Full ~12,000 word list marked as `is_valid_guess = true`

### 2.5 Word Dictionary Source

We will use a curated 5-letter word list. Options:
- Stanford GraphBase list (2,309 common + extended)
- SOWPODS/TWL cross-referenced with frequency data
- Custom curation from multiple sources

Words are stored uppercase. A seed script (`scripts/seed-words.ts`) handles:
- Reading the word list from `data/words-5.txt`
- Assigning frequency ranks
- Batch upserting via Supabase client

### 2.6 Deploying Migrations to Production

```bash
# Link to remote project
supabase link --project-ref <project-ref>

# Push migrations to production
supabase db push

# Verify
supabase db diff  # should show no diff after push
```

Migration deployment will also be wired into CI (see Section 5).

---

## 3. API Route Structure

### 3.1 Route Map

```
src/app/api/
├── puzzle/
│   ├── today/
│   │   └── route.ts          # GET  -> 302 redirect to /api/puzzle/{date}
│   └── [date]/
│       └── route.ts          # GET  -> puzzle data (no answers)
├── verify/
│   └── route.ts              # POST -> validate guess, return feedback
├── stats/
│   └── [puzzleId]/
│       └── route.ts          # POST -> record completion (fire-and-forget)
└── admin/
    ├── puzzles/
    │   ├── route.ts           # GET  -> list puzzles (paginated)
    │   │                      # POST -> create puzzle
    │   └── [id]/
    │       └── route.ts       # GET  -> single puzzle (with answers)
    │                          # PUT  -> update puzzle
    │                          # DELETE -> delete puzzle (draft only)
    └── words/
        └── route.ts           # GET  -> search words
                               # POST -> add words to dictionary
```

### 3.2 Public Endpoints

#### `GET /api/puzzle/today`

Redirects to today's date-based puzzle URL.

- **Auth:** None
- **Rate limit:** 30 req/min per IP
- **Cache:** No cache (redirect)

```typescript
// Pseudocode
export async function GET() {
  const today = new Date().toISOString().split('T')[0];
  return NextResponse.redirect(`/api/puzzle/${today}`, 302);
}
```

#### `GET /api/puzzle/[date]`

Returns puzzle data for the given date, **without answers**.

- **Auth:** None
- **Rate limit:** 30 req/min per IP
- **Cache:** `Cache-Control: public, max-age=86400, s-maxage=86400` (puzzle is immutable once published)
- **Validation:** Date must be `YYYY-MM-DD` format and not in the future

Key implementation details:
- Query selects from `puzzles` + `crossers` but **omits** `main_word` and `crossers.word`
- Response is transformed from snake_case DB columns to camelCase TypeScript types
- The `mainWordLength` is derived server-side from `char_length(main_word)` without exposing the word

#### `POST /api/verify`

Validates a player's guess against a target word.

- **Auth:** None
- **Rate limit:** 60 req/min per IP (higher than puzzle fetch since gameplay involves multiple guesses)
- **Cache:** No cache
- **Validation:** Zod schema (`GuessSchema`)

Key implementation details:
1. Parse and validate request body with Zod
2. Fetch the puzzle + target word from DB (server-side, includes answers)
3. Check if the guess is a valid English word (`words` table lookup)
4. If invalid word: return `{ valid: false, isWord: false }`
5. If valid word: compute letter-by-letter feedback against the target
6. If all letters correct: return `{ solved: true }` with revealed intersection letters
7. The answer is **never** returned unless the game is lost (6 wrong guesses) -- and even then, only the main word

### 3.3 Admin Endpoints

All admin endpoints are protected by an API key check (see Section 4.2).

#### `GET /api/admin/puzzles`

List all puzzles with optional filters.

- **Query params:** `status`, `limit` (default 20, max 100), `offset`
- **Response:** Paginated list with puzzle metadata (includes `mainWord` for admin)

#### `POST /api/admin/puzzles`

Create a new puzzle with crossers in a single transaction.

- **Validation:** `CreatePuzzleSchema` (Zod) -- validates grid geometry, word lengths, intersection indices
- **Transaction:** Insert puzzle row, then bulk insert crossers

#### `PUT /api/admin/puzzles/[id]`

Update puzzle fields and/or crossers. Only `draft` and `scheduled` puzzles can be edited.

#### `DELETE /api/admin/puzzles/[id]`

Soft-deletes are not needed; hard delete is fine. Only `draft` status puzzles can be deleted.

### 3.4 Response Format Conventions

All API responses follow a consistent envelope:

```typescript
// Success
{ puzzle: { ... } }              // single resource
{ puzzles: [...], total, limit, offset }  // paginated list

// Error
{ error: "ERROR_CODE", message: "Human-readable message" }
```

HTTP status codes:
- `200` -- success
- `201` -- created
- `302` -- redirect
- `400` -- validation error / invalid input
- `401` -- unauthorized (admin routes)
- `404` -- resource not found
- `429` -- rate limited
- `500` -- internal server error

---

## 4. Security Measures

### 4.1 Answer Protection (Critical)

This is the single most important security requirement. Answers must **never** reach the client.

**Enforcement layers:**

1. **Database query discipline:** Public-facing queries explicitly list selected columns and never include `main_word` or `crossers.word`. We will create a Postgres VIEW to make this impossible to accidentally violate:

```sql
CREATE VIEW public_puzzles AS
SELECT
    p.id,
    p.puzzle_date,
    p.grid_rows,
    p.grid_cols,
    p.main_word_row,
    p.main_word_col,
    char_length(p.main_word) AS main_word_length
FROM puzzles p
WHERE p.status = 'published';

CREATE VIEW public_crossers AS
SELECT
    c.id,
    c.puzzle_id,
    c.clue,
    c.direction,
    c.start_row,
    c.start_col,
    char_length(c.word) AS word_length,
    c.display_order
FROM crossers c;
```

2. **API route separation:** Public routes (`/api/puzzle/*`, `/api/verify`) use the views above. Admin routes use full table access.

3. **RLS as backstop:** Even if the `anon` key leaks, RLS prevents direct table reads.

4. **Response auditing:** A unit test will assert that no public API response contains an `answer`, `mainWord`, or `word` field (except in the game-over loss scenario).

### 4.2 Admin Authentication

For MVP, admin endpoints are protected by a shared API key:

```typescript
// middleware or route-level check
function requireAdmin(request: Request): boolean {
  const key = request.headers.get('x-admin-key');
  return key === process.env.ADMIN_API_KEY;
}
```

Post-MVP, this will be replaced by Supabase Auth with an `admin` role.

### 4.3 Rate Limiting

Rate limiting is implemented at the API route level using an in-memory sliding window counter (suitable for serverless with Vercel's edge runtime).

| Endpoint | Limit | Window |
|----------|-------|--------|
| `GET /api/puzzle/*` | 30 req | 1 minute |
| `POST /api/verify` | 60 req | 1 minute |
| `POST /api/stats/*` | 10 req | 1 minute |
| `* /api/admin/*` | 20 req | 1 minute |

Implementation options:
- **MVP:** Vercel's built-in rate limiting (if on Pro plan), or `@upstash/ratelimit` with Upstash Redis (free tier: 10K commands/day)
- **Fallback:** In-memory Map with IP keys (resets on cold start, acceptable for MVP)

### 4.4 Input Validation

Every API endpoint validates inputs with Zod before any database interaction:

- `guess` field: exactly 5 uppercase ASCII letters (`/^[A-Z]{5}$/`)
- `puzzleId` field: valid UUID v4
- `target` field: `"main"` or valid UUID
- `date` path param: `YYYY-MM-DD` format, valid calendar date
- Admin payloads: full schema validation including grid geometry constraints

### 4.5 CORS Configuration

```typescript
// next.config.js
const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGINS || 'https://cluegrid.app',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-admin-key',
};
```

In development, `ALLOWED_ORIGINS` is set to `http://localhost:3000`.

### 4.6 Security Headers

Applied globally via `next.config.js`:

```
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
```

### 4.7 Supabase Key Handling

| Key | Where Used | Exposed to Client? |
|-----|------------|-------------------|
| `SUPABASE_URL` | API routes | No |
| `SUPABASE_ANON_KEY` | Nowhere (MVP) | No |
| `SUPABASE_SERVICE_ROLE_KEY` | API routes only | **Never** |

In MVP, **all** database access goes through Next.js API routes using the `service_role` key. The `anon` key is not used. This simplifies security: the client never talks to Supabase directly.

---

## 5. Environment Variables

### 5.1 Required Variables

```bash
# .env.local (development)
# ──────────────────────────────────────────────

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Supabase
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_ANON_KEY=eyJ...                    # Not used in MVP, but configured for future
SUPABASE_SERVICE_ROLE_KEY=eyJ...            # Server-side only. NEVER prefix with NEXT_PUBLIC_

# Admin
ADMIN_API_KEY=cg_admin_<random-32-chars>    # Shared secret for admin endpoints

# Analytics (optional for local dev)
NEXT_PUBLIC_POSTHOG_KEY=phc_...
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com

# Error Tracking (optional for local dev)
SENTRY_DSN=https://...@sentry.io/...

# Rate Limiting (optional, for Upstash Redis)
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
```

### 5.2 Variable Naming Convention

- `NEXT_PUBLIC_*` -- safe for client bundle, visible in browser
- All other vars -- server-side only, never included in client bundle
- The `SUPABASE_SERVICE_ROLE_KEY` must **never** have `NEXT_PUBLIC_` prefix

### 5.3 Vercel Environment Configuration

| Variable | Development | Preview | Production |
|----------|-------------|---------|------------|
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` | `https://*.vercel.app` | `https://cluegrid.app` |
| `SUPABASE_URL` | Local or dev project | Staging project | Production project |
| `SUPABASE_SERVICE_ROLE_KEY` | Local key | Staging key | Production key |
| `ADMIN_API_KEY` | Dev key | Staging key | Production key |

### 5.4 Local Development Setup

```bash
# 1. Clone the repo
git clone <repo-url> && cd cluegrid

# 2. Install dependencies
npm install

# 3. Copy env template
cp .env.example .env.local

# 4. Start local Supabase
supabase start

# 5. Apply migrations
supabase db reset

# 6. Seed sample puzzles (dev only)
npm run db:seed

# 7. Start dev server
npm run dev
```

---

## 6. Supabase Client Configuration

### 6.1 Server-Side Client (API Routes)

```typescript
// lib/db/client.ts
import { createClient } from '@supabase/supabase-js';

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: { persistSession: false },
    db: { schema: 'public' },
  }
);
```

### 6.2 Connection Pooling

Supabase provides connection pooling via Supavisor. For serverless (Vercel), use the pooled connection string (port `6543`) rather than the direct connection (port `5432`). This is handled automatically by the Supabase JS client.

---

## 7. Caching Strategy

### 7.1 Puzzle Data

Published puzzles are immutable. We cache aggressively:

- **Vercel Edge:** `s-maxage=86400` on `GET /api/puzzle/[date]` responses
- **Client:** `Cache-Control: public, max-age=86400`
- **Stale-while-revalidate:** `stale-while-revalidate=3600` for graceful updates

### 7.2 Verify Endpoint

No caching. Every guess is validated fresh against the database.

### 7.3 Word Dictionary

The `words` table is read-heavy and rarely changes. For the verify endpoint, we can:
- **MVP:** Query the DB directly (fast enough with Postgres indexes)
- **Scale:** Load the full word set into an in-memory `Set` at cold start (~100KB for 12K words)

---

## 8. Testing Strategy

### 8.1 API Route Tests

Each API route gets integration tests using Vitest:

```
__tests__/
├── api/
│   ├── puzzle.test.ts        # GET /api/puzzle/[date]
│   ├── verify.test.ts        # POST /api/verify
│   └── admin/
│       └── puzzles.test.ts   # Admin CRUD
├── lib/
│   ├── validation.test.ts    # Zod schema tests
│   └── feedback.test.ts      # Letter feedback algorithm
└── security/
    └── no-answer-leak.test.ts # Assert answers never in public responses
```

### 8.2 Security Tests

Dedicated test suite that:
1. Fetches every public endpoint and asserts no answer fields in response
2. Verifies admin endpoints return 401 without the API key
3. Confirms RLS blocks direct Supabase queries with the anon key

---

## 9. Deployment Checklist

Before going live:

- [ ] Supabase project created in production region
- [ ] All migrations applied to production database
- [ ] Word dictionary seeded
- [ ] Environment variables set in Vercel (all three environments)
- [ ] RLS enabled and verified on all tables
- [ ] `SUPABASE_SERVICE_ROLE_KEY` confirmed NOT in any client bundle
- [ ] Rate limiting tested under load
- [ ] CORS restricted to production domain
- [ ] Security headers verified (use securityheaders.com)
- [ ] Admin API key rotated from any dev/staging value
- [ ] At least 30 puzzles scheduled with `status = 'published'`
- [ ] Monitoring/alerting configured (Sentry, Vercel Analytics)
- [ ] API response times verified < 200ms P95
