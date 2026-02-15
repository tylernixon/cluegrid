# Cluegrid - Epics & Sprint Plan

## Overview

**Total Timeline:** 8-12 weeks to public launch
**Team Size:** 1-2 engineers + 1 content editor (part-time)
**Sprint Length:** 1 week

---

## Epic Overview

| Epic | Name | Duration | Dependencies |
|------|------|----------|--------------|
| E1 | Project Setup & Foundation | 1 week | None |
| E2 | Core Gameplay | 2 weeks | E1 |
| E3 | Stats & Persistence | 1 week | E2 |
| E4 | Sharing & Social | 0.5 week | E2, E3 |
| E5 | Polish & Accessibility | 1 week | E2 |
| E6 | Admin & Content Pipeline | 1 week | E1 |
| E7 | Analytics & Monitoring | 0.5 week | E2 |
| E8 | Beta Testing | 2-4 weeks | E1-E7 |
| E9 | Launch Prep | 1 week | E8 |

---

## Epic 1: Project Setup & Foundation

**Goal:** Establish codebase, tooling, and infrastructure

**Duration:** Week 1

### User Stories

| ID | Story | Points | Priority |
|----|-------|--------|----------|
| E1-1 | As a developer, I can clone the repo and run locally in <5 min | 2 | P0 |
| E1-2 | As a developer, I have TypeScript and linting configured | 1 | P0 |
| E1-3 | As a developer, I can deploy to Vercel preview on PR | 2 | P0 |
| E1-4 | As a developer, I have Supabase project configured | 2 | P0 |
| E1-5 | As a developer, I have test framework set up | 1 | P1 |

### Tasks

- [ ] Initialize Next.js 14 project with App Router
- [ ] Configure TypeScript strict mode
- [ ] Set up Tailwind CSS with custom theme tokens
- [ ] Configure ESLint + Prettier
- [ ] Set up Vitest + Testing Library
- [ ] Create Vercel project and connect repo
- [ ] Set up Supabase project
- [ ] Create database schema (puzzles, crossers, words)
- [ ] Configure environment variables
- [ ] Create basic CI pipeline (lint, test, build)
- [ ] Document local setup in README

### Acceptance Criteria

- [ ] `npm run dev` starts app at localhost:3000
- [ ] `npm run build` succeeds with no errors
- [ ] PR creates Vercel preview deployment
- [ ] Database tables exist and are accessible
- [ ] Tests run and pass

---

## Epic 2: Core Gameplay

**Goal:** Playable puzzle with full game mechanics

**Duration:** Weeks 2-3

### User Stories

| ID | Story | Points | Priority |
|----|-------|--------|----------|
| E2-1 | As a player, I can see today's puzzle grid | 3 | P0 |
| E2-2 | As a player, I can type letters using on-screen keyboard | 2 | P0 |
| E2-3 | As a player, I can submit a guess and see feedback | 5 | P0 |
| E2-4 | As a player, I can see clues for crossing words | 2 | P0 |
| E2-5 | As a player, I can tap to select which word I'm guessing | 2 | P0 |
| E2-6 | As a player, solving a crosser reveals its intersection | 3 | P0 |
| E2-7 | As a player, the keyboard shows letter states | 2 | P0 |
| E2-8 | As a player, I see a win screen when I solve the puzzle | 2 | P0 |
| E2-9 | As a player, I see a loss screen after 6 failed guesses | 2 | P0 |
| E2-10 | As a player, I can use my physical keyboard | 1 | P1 |

### Sprint 2 Tasks (Week 2)

**Focus:** Grid, keyboard, basic guess flow

- [ ] Create Grid component with dynamic sizing
- [ ] Create Cell component with states (empty, filled, correct, present, absent)
- [ ] Create Keyboard component with letter buttons
- [ ] Implement letter input (tap to add, backspace to remove)
- [ ] Create guess input row showing current guess
- [ ] Implement API route: GET /api/puzzle/[date]
- [ ] Implement API route: POST /api/verify
- [ ] Create useGame hook for game logic
- [ ] Implement Zustand game store
- [ ] Connect keyboard to game state
- [ ] Display basic feedback on guess submit

### Sprint 3 Tasks (Week 3)

**Focus:** Clues, word selection, completion states

- [ ] Create CluePanel component
- [ ] Implement word selection (tap grid or clue)
- [ ] Highlight selected word in grid
- [ ] Implement crosser reveal on solve
- [ ] Update keyboard colors based on all guesses
- [ ] Create completion modal (win state)
- [ ] Create completion modal (loss state)
- [ ] Add guess counter display
- [ ] Implement physical keyboard support
- [ ] Add error shake animation for invalid guesses
- [ ] Add letter flip animation on feedback

### Acceptance Criteria

- [ ] Can load a puzzle and see grid + clues
- [ ] Can type guess and submit
- [ ] See correct Wordle-style feedback
- [ ] Can solve crossing words and see letters reveal
- [ ] Win/loss states display correctly
- [ ] Keyboard reflects all guessed letter states

---

## Epic 3: Stats & Persistence

**Goal:** Track and display player statistics

**Duration:** Week 4

### User Stories

| ID | Story | Points | Priority |
|----|-------|--------|----------|
| E3-1 | As a player, my game state persists if I refresh | 2 | P0 |
| E3-2 | As a player, I can see my streak count | 2 | P0 |
| E3-3 | As a player, I can see my win/loss record | 2 | P0 |
| E3-4 | As a player, I can see my guess distribution | 2 | P0 |
| E3-5 | As a player, I can view my stats from a modal | 1 | P0 |
| E3-6 | As a player, my stats persist across sessions | 1 | P0 |

### Tasks

- [ ] Implement localStorage persistence for game state
- [ ] Create statsStore with Zustand
- [ ] Implement streak calculation logic
- [ ] Handle streak grace period (soft streak)
- [ ] Create StatsModal component
- [ ] Create guess distribution chart
- [ ] Create streak display component
- [ ] Add stats button to header
- [ ] Show stats modal on game completion
- [ ] Handle timezone for daily reset
- [ ] Test persistence across sessions

### Acceptance Criteria

- [ ] Refresh page maintains game state
- [ ] Stats show accurate win/loss/streak
- [ ] Distribution chart renders correctly
- [ ] Stats modal accessible from header and completion

---

## Epic 4: Sharing & Social

**Goal:** Generate and share results

**Duration:** Week 4 (parallel with E3)

### User Stories

| ID | Story | Points | Priority |
|----|-------|--------|----------|
| E4-1 | As a player, I can copy my result to clipboard | 3 | P0 |
| E4-2 | As a player, I can share via native share sheet (mobile) | 2 | P1 |
| E4-3 | As a player, the share text shows my guess pattern | 2 | P0 |

### Tasks

- [ ] Design share card format
- [ ] Implement share text generation
- [ ] Create Share button component
- [ ] Implement clipboard copy with feedback
- [ ] Implement Web Share API for mobile
- [ ] Add share button to completion modal
- [ ] Test share on iOS, Android, desktop

### Share Card Format

```
CLUEGRID #47 🧩
4/6 guesses

⬜⬜🟨⬜⬜
🟩⬜⬜⬜⬜
🟩🟩⬜🟨⬜
🟩🟩🟩🟩🟩

cluegrid.app
```

### Acceptance Criteria

- [ ] Share button copies formatted text
- [ ] Mobile native share works
- [ ] Pattern matches actual guesses

---

## Epic 5: Polish & Accessibility

**Goal:** Refine UX and ensure accessibility

**Duration:** Week 5

### User Stories

| ID | Story | Points | Priority |
|----|-------|--------|----------|
| E5-1 | As a player, I can use the app in dark mode | 2 | P0 |
| E5-2 | As a player, animations feel smooth and responsive | 2 | P0 |
| E5-3 | As a visually impaired player, I can use a screen reader | 3 | P0 |
| E5-4 | As a colorblind player, I can distinguish feedback | 2 | P0 |
| E5-5 | As a new player, I understand how to play | 3 | P0 |

### Tasks

- [ ] Implement dark mode with system preference detection
- [ ] Add theme toggle to settings
- [ ] Refine all animations (flip, shake, bounce)
- [ ] Add ARIA labels to grid and keyboard
- [ ] Implement focus management
- [ ] Add keyboard navigation support
- [ ] Create colorblind mode with patterns
- [ ] Create "How to Play" tutorial modal
- [ ] Add first-time user onboarding flow
- [ ] Test with VoiceOver/TalkBack
- [ ] Audit and fix contrast ratios

### Acceptance Criteria

- [ ] Dark/light mode works with toggle
- [ ] Screen reader announces game state
- [ ] Tab navigation works throughout
- [ ] Colorblind mode distinguishable
- [ ] New users see tutorial on first visit

---

## Epic 6: Admin & Content Pipeline

**Goal:** Enable content creation and management

**Duration:** Week 5 (parallel with E5)

### User Stories

| ID | Story | Points | Priority |
|----|-------|--------|----------|
| E6-1 | As an admin, I can create a new puzzle | 3 | P0 |
| E6-2 | As an admin, I can preview a puzzle before publishing | 2 | P0 |
| E6-3 | As an admin, I can schedule puzzles for future dates | 2 | P0 |
| E6-4 | As an admin, I can see which dates have puzzles | 1 | P0 |

### Tasks

- [ ] Create admin route with basic auth
- [ ] Build puzzle creation form
- [ ] Implement grid preview component
- [ ] Add word validation against dictionary
- [ ] Create puzzle calendar view
- [ ] Implement puzzle scheduling
- [ ] Build puzzle edit functionality
- [ ] Seed initial 90 puzzles
- [ ] Document content guidelines for editors

### Acceptance Criteria

- [ ] Can create puzzle with main word + crossers + clues
- [ ] Preview shows exact player experience
- [ ] Calendar shows scheduled vs empty dates
- [ ] Initial content ready for launch

---

## Epic 7: Analytics & Monitoring

**Goal:** Track key metrics and errors

**Duration:** Week 5 (parallel)

### User Stories

| ID | Story | Points | Priority |
|----|-------|--------|----------|
| E7-1 | As a PM, I can see daily active users | 2 | P0 |
| E7-2 | As a PM, I can see puzzle completion rate | 2 | P0 |
| E7-3 | As an engineer, I get alerts for errors | 2 | P0 |

### Tasks

- [ ] Set up PostHog project
- [ ] Implement analytics wrapper
- [ ] Add key event tracking (see Analytics Plan)
- [ ] Set up Sentry for error tracking
- [ ] Create PostHog dashboards
- [ ] Configure error alerting
- [ ] Test event firing

### Acceptance Criteria

- [ ] Events fire for key user actions
- [ ] Dashboard shows DAU, completion rate
- [ ] Errors appear in Sentry with context

---

## Epic 8: Beta Testing

**Goal:** Validate with real users and iterate

**Duration:** Weeks 6-9 (2-4 weeks)

### Phases

#### Phase 8a: Internal Testing (3-5 days)
- Team plays daily
- Fix critical bugs
- Verify analytics

#### Phase 8b: Friends & Family (1 week)
- 20-50 testers
- Collect qualitative feedback
- Focus: "Is this fun? Is it confusing?"

#### Phase 8c: Expanded Beta (2-3 weeks)
- 200-500 testers
- Recruit from word game communities
- Focus: retention, difficulty tuning

### Tasks

- [ ] Create beta signup page
- [ ] Implement feedback mechanism (in-app or form)
- [ ] Set up beta tester communication (Discord or email)
- [ ] Daily review of analytics
- [ ] Weekly difficulty adjustments
- [ ] Bug triage and fixes
- [ ] Document learnings

### Success Criteria

- [ ] D1 retention >40%
- [ ] Completion rate >50%
- [ ] No critical bugs
- [ ] Positive sentiment in feedback

---

## Epic 9: Launch Prep

**Goal:** Prepare for public launch

**Duration:** Week 10

### Tasks

- [ ] Final QA pass
- [ ] Performance audit (Lighthouse >90)
- [ ] Security review
- [ ] Set up monitoring dashboards
- [ ] Prepare launch content (tweets, posts)
- [ ] Write Product Hunt listing
- [ ] Create press kit
- [ ] Set up support email/channel
- [ ] Coordinate launch timing
- [ ] Deploy to production

### Launch Checklist

- [ ] All puzzles scheduled for 30+ days
- [ ] Analytics verified
- [ ] Error tracking verified
- [ ] Share cards work on all platforms
- [ ] Mobile experience smooth
- [ ] Load time <2s
- [ ] No known critical bugs

---

## Sprint Calendar

| Week | Dates | Focus | Epics |
|------|-------|-------|-------|
| 1 | TBD | Setup & Foundation | E1 |
| 2 | TBD | Core Grid & Keyboard | E2 |
| 3 | TBD | Game Mechanics & Completion | E2 |
| 4 | TBD | Stats & Sharing | E3, E4 |
| 5 | TBD | Polish, Admin, Analytics | E5, E6, E7 |
| 6-7 | TBD | Internal + F&F Beta | E8 |
| 8-9 | TBD | Expanded Beta | E8 |
| 10 | TBD | Launch Prep | E9 |
| 11 | TBD | Public Launch | - |

---

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Clue quality issues | Medium | High | Editorial review, beta feedback |
| Difficulty too hard/easy | Medium | Medium | Beta testing, adjustable crossers |
| Scope creep | High | Medium | Strict MVP definition |
| Low retention | Medium | High | Early beta, fast iteration |
| Technical debt | Medium | Low | Code review, testing |

---

## Definition of Done (Sprint Level)

A sprint is complete when:
- [ ] All P0 stories accepted
- [ ] No critical bugs
- [ ] Code reviewed and merged
- [ ] Deployed to staging
- [ ] Basic testing passed
- [ ] Documentation updated

---

## Definition of Done (Release Level)

MVP is complete when:
- [ ] All E1-E7 epics complete
- [ ] Beta metrics meet thresholds
- [ ] No known critical bugs
- [ ] 90+ days of content ready
- [ ] Analytics and monitoring active
- [ ] Launch checklist complete
