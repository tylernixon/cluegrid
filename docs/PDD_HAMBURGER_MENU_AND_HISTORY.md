# Product Design Document: Navigation Overhaul & History Feature

**Product:** Gist (Word Puzzle Game)
**Version:** 2.0
**Date:** February 15, 2026
**Author:** Claude (Acting PO)
**Status:** Draft for Review

---

## Executive Summary

This PDD outlines a significant UX improvement to the Gist game, consolidating navigation into a hamburger menu, introducing a comprehensive puzzle history feature, and adding an accessible help system. These changes will improve discoverability, engagement, and player retention.

---

## Problem Statement

### Current State
- Header has a settings cog (left) and stats icon (right) as separate buttons
- No way for users to view or replay past puzzles
- Users who miss days have no way to catch up
- Onboarding only shows once on first visit; no way to re-access instructions
- Navigation feels scattered with modal-based access

### User Pain Points
1. **Lost Progress Anxiety:** Users who miss days feel disconnected from their streak
2. **No Replay Value:** Can't revisit interesting puzzles to share or review
3. **Forgotten Rules:** New or returning users can't easily refresh their memory
4. **Feature Discoverability:** Stats and settings feel disconnected from game flow

---

## Proposed Solution

### 1. Hamburger Menu (Left Side)
Replace the settings cog with a hamburger icon that opens a slide-out drawer containing:
- **Settings** - Theme, difficulty preferences
- **History** - View past puzzles (played & missed)
- **Stats** - Statistics and achievements

### 2. Help Icon (Right Side)
Replace the stats button with a help icon (`?`) that:
- Opens an enhanced onboarding/tutorial experience
- Provides an interactive walkthrough option
- Always accessible for rule refreshers

### 3. History Feature
A new view allowing users to:
- Browse calendar of past puzzles
- See which puzzles were played (with results)
- Identify missed puzzles
- Replay old puzzles (view-only mode with solution reveal)
- Play missed puzzles (full game mode, stats-optional)

---

## User Stories

### Epic 1: Hamburger Menu Navigation

| ID | Story | Priority | Points |
|----|-------|----------|--------|
| HM-1 | As a user, I want to tap a hamburger icon to see all menu options in one place | P0 | 3 |
| HM-2 | As a user, I want a slide-out drawer that shows Settings, History, and Stats | P0 | 5 |
| HM-3 | As a user, I want to tap outside the drawer to close it | P0 | 1 |
| HM-4 | As a user, I want smooth animations when opening/closing the drawer | P1 | 2 |
| HM-5 | As a user, I want the drawer to be accessible via swipe gesture from the left edge | P2 | 3 |

### Epic 2: History Feature

| ID | Story | Priority | Points |
|----|-------|----------|--------|
| HI-1 | As a user, I want to see a calendar view of past puzzles | P0 | 5 |
| HI-2 | As a user, I want to see visual indicators for played/won/lost/missed puzzles | P0 | 3 |
| HI-3 | As a user, I want to tap a past puzzle to view details (my guesses, solution) | P0 | 5 |
| HI-4 | As a user, I want to play missed puzzles in full game mode | P0 | 8 |
| HI-5 | As a user, I want the option to include/exclude missed puzzles from my stats | P1 | 3 |
| HI-6 | As a user, I want to share results from old puzzles | P2 | 2 |
| HI-7 | As a user, I want to filter history by month/date range | P2 | 3 |

### Epic 3: Enhanced Help System

| ID | Story | Priority | Points |
|----|-------|----------|--------|
| HP-1 | As a user, I want a help icon in the header to access instructions anytime | P0 | 2 |
| HP-2 | As a user, I want to re-view the onboarding tutorial on demand | P0 | 1 |
| HP-3 | As a user, I want an interactive walkthrough using a sample puzzle | P1 | 8 |
| HP-4 | As a user, I want step-by-step guidance that highlights UI elements | P1 | 5 |
| HP-5 | As a user, I want to exit the tutorial at any point and resume my game | P1 | 2 |

---

## Technical Design

### Data Model Changes

```typescript
// New: Extend session storage to track ALL played games
interface GameHistory {
  puzzleId: string;
  puzzleDate: string;
  playedAt: string;
  status: "won" | "lost" | "abandoned";
  guessCount: number;
  hintsUsed: number;
  starRating: 0 | 1 | 2 | 3;
  guesses: Guess[];           // Full guess history
  revealedLetters: RevealedLetter[];
  difficulty: Difficulty;
}

// Store all history in localStorage
// Key: "gist:history"
// Value: GameHistory[]

// New: Track available puzzles
interface PuzzleAvailability {
  date: string;
  status: "played" | "missed" | "future" | "today";
  historyId?: string;  // Reference to GameHistory if played
}
```

### API Changes

```typescript
// New endpoint: Get puzzle by date for history replay
GET /api/puzzle/[date]
// Already exists, will need to support "archive" mode flag

// New endpoint: Get available puzzle dates
GET /api/puzzles/archive
// Returns: { dates: string[], firstPuzzleDate: string }
```

### Component Architecture

```
src/components/
├── layout/
│   ├── HamburgerMenu.tsx      # NEW: Drawer container
│   ├── MenuDrawer.tsx         # NEW: Slide-out drawer content
│   └── MenuItem.tsx           # NEW: Individual menu item
├── game/
│   ├── HistoryView.tsx        # NEW: Calendar + puzzle list
│   ├── HistoryCalendar.tsx    # NEW: Month calendar component
│   ├── HistoryPuzzleCard.tsx  # NEW: Single puzzle summary
│   ├── HistoryDetailModal.tsx # NEW: View past puzzle details
│   ├── HelpIcon.tsx           # NEW: Help button component
│   ├── InteractiveTour.tsx    # NEW: Step-by-step walkthrough
│   └── OnboardingModal.tsx    # MODIFY: Add re-access support
└── stores/
    └── historyStore.ts        # NEW: History state management
```

### State Management

```typescript
// New Zustand store: historyStore.ts
interface HistoryStore {
  history: GameHistory[];

  // Actions
  recordGame: (game: GameHistory) => void;
  getHistoryForDate: (date: string) => GameHistory | undefined;
  getMissedPuzzles: () => string[];  // Returns array of dates
  getPlayedPuzzles: () => string[];
  clearHistory: () => void;
}
```

---

## UI/UX Specifications

### Hamburger Menu Design

```
┌─────────────────────────────────┐
│ ☰         [GIST]           (?) │  ← Header
└─────────────────────────────────┘

When hamburger tapped:
┌──────────────┬──────────────────┐
│              │                  │
│  ⚙ Settings  │    (dimmed      │
│              │     game area)   │
│  📅 History  │                  │
│              │                  │
│  📊 Stats    │                  │
│              │                  │
│──────────────│                  │
│              │                  │
│  Version 2.0 │                  │
└──────────────┴──────────────────┘
     Drawer         Overlay
```

### History View Design

```
┌─────────────────────────────────┐
│  ←  Puzzle History              │
├─────────────────────────────────┤
│     ◀  February 2026  ▶         │
│                                 │
│  Su  Mo  Tu  We  Th  Fr  Sa     │
│                              1  │
│   2   3   4   5   6   7   8     │
│   9  10  11  12  13  14 [15]    │
│  16  17  18  19  20  21  22     │
│  23  24  25  26  27  28         │
│                                 │
├─────────────────────────────────┤
│ Legend:                         │
│  🟢 Won  🔴 Lost  ⚫ Missed  ⬜ Future │
├─────────────────────────────────┤
│ Feb 14 - ⭐⭐⭐ Perfect!         │
│ Feb 13 - ⭐⭐ 2 hints used       │
│ Feb 12 - ⚫ MISSED - Tap to play│
│ Feb 11 - 🔴 Lost - Tap to view  │
└─────────────────────────────────┘
```

### Help Icon Behavior

```
Tap (?) icon:
┌─────────────────────────────────┐
│      How would you like help?   │
├─────────────────────────────────┤
│                                 │
│   📖 View Tutorial              │
│   Quick refresher on the rules  │
│                                 │
│   🎮 Interactive Walkthrough    │
│   Play a guided practice puzzle │
│                                 │
│   ❌ Cancel                     │
└─────────────────────────────────┘
```

---

## Sprint Plan

### Sprint 1: Foundation (Week 1)
**Goal:** Core hamburger menu infrastructure

| Task | Owner | Points |
|------|-------|--------|
| Create HamburgerMenu component shell | Frontend | 3 |
| Create MenuDrawer with slide animation | Frontend | 5 |
| Migrate Settings to drawer | Frontend | 2 |
| Migrate Stats to drawer | Frontend | 2 |
| Update header layout (remove old buttons) | Frontend | 2 |
| Add help icon to header (placeholder) | Frontend | 1 |
| Unit tests for drawer behavior | QA | 2 |

**Sprint Points:** 17

---

### Sprint 2: History Data Layer (Week 2)
**Goal:** History storage and API

| Task | Owner | Points |
|------|-------|--------|
| Create historyStore with Zustand | Frontend | 5 |
| Integrate history recording into gameStore | Frontend | 3 |
| Create /api/puzzles/archive endpoint | Backend | 5 |
| Migrate existing sessions to history format | Frontend | 3 |
| Add history persistence to localStorage | Frontend | 2 |

**Sprint Points:** 18

---

### Sprint 3: History UI (Week 3)
**Goal:** Visual history browsing

| Task | Owner | Points |
|------|-------|--------|
| Create HistoryView container | Frontend | 2 |
| Build HistoryCalendar component | Frontend | 5 |
| Create puzzle status indicators | Frontend | 3 |
| Build HistoryPuzzleCard list items | Frontend | 3 |
| Wire up drawer → history navigation | Frontend | 2 |
| Add month navigation | Frontend | 2 |

**Sprint Points:** 17

---

### Sprint 4: History Replay (Week 4)
**Goal:** View and play past puzzles

| Task | Owner | Points |
|------|-------|--------|
| Create HistoryDetailModal (view mode) | Frontend | 5 |
| Implement "Play Missed Puzzle" flow | Frontend | 8 |
| Add archive mode flag to puzzle loading | Backend | 3 |
| Stats inclusion toggle for missed puzzles | Frontend | 3 |
| Integration tests for replay flow | QA | 3 |

**Sprint Points:** 22

---

### Sprint 5: Help System (Week 5)
**Goal:** Enhanced onboarding and help

| Task | Owner | Points |
|------|-------|--------|
| Update OnboardingModal for re-access | Frontend | 2 |
| Create help menu action sheet | Frontend | 2 |
| Build InteractiveTour component | Frontend | 8 |
| Create sample tutorial puzzle data | Design | 2 |
| Add tour highlighting system | Frontend | 5 |
| Exit tour and resume game logic | Frontend | 2 |

**Sprint Points:** 21

---

### Sprint 6: Polish & Launch (Week 6)
**Goal:** Refinement and release

| Task | Owner | Points |
|------|-------|--------|
| Edge swipe to open drawer (mobile) | Frontend | 3 |
| History share functionality | Frontend | 2 |
| Animation polish pass | Frontend | 3 |
| Accessibility audit (a11y) | QA | 3 |
| Performance optimization | Frontend | 2 |
| E2E test suite | QA | 5 |
| Documentation update | Docs | 2 |

**Sprint Points:** 20

---

## Success Metrics

| Metric | Current | Target | Measurement |
|--------|---------|--------|-------------|
| Feature discovery rate | N/A | 80%+ users open menu | PostHog events |
| History engagement | 0 | 30%+ users view history | PostHog events |
| Missed puzzle completion | 0 | 50%+ missed puzzles played | Analytics |
| Help access rate | ~1% (first visit only) | 10%+ return users | PostHog events |
| Tutorial completion | N/A | 70%+ who start finish | PostHog events |
| User retention (D7) | Baseline | +15% | Analytics |

---

## Risks & Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| localStorage size limits | High | Medium | Store minimal data per game (~500 bytes); compress guesses; lazy-load full details from API |
| Complex replay state management | Medium | High | Clear separation of "live" vs "replay" mode |
| API rate limiting for archive | Medium | Low | Aggressive caching, pagination |
| Users confused by two puzzle modes | Medium | Medium | Clear visual distinction for replay puzzles |

---

## Decisions (Resolved)

1. **Folder rename:** ✅ Renamed `/cluegrid` → `/gist`
2. **History depth:** ✅ All puzzles since launch (no time limit)
3. **Missed puzzle stats:** ✅ Included in main stats by default
4. **Tutorial puzzle:** TBD - Use a real past puzzle or synthetic example?

---

## Appendix A: File Changes Summary

### Modified Files
- `src/app/page.tsx` - Header restructure
- `src/components/game/OnboardingModal.tsx` - Re-access support
- `src/stores/gameStore.ts` - History recording integration
- `src/stores/statsStore.ts` - Optional history stats

### New Files
- `src/components/layout/HamburgerMenu.tsx`
- `src/components/layout/MenuDrawer.tsx`
- `src/components/layout/MenuItem.tsx`
- `src/components/game/HistoryView.tsx`
- `src/components/game/HistoryCalendar.tsx`
- `src/components/game/HistoryPuzzleCard.tsx`
- `src/components/game/HistoryDetailModal.tsx`
- `src/components/game/HelpIcon.tsx`
- `src/components/game/InteractiveTour.tsx`
- `src/stores/historyStore.ts`
- `src/app/api/puzzles/archive/route.ts`

---

## Approval

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Product Owner | Claude (Acting) | 2026-02-15 | ✓ |
| Tech Lead | TBD | | |
| Design Lead | TBD | | |
| Engineering Manager | TBD | | |

---

*Document Version: 1.0*
*Last Updated: February 15, 2026*
