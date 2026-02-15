# Cluegrid - Frontend Setup Plan

## 1. Project Initialization

### 1.1 Create Next.js Project

```bash
npx create-next-app@14 . \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*" \
  --no-turbopack
```

**Why Next.js 14 (not 15):** Stability. 14 has mature App Router support, well-documented patterns, and fewer breaking changes to chase. We upgrade after launch, not before.

### 1.2 Install Dependencies

```bash
# State management
npm install zustand

# Animation
npm install framer-motion

# Analytics & monitoring
npm install posthog-js @sentry/nextjs

# Database client
npm install @supabase/supabase-js

# Testing
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom @vitejs/plugin-react

# Code quality
npm install -D prettier prettier-plugin-tailwindcss
```

### 1.3 TypeScript Configuration

Set `tsconfig.json` to strict mode:

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "moduleResolution": "bundler",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

`noUncheckedIndexedAccess` is the one extra flag worth enabling. It forces us to handle `undefined` when indexing arrays/objects, which prevents the most common class of runtime bugs in grid logic.

### 1.4 Environment Variables

```bash
# .env.local
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com

SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_KEY=

SENTRY_DSN=
```

Rule: Only `NEXT_PUBLIC_` prefixed vars ship to the browser. `SUPABASE_SERVICE_KEY` stays server-side.

---

## 2. Directory Structure

```
src/
├── app/                        # Next.js App Router pages
│   ├── layout.tsx              # Root layout (fonts, theme, providers)
│   ├── page.tsx                # Home / today's puzzle
│   ├── how-to-play/
│   │   └── page.tsx            # Tutorial page
│   └── api/
│       ├── puzzle/
│       │   └── [date]/
│       │       └── route.ts    # GET puzzle by date
│       └── verify/
│           └── route.ts        # POST guess verification
│
├── components/
│   ├── game/                   # Core gameplay components
│   │   ├── Grid.tsx            # Puzzle grid (renders cells)
│   │   ├── Cell.tsx            # Single grid cell with states
│   │   ├── Keyboard.tsx        # On-screen QWERTY keyboard
│   │   ├── CluePanel.tsx       # Crosser clue list
│   │   └── GuessInput.tsx      # Active guess row
│   ├── ui/                     # Reusable primitives
│   │   ├── Button.tsx
│   │   ├── Modal.tsx
│   │   └── Toast.tsx
│   ├── stats/                  # Stats & sharing
│   │   ├── StatsModal.tsx
│   │   ├── ShareCard.tsx
│   │   └── StreakDisplay.tsx
│   └── layout/                 # Page-level layout
│       ├── Header.tsx
│       └── Footer.tsx
│
├── hooks/                      # Custom React hooks
│   ├── useGame.ts              # Game logic orchestration
│   ├── usePuzzle.ts            # Puzzle fetch + cache
│   ├── useStats.ts             # Stats read/write
│   └── useKeyboard.ts          # Physical keyboard listener
│
├── stores/                     # Zustand stores
│   ├── gameStore.ts            # Puzzle state, guesses, status
│   ├── settingsStore.ts        # Theme, accessibility prefs
│   └── statsStore.ts           # Streaks, win rate, distribution
│
├── lib/                        # Service integrations
│   ├── api.ts                  # Typed fetch wrapper for API routes
│   ├── storage.ts              # localStorage read/write with versioning
│   ├── share.ts                # Share text generation + clipboard/Web Share
│   ├── analytics.ts            # PostHog event wrapper
│   └── supabase.ts             # Supabase client (server-side)
│
├── utils/                      # Pure utility functions
│   ├── dates.ts                # Date formatting, daily reset logic
│   ├── validation.ts           # Input sanitization
│   └── grid.ts                 # Grid coordinate math, cell lookup
│
└── types/
    └── index.ts                # Shared TypeScript types
```

### Design Decisions

**Flat component folders, no barrel exports.** Import directly: `import { Grid } from '@/components/game/Grid'`. Barrel files cause circular deps and break tree-shaking.

**hooks/ vs stores/.** Hooks orchestrate UI behavior (keyboard events, fetch lifecycle). Stores hold state. A hook might read from a store, but a store never calls a hook.

**lib/ vs utils/.** `lib/` contains modules with side effects (network, storage, analytics). `utils/` contains pure functions with zero side effects. This matters for testing.

---

## 3. Key Dependencies & Versions

| Package | Version | Purpose | Bundle Impact |
|---------|---------|---------|---------------|
| next | 14.x | Framework | N/A (server) |
| react | 18.x | UI library | ~40KB gzip |
| typescript | 5.x | Type safety | Dev only |
| zustand | 4.x | State management | ~1KB gzip |
| framer-motion | 11.x | Animations | ~30KB gzip (tree-shakeable) |
| @supabase/supabase-js | 2.x | DB client | ~12KB gzip |
| posthog-js | 1.x | Analytics | ~10KB gzip |
| @sentry/nextjs | 8.x | Error tracking | ~15KB gzip |
| tailwindcss | 3.x | Styling | Dev only (CSS output) |
| vitest | 2.x | Unit/integration tests | Dev only |
| @testing-library/react | 16.x | Component tests | Dev only |
| prettier | 3.x | Code formatting | Dev only |

**Estimated client JS budget:** ~90KB gzipped (under 100KB target).

**What we are NOT installing:**
- No CSS-in-JS (Tailwind handles it)
- No form library (one input field)
- No routing library (App Router is enough)
- No data fetching library (native fetch + simple wrapper)
- No component library (custom everything, it's a game not a dashboard)

---

## 4. Development Workflow

### 4.1 Scripts

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "format": "prettier --write \"src/**/*.{ts,tsx}\"",
    "format:check": "prettier --check \"src/**/*.{ts,tsx}\"",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "typecheck": "tsc --noEmit"
  }
}
```

### 4.2 Local Development

```bash
# First time
git clone <repo>
cp .env.example .env.local   # Fill in keys
npm install
npm run dev                   # http://localhost:3000
```

Target: clone-to-running in under 5 minutes.

### 4.3 Git Workflow

- **Branch naming:** `feat/grid-component`, `fix/keyboard-ios`, `chore/ci-setup`
- **Commits:** Conventional commits (`feat:`, `fix:`, `chore:`, `test:`, `docs:`)
- **PRs:** Squash merge to `main`. Every PR gets a Vercel preview.
- **No long-lived branches.** Ship small, ship often.

### 4.4 CI Pipeline

On every PR:
1. `npm run typecheck` -- catch type errors
2. `npm run lint` -- catch lint violations
3. `npm run format:check` -- catch formatting drift
4. `npm run test` -- run unit/integration tests
5. `npm run build` -- verify production build succeeds
6. Vercel preview deploy -- visual verification

On merge to `main`:
1. All of the above
2. Deploy to production via Vercel

### 4.5 Vitest Configuration

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

```typescript
// src/test/setup.ts
import '@testing-library/jest-dom';
```

### 4.6 Test Strategy

| Layer | Tool | What to Test | Coverage Target |
|-------|------|-------------|-----------------|
| Utils | Vitest | Grid math, date logic, validation | 100% |
| Stores | Vitest | State transitions, persistence | 90%+ |
| Components | Testing Library | Render, interaction, a11y | Key paths |
| API routes | Vitest | Request/response, edge cases | All endpoints |
| E2E | Manual (MVP) | Full game flow | Pre-release |

We do NOT aim for 100% component coverage. We test behavior, not implementation. If a component just renders props, it does not need a test.

---

## 5. Coding Standards

### 5.1 TypeScript Rules

- **Strict mode, no exceptions.** No `any`, no `@ts-ignore`, no `as` casts unless justified with a comment.
- **Types in `types/index.ts`** for shared types. Co-located types are fine for component props.
- **Prefer `interface` over `type`** for object shapes (better error messages, faster compilation).
- **No enums.** Use `as const` objects or union types instead. Enums have runtime cost and confusing behavior.

```typescript
// Do this
const CELL_STATUS = {
  EMPTY: 'empty',
  CORRECT: 'correct',
  PRESENT: 'present',
  ABSENT: 'absent',
} as const;
type CellStatus = (typeof CELL_STATUS)[keyof typeof CELL_STATUS];

// Not this
enum CellStatus {
  EMPTY = 'empty',
  CORRECT = 'correct',
  // ...
}
```

### 5.2 Component Patterns

- **Named exports only.** No default exports (except pages required by Next.js).
- **Props interface above component.** Named `ComponentNameProps`.
- **No prop spreading** (`{...props}`). Explicit is better.
- **Colocation.** If a component is only used in one place, keep it in the same file until it is needed elsewhere.

```tsx
// components/game/Cell.tsx
interface CellProps {
  letter: string;
  status: CellStatus;
  isSelected: boolean;
  onClick: () => void;
}

export function Cell({ letter, status, isSelected, onClick }: CellProps) {
  return (
    <button
      className={cn(
        'flex h-14 w-14 items-center justify-center rounded border-2 text-2xl font-bold',
        statusStyles[status],
        isSelected && 'ring-2 ring-accent'
      )}
      onClick={onClick}
      aria-label={`${letter || 'empty'}, ${status}`}
    >
      {letter}
    </button>
  );
}
```

### 5.3 State Management Rules

- **Zustand stores are flat.** No nested objects deeper than 2 levels.
- **Actions live in the store.** Components dispatch actions, never mutate state directly.
- **Selectors for reads.** Use selectors to avoid unnecessary re-renders.

```typescript
// Good: granular selector
const guesses = useGameStore((s) => s.guesses);

// Bad: selecting entire store
const store = useGameStore();
```

- **Persistence is explicit.** Only persist what must survive a refresh. Use `partialize` to exclude transient UI state.

### 5.4 Styling Rules

- **Tailwind only.** No inline styles, no CSS modules, no styled-components.
- **Design tokens in `tailwind.config.ts`.** Colors from PDD section 5.2, fonts from 5.3.
- **Mobile-first.** Write styles for 320px, then layer on `sm:`, `md:`, `lg:`.
- **No magic numbers.** Use Tailwind spacing scale. If a value does not exist in the scale, add it to the config.

```typescript
// tailwind.config.ts - custom theme tokens
const config = {
  theme: {
    extend: {
      colors: {
        correct: { light: '#6AAA64', dark: '#538D4E' },
        present: { light: '#C9B458', dark: '#B59F3B' },
        absent: { light: '#787C7E', dark: '#3A3A3C' },
        accent: { light: '#4A90D9', dark: '#5BA4E8' },
        surface: { light: '#FFFFFF', dark: '#1E1E1F' },
        bg: { light: '#FAFAFA', dark: '#121213' },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
};
```

### 5.5 Performance Rules

- **No barrel exports.** Import from specific files.
- **Lazy load modals and stats.** Use `next/dynamic` for components not needed on first paint.
- **Images through `next/image`.** Always specify width/height to prevent CLS.
- **Memoize grid calculations.** Grid building is O(n*m) -- wrap in `useMemo` keyed on puzzle + revealed letters.
- **No layout thrashing.** Batch DOM reads before DOM writes. Prefer CSS transforms over top/left.
- **Measure everything.** Run Lighthouse on every PR via Vercel preview. Regressions block merge.

### 5.6 Accessibility Baseline

- Every interactive element has a visible focus indicator.
- Grid cells use `role="gridcell"` with `aria-label` describing content and state.
- Keyboard component uses `role="group"` with `aria-label="Keyboard"`.
- Color is never the sole indicator of state (add icons or patterns for colorblind mode).
- Respect `prefers-reduced-motion` -- disable flip/shake animations when set.
- Test with VoiceOver (macOS/iOS) and keyboard-only navigation before each release.

### 5.7 File Naming

- **Components:** PascalCase (`Grid.tsx`, `CluePanel.tsx`)
- **Hooks:** camelCase with `use` prefix (`useGame.ts`, `useKeyboard.ts`)
- **Stores:** camelCase with `Store` suffix (`gameStore.ts`)
- **Utils/lib:** camelCase (`dates.ts`, `analytics.ts`)
- **Types:** camelCase (`index.ts`)
- **Test files:** Same name with `.test.ts(x)` suffix, co-located next to source

---

## 6. Tailwind Theme Setup

The full theme configuration, derived from the PDD design specs:

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        correct: { DEFAULT: '#6AAA64', dark: '#538D4E' },
        present: { DEFAULT: '#C9B458', dark: '#B59F3B' },
        absent: { DEFAULT: '#787C7E', dark: '#3A3A3C' },
        accent: { DEFAULT: '#4A90D9', dark: '#5BA4E8' },
        surface: { DEFAULT: '#FFFFFF', dark: '#1E1E1F' },
        bg: { DEFAULT: '#FAFAFA', dark: '#121213' },
        'text-primary': { DEFAULT: '#1A1A1A', dark: '#FFFFFF' },
        'text-secondary': { DEFAULT: '#666666', dark: '#A0A0A0' },
      },
      fontFamily: {
        sans: [
          'Inter',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'sans-serif',
        ],
      },
      fontSize: {
        'grid-letter': ['24px', { lineHeight: '1', fontWeight: '700' }],
        'stat-number': ['32px', { lineHeight: '1', fontWeight: '600' }],
      },
      animation: {
        'cell-pop': 'cell-pop 100ms ease-in-out',
        'cell-flip': 'cell-flip 500ms ease-in-out',
        'row-shake': 'row-shake 200ms ease-in-out',
      },
      keyframes: {
        'cell-pop': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' },
        },
        'cell-flip': {
          '0%': { transform: 'rotateX(0deg)' },
          '50%': { transform: 'rotateX(90deg)' },
          '100%': { transform: 'rotateX(0deg)' },
        },
        'row-shake': {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-4px)' },
          '75%': { transform: 'translateX(4px)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
```

---

## 7. Next Steps

After this plan is reviewed and approved:

1. **Initialize the Next.js project** with the command in section 1.1
2. **Install all dependencies** per section 1.2
3. **Configure TypeScript, ESLint, Prettier** per sections 1.3 and 5
4. **Set up Tailwind theme** with the tokens from section 6
5. **Create the directory structure** with placeholder files
6. **Set up Vitest** per section 4.5
7. **Create CI workflow** (`.github/workflows/ci.yml`)
8. **Wire up Vercel** for preview deploys

This gets us to Epic 1 completion: clone, install, run, build, test, deploy -- all working.
