# Cluegrid - Technical Architecture

## 1. Architecture Overview

### 1.1 High-Level Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT (Browser)                         │
├─────────────────────────────────────────────────────────────────┤
│  Next.js App (React 18)                                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │  Puzzle  │ │  Stats   │ │  Share   │ │ Settings │           │
│  │   View   │ │   View   │ │  Card    │ │   View   │           │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘           │
│       │            │            │            │                   │
│  ┌────▼────────────▼────────────▼────────────▼────┐             │
│  │              State Management (Zustand)         │             │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐           │             │
│  │  │ Puzzle  │ │  User   │ │   UI    │           │             │
│  │  │  State  │ │  State  │ │  State  │           │             │
│  │  └─────────┘ └─────────┘ └─────────┘           │             │
│  └────────────────────┬───────────────────────────┘             │
│                       │                                          │
│  ┌────────────────────▼───────────────────────────┐             │
│  │              localStorage Persistence           │             │
│  └─────────────────────────────────────────────────┘             │
└───────────────────────────┬─────────────────────────────────────┘
                            │ HTTPS
┌───────────────────────────▼─────────────────────────────────────┐
│                       VERCEL EDGE                                │
├─────────────────────────────────────────────────────────────────┤
│  Next.js API Routes                                              │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐             │
│  │ /api/puzzle  │ │ /api/verify  │ │ /api/stats   │             │
│  │   [date]     │ │              │ │   (future)   │             │
│  └──────┬───────┘ └──────┬───────┘ └──────────────┘             │
│         │                │                                       │
└─────────┼────────────────┼───────────────────────────────────────┘
          │                │
┌─────────▼────────────────▼───────────────────────────────────────┐
│                      SUPABASE                                     │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐             │
│  │   puzzles    │ │    words     │ │    clues     │             │
│  │    table     │ │    table     │ │    table     │             │
│  └──────────────┘ └──────────────┘ └──────────────┘             │
│                                                                   │
│  ┌──────────────┐                                                │
│  │   Admin UI   │ (Supabase Studio or custom)                    │
│  └──────────────┘                                                │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Design Principles

1. **Edge-first:** Minimize server round-trips
2. **Offline-capable:** Game playable without network after initial load
3. **Privacy-preserving:** Anonymous by default, no tracking beyond analytics
4. **Simple scaling:** Static + serverless, no infrastructure management
5. **Fast iteration:** Ship daily, measure, adjust

---

## 2. Tech Stack

### 2.1 Frontend

| Layer | Technology | Rationale |
|-------|------------|-----------|
| Framework | Next.js 14 (App Router) | SSR, API routes, Vercel integration |
| Language | TypeScript | Type safety, better DX |
| Styling | Tailwind CSS | Rapid UI development, small bundle |
| State | Zustand | Simple, lightweight, React-native |
| Animation | Framer Motion | Declarative, performant animations |
| Testing | Vitest + Testing Library | Fast, modern testing |

### 2.2 Backend

| Layer | Technology | Rationale |
|-------|------------|-----------|
| API | Next.js API Routes | Co-located, serverless |
| Database | Supabase (Postgres) | Managed, free tier generous |
| Auth | None (MVP) | Anonymous localStorage first |
| CDN | Vercel Edge | Global, automatic |

### 2.3 Infrastructure

| Service | Purpose |
|---------|---------|
| Vercel | Hosting, CI/CD, Edge Functions |
| Supabase | Database, future auth |
| PostHog | Product analytics |
| Sentry | Error tracking |
| GitHub | Source control, issues |

---

## 3. Data Architecture

### 3.1 Database Schema

```sql
-- Core puzzle content
CREATE TABLE puzzles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    puzzle_date DATE UNIQUE NOT NULL,
    main_word VARCHAR(10) NOT NULL,
    status VARCHAR(20) DEFAULT 'draft', -- draft, scheduled, published
    difficulty_rating INT, -- 1-5, editorial assessment
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE crossers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    puzzle_id UUID REFERENCES puzzles(id) ON DELETE CASCADE,
    word VARCHAR(10) NOT NULL,
    direction VARCHAR(10) NOT NULL, -- 'across' or 'down'
    start_row INT NOT NULL,
    start_col INT NOT NULL,
    intersection_index INT NOT NULL, -- which letter intersects main word
    clue TEXT NOT NULL,
    display_order INT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Word dictionary for validation
CREATE TABLE words (
    word VARCHAR(10) PRIMARY KEY,
    frequency_rank INT, -- common words rank higher
    is_valid_guess BOOLEAN DEFAULT true,
    is_valid_answer BOOLEAN DEFAULT true, -- stricter for answers
    added_at TIMESTAMPTZ DEFAULT NOW()
);

-- Analytics (optional, can use PostHog instead)
CREATE TABLE puzzle_stats (
    puzzle_id UUID REFERENCES puzzles(id),
    total_plays INT DEFAULT 0,
    total_wins INT DEFAULT 0,
    avg_guesses DECIMAL(3,2),
    guess_distribution JSONB, -- {1: 5, 2: 20, 3: 50, ...}
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (puzzle_id)
);

-- Indexes
CREATE INDEX idx_puzzles_date ON puzzles(puzzle_date);
CREATE INDEX idx_crossers_puzzle ON crossers(puzzle_id);
CREATE INDEX idx_words_valid ON words(is_valid_guess) WHERE is_valid_guess = true;
```

### 3.2 Client-Side Data Model

```typescript
// Core types
interface Puzzle {
  id: string;
  date: string; // YYYY-MM-DD
  mainWord: string;
  crossers: Crosser[];
  gridSize: { rows: number; cols: number };
}

interface Crosser {
  id: string;
  word: string;
  clue: string;
  direction: 'across' | 'down';
  startPosition: { row: number; col: number };
  intersectionIndex: number;
}

interface Guess {
  word: string;
  targetWord: 'main' | string; // 'main' or crosser id
  feedback: LetterFeedback[];
  timestamp: number;
}

interface LetterFeedback {
  letter: string;
  status: 'correct' | 'present' | 'absent';
}

// Game state
interface GameState {
  puzzleId: string;
  guesses: Guess[];
  solvedWords: string[]; // word ids that are solved
  status: 'playing' | 'won' | 'lost';
  startedAt: number;
  completedAt?: number;
}

// User stats (localStorage)
interface UserStats {
  gamesPlayed: number;
  gamesWon: number;
  currentStreak: number;
  maxStreak: number;
  guessDistribution: Record<number, number>;
  lastPlayedDate: string;
  lastCompletedDate: string;
}
```

### 3.3 localStorage Schema

```typescript
// Keys and structure
const STORAGE_KEYS = {
  GAME_STATE: 'cluegrid:game', // Current game state
  USER_STATS: 'cluegrid:stats', // Aggregate stats
  SETTINGS: 'cluegrid:settings', // User preferences
  HISTORY: 'cluegrid:history', // Past game summaries (last 30)
};

// Example stored data
{
  "cluegrid:game": {
    "puzzleId": "2024-01-15",
    "guesses": [...],
    "status": "playing"
  },
  "cluegrid:stats": {
    "gamesPlayed": 47,
    "gamesWon": 38,
    "currentStreak": 12,
    ...
  },
  "cluegrid:settings": {
    "theme": "dark",
    "reducedMotion": false,
    "colorBlindMode": false
  }
}
```

---

## 4. API Design

### 4.1 Endpoints

#### GET /api/puzzle/[date]

Fetch puzzle for a specific date.

**Request:**
```
GET /api/puzzle/2024-01-15
```

**Response (200):**
```json
{
  "id": "abc123",
  "date": "2024-01-15",
  "gridSize": { "rows": 7, "cols": 5 },
  "crossers": [
    {
      "id": "cross1",
      "clue": "Playing cards for one person",
      "direction": "down",
      "startPosition": { "row": 0, "col": 1 },
      "length": 5
    }
  ],
  "mainWordLength": 5,
  "mainWordRow": 3
}
```

**Note:** Words are NOT included in response. Validation happens server-side.

#### POST /api/verify

Validate a guess and get feedback.

**Request:**
```json
{
  "puzzleId": "abc123",
  "guess": "CRANE",
  "targetWord": "main"
}
```

**Response (200):**
```json
{
  "valid": true,
  "feedback": [
    { "letter": "C", "status": "correct" },
    { "letter": "R", "status": "absent" },
    { "letter": "A", "status": "present" },
    { "letter": "N", "status": "correct" },
    { "letter": "E", "status": "correct" }
  ],
  "solved": false,
  "revealedLetters": []
}
```

**Response (solved crosser):**
```json
{
  "valid": true,
  "feedback": [...],
  "solved": true,
  "revealedLetters": [
    { "row": 3, "col": 1, "letter": "A" }
  ]
}
```

#### GET /api/puzzle/today

Redirect to today's puzzle date.

```
GET /api/puzzle/today
→ 302 Redirect to /api/puzzle/2024-01-15
```

### 4.2 Error Handling

```json
// 400 - Invalid guess
{
  "error": "INVALID_WORD",
  "message": "Not in word list"
}

// 404 - No puzzle
{
  "error": "NO_PUZZLE",
  "message": "No puzzle available for this date"
}

// 429 - Rate limited
{
  "error": "RATE_LIMITED",
  "message": "Too many requests"
}
```

### 4.3 Security Considerations

1. **Rate limiting:** 60 requests/minute per IP
2. **Puzzle protection:** Never send answer in response
3. **Guess validation:** Server-side only
4. **CORS:** Restrict to known origins
5. **Input sanitization:** Validate all inputs server-side

---

## 5. Frontend Architecture

### 5.1 Directory Structure

```
src/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home/puzzle page
│   ├── stats/
│   │   └── page.tsx       # Stats page
│   ├── how-to-play/
│   │   └── page.tsx       # Tutorial
│   └── api/
│       ├── puzzle/
│       │   └── [date]/
│       │       └── route.ts
│       └── verify/
│           └── route.ts
│
├── components/
│   ├── game/
│   │   ├── Grid.tsx       # Main game grid
│   │   ├── Cell.tsx       # Individual cell
│   │   ├── Keyboard.tsx   # On-screen keyboard
│   │   ├── CluePanel.tsx  # Clue display
│   │   └── GuessInput.tsx # Current guess row
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Modal.tsx
│   │   └── Toast.tsx
│   ├── stats/
│   │   ├── StatsModal.tsx
│   │   ├── ShareCard.tsx
│   │   └── StreakDisplay.tsx
│   └── layout/
│       ├── Header.tsx
│       └── Footer.tsx
│
├── hooks/
│   ├── useGame.ts         # Game logic hook
│   ├── usePuzzle.ts       # Puzzle fetching
│   ├── useStats.ts        # Stats management
│   └── useKeyboard.ts     # Keyboard handling
│
├── stores/
│   ├── gameStore.ts       # Zustand game state
│   ├── settingsStore.ts   # User settings
│   └── statsStore.ts      # User stats
│
├── lib/
│   ├── api.ts             # API client
│   ├── storage.ts         # localStorage wrapper
│   ├── share.ts           # Share card generation
│   └── analytics.ts       # PostHog wrapper
│
├── utils/
│   ├── dates.ts           # Date helpers
│   ├── validation.ts      # Input validation
│   └── grid.ts            # Grid calculations
│
└── types/
    └── index.ts           # TypeScript types
```

### 5.2 State Management

```typescript
// stores/gameStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface GameStore {
  // State
  puzzle: Puzzle | null;
  guesses: Guess[];
  currentGuess: string;
  selectedWord: 'main' | string;
  status: 'loading' | 'playing' | 'won' | 'lost';

  // Actions
  loadPuzzle: (date: string) => Promise<void>;
  addLetter: (letter: string) => void;
  removeLetter: () => void;
  submitGuess: () => Promise<void>;
  selectWord: (wordId: string) => void;
  reset: () => void;
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      // ... implementation
    }),
    {
      name: 'cluegrid:game',
      partialize: (state) => ({
        guesses: state.guesses,
        status: state.status,
      }),
    }
  )
);
```

### 5.3 Key Components

#### Grid Component

```tsx
// components/game/Grid.tsx
interface GridProps {
  puzzle: Puzzle;
  guesses: Guess[];
  revealedLetters: RevealedLetter[];
  selectedWord: string;
  onCellClick: (row: number, col: number) => void;
}

export function Grid({ puzzle, guesses, revealedLetters, selectedWord, onCellClick }: GridProps) {
  const grid = useMemo(() => buildGrid(puzzle, revealedLetters), [puzzle, revealedLetters]);

  return (
    <div
      className="grid gap-1"
      style={{ gridTemplateColumns: `repeat(${puzzle.gridSize.cols}, 1fr)` }}
      role="grid"
      aria-label="Puzzle grid"
    >
      {grid.map((row, rowIndex) => (
        row.map((cell, colIndex) => (
          <Cell
            key={`${rowIndex}-${colIndex}`}
            cell={cell}
            isSelected={isInSelectedWord(cell, selectedWord)}
            onClick={() => onCellClick(rowIndex, colIndex)}
          />
        ))
      ))}
    </div>
  );
}
```

---

## 6. Performance Targets

### 6.1 Core Web Vitals

| Metric | Target | Measurement |
|--------|--------|-------------|
| LCP | <1.5s | Largest Contentful Paint |
| FID | <100ms | First Input Delay |
| CLS | <0.1 | Cumulative Layout Shift |
| TTI | <2s | Time to Interactive |
| Bundle size | <100KB | gzipped JS |

### 6.2 Optimization Strategies

1. **Static generation:** Pre-render puzzle shell
2. **Code splitting:** Lazy load stats, settings
3. **Image optimization:** Next.js Image component
4. **Font optimization:** Variable font, subset
5. **Prefetching:** Preload tomorrow's puzzle
6. **Service worker:** Cache static assets (future PWA)

---

## 7. Deployment Architecture

### 7.1 Environments

| Environment | URL | Purpose |
|-------------|-----|---------|
| Development | localhost:3000 | Local dev |
| Preview | *.vercel.app | PR previews |
| Staging | staging.cluegrid.app | Pre-production |
| Production | cluegrid.app | Live |

### 7.2 CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run lint
      - run: npm run test
      - run: npm run build

  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

### 7.3 Environment Variables

```bash
# .env.local (development)
NEXT_PUBLIC_APP_URL=http://localhost:3000
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_KEY=xxx # server-side only
POSTHOG_KEY=xxx
SENTRY_DSN=xxx
```

---

## 8. Security

### 8.1 Threat Model

| Threat | Mitigation |
|--------|------------|
| Answer scraping | Server-side validation only |
| Guess manipulation | Server validates all guesses |
| DDoS | Vercel edge + rate limiting |
| XSS | React escaping + CSP headers |
| Data tampering | localStorage is user's own data |

### 8.2 Security Headers

```typescript
// next.config.js
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin'
  }
];
```

---

## 9. Monitoring & Observability

### 9.1 Logging

- **Client errors:** Sentry for JS exceptions
- **API errors:** Vercel logs + Sentry
- **Performance:** Vercel Analytics

### 9.2 Alerting

| Alert | Threshold | Channel |
|-------|-----------|---------|
| Error rate spike | >5% in 5min | Slack |
| API latency | P95 >500ms | Slack |
| Deployment failure | Any | Slack + Email |

---

## 10. Future Considerations

### 10.1 PWA Roadmap

1. Service worker for offline play
2. Push notifications for daily reminder
3. Install prompt on mobile
4. Background sync for stats

### 10.2 Scaling Considerations

- **10K DAU:** Current architecture sufficient
- **100K DAU:** Add Redis caching layer
- **1M DAU:** Consider dedicated API, CDN puzzle delivery

### 10.3 Native App Path

If retention validates:
1. React Native shared logic
2. Or: Native Swift/Kotlin with shared API
3. Deep links between web and native
