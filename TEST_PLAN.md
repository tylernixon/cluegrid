# Cluegrid - Test Plan

**Author:** River (QA Lead)
**Version:** 1.0
**Last Updated:** 2026-02-14
**Status:** Active

---

## 1. Test Strategy Overview

### 1.1 Objectives

- Ensure all core gameplay mechanics function correctly across devices and browsers
- Validate data integrity for game state persistence, stats, and sharing
- Confirm accessibility compliance (WCAG AA minimum)
- Verify puzzle content quality and solvability
- Establish confidence that the product is launch-ready with zero P0 bugs

### 1.2 Scope

**In Scope (MVP):**
- Daily puzzle loading and display
- Core gameplay: guessing, feedback, crosser reveals, win/loss states
- On-screen and physical keyboard input
- Stats tracking and persistence (streaks, win rate, distribution)
- Share card generation and clipboard/native sharing
- Dark mode and colorblind mode
- Screen reader and keyboard navigation
- Onboarding/tutorial flow
- Admin puzzle creation, preview, and scheduling
- API endpoints (puzzle fetch, guess verification)
- Cross-browser and cross-device testing
- Performance (Core Web Vitals)

**Out of Scope (Post-MVP):**
- Soft streak / grace days
- Archive access
- PWA install
- Multiplayer/versus mode
- Weekly recap
- Themes beyond dark/light

### 1.3 Test Environments

| Environment | URL | Purpose |
|-------------|-----|---------|
| Local | localhost:3000 | Developer smoke tests |
| Preview | *.vercel.app | PR-level regression |
| Staging | staging.cluegrid.app | Full test pass before release |
| Production | cluegrid.app | Smoke test after deploy |

### 1.4 Browser & Device Matrix

| Priority | Browser | Platform | Viewport |
|----------|---------|----------|----------|
| P0 | Safari 17+ | iOS 17+ (iPhone) | 375px, 390px, 428px |
| P0 | Chrome 120+ | Android (Pixel, Samsung) | 360px, 412px |
| P0 | Chrome 120+ | macOS/Windows Desktop | 1280px, 1440px |
| P1 | Safari 17+ | macOS Desktop | 1280px, 1440px |
| P1 | Firefox 120+ | Desktop | 1280px |
| P1 | Edge 120+ | Windows Desktop | 1280px |
| P2 | Samsung Internet | Android | 360px |

### 1.5 Test Types

| Type | Tools | Frequency |
|------|-------|-----------|
| Unit | Vitest + Testing Library | Every PR (CI) |
| Integration | Vitest + MSW (API mocks) | Every PR (CI) |
| E2E | Playwright | Nightly + pre-release |
| Manual Exploratory | Human | Each sprint + pre-release |
| Accessibility | axe-core + VoiceOver + TalkBack | Each sprint |
| Performance | Lighthouse CI | Every PR + pre-release |
| Content QA | Manual + automated checks | Per puzzle batch |
| Security | Manual review + headers check | Pre-launch |

---

## 2. P0 Test Cases (Must Pass for Launch)

These are blocking. Any P0 failure is a no-ship.

### 2.1 Puzzle Loading

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| P0-LOAD-01 | Daily puzzle loads on first visit | 1. Navigate to cluegrid.app 2. Observe page load | Grid, clues, keyboard, and guess counter all render within 2s. No console errors. |
| P0-LOAD-02 | Puzzle matches today's date | 1. Load puzzle 2. Verify puzzle date in response | Puzzle date matches user's local date |
| P0-LOAD-03 | No answer data exposed to client | 1. Open DevTools > Network 2. Inspect /api/puzzle response | Response contains clues, grid layout, and crosser metadata but NOT main_word or crosser word values |
| P0-LOAD-04 | 404 for missing puzzle date | 1. Navigate to a date with no puzzle | Friendly error message displayed, not a crash. API returns 404 with PUZZLE_NOT_FOUND |
| P0-LOAD-05 | Puzzle loads on slow connection | 1. Throttle to Slow 3G 2. Load puzzle | Loading state shown. Puzzle renders within 10s. No timeout crash. |

### 2.2 Core Gameplay - Guessing

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| P0-GUESS-01 | Type letters via on-screen keyboard | 1. Tap letters on keyboard | Letters appear in current guess row, one per cell, left to right |
| P0-GUESS-02 | Backspace removes last letter | 1. Type 3 letters 2. Tap backspace | Third letter removed. Cursor moves back one position. |
| P0-GUESS-03 | Submit valid guess for main word | 1. Type 5-letter valid word 2. Tap Enter | Guess submitted. Each cell shows correct/present/absent feedback with color + pattern. |
| P0-GUESS-04 | Submit valid guess for crosser | 1. Select a crosser 2. Type valid word matching crosser length 3. Submit | Feedback shown for crosser guess. If solved, intersection letter reveals in main word row. |
| P0-GUESS-05 | Reject invalid word | 1. Type a non-dictionary word 2. Submit | Error shake animation. Toast/message "Not in word list". Guess not consumed. |
| P0-GUESS-06 | Reject wrong-length guess | 1. Type fewer letters than target word 2. Submit | Submission blocked. Error feedback shown. Guess not consumed. |
| P0-GUESS-07 | Guess counter increments correctly | 1. Submit valid guess | Counter shows N/6. Increments by 1 per valid submitted guess. |
| P0-GUESS-08 | Maximum 6 guesses enforced | 1. Submit 6 incorrect guesses | After 6th guess, game ends with loss state. No further input accepted. |
| P0-GUESS-09 | Physical keyboard input works | 1. Use hardware keyboard to type letters and Enter/Backspace | Same behavior as on-screen keyboard |
| P0-GUESS-10 | Cannot guess after game is complete | 1. Win or lose game 2. Try typing | Keyboard is disabled or input is ignored |

### 2.3 Core Gameplay - Crosser Mechanics

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| P0-CROSS-01 | Select crosser by tapping grid | 1. Tap on a crosser cell in the grid | Selected word changes. Grid highlights the crosser cells. Input length adjusts. |
| P0-CROSS-02 | Select crosser by tapping clue | 1. Tap a clue in the clue panel | Same crosser selected as tapping its grid cells |
| P0-CROSS-03 | Solving crosser reveals intersection | 1. Correctly guess a crosser word | The letter where crosser intersects main word appears revealed in the main word row |
| P0-CROSS-04 | Revealed letters persist across guesses | 1. Solve crosser 2. Switch to main word | Revealed letter remains visible in main word row |
| P0-CROSS-05 | Multiple crosser reveals accumulate | 1. Solve crosser A 2. Solve crosser B | Both intersection letters visible in main word row |
| P0-CROSS-06 | Clues visible from game start | 1. Load puzzle | All crosser clues displayed in clue panel without requiring any action |

### 2.4 Feedback Accuracy

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| P0-FEED-01 | Green = correct letter, correct position | 1. Guess word with a letter matching answer at same position | That cell shows green/correct state |
| P0-FEED-02 | Yellow = correct letter, wrong position | 1. Guess word with a letter in the answer but at different position | That cell shows yellow/present state |
| P0-FEED-03 | Gray = letter not in word | 1. Guess word with a letter not in the answer | That cell shows gray/absent state |
| P0-FEED-04 | Duplicate letter handling | 1. Guess a word with duplicate letters where answer has one instance | Only one cell gets yellow/green; the extra gets gray |
| P0-FEED-05 | Keyboard colors update correctly | 1. Submit multiple guesses | Keyboard letters reflect best known state (green > yellow > gray). Never downgrade. |

### 2.5 Win / Loss States

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| P0-WIN-01 | Win by guessing main word directly | 1. Guess the correct main word | Win modal appears. Shows guess count, streak, share button. |
| P0-WIN-02 | Win by deduction after crosser reveals | 1. Solve crossers to reveal letters 2. Guess main word | Same win state as direct guess |
| P0-WIN-03 | Win on 6th guess | 1. Use 5 wrong guesses 2. Guess correctly on 6th | Win state, not loss. Guess count shows 6/6. |
| P0-WIN-04 | Loss after 6 wrong guesses | 1. Submit 6 incorrect guesses | Loss modal appears. Shows correct answer. Shows crossers solved count. Share button present. |
| P0-WIN-05 | Win message varies | 1. Win on different guess counts | Message varies (e.g., "Brilliant!" for 1-2, "Excellent!" for 3-4, "Nice!" for 5-6) |

### 2.6 Stats & Persistence

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| P0-STAT-01 | Game state persists on page refresh | 1. Make 2 guesses 2. Refresh browser | Same puzzle, same guesses, same feedback displayed. Can continue playing. |
| P0-STAT-02 | Stats update after win | 1. Win a game 2. Open stats modal | gamesPlayed increments. gamesWon increments. currentStreak increments. guessDistribution updates. |
| P0-STAT-03 | Stats update after loss | 1. Lose a game 2. Open stats modal | gamesPlayed increments. gamesWon unchanged. currentStreak resets to 0. |
| P0-STAT-04 | Streak calculation correct | 1. Win on consecutive days | currentStreak increments each day. Skipping a day resets streak. |
| P0-STAT-05 | Stats persist across sessions | 1. Play game 2. Close browser 3. Reopen next day | Previous stats intact. New puzzle available. |
| P0-STAT-06 | Stats modal accessible from header | 1. Tap stats icon/button in header | Stats modal opens showing all stats |
| P0-STAT-07 | Stats modal shown on game completion | 1. Complete a game (win or loss) | Completion modal includes stats or link to stats |
| P0-STAT-08 | Guess distribution chart renders | 1. Open stats after multiple games | Bar chart shows distribution across 1-6 guesses accurately |

### 2.7 Sharing

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| P0-SHARE-01 | Share button copies text to clipboard | 1. Complete game 2. Tap Share | Text copied to clipboard. Confirmation toast shown. |
| P0-SHARE-02 | Share text format correct | 1. Complete game 2. Copy share text 3. Paste elsewhere | Format: "CLUEGRID #N [emoji]\nX/6 guesses\n[emoji grid]\ncluegrid.app" |
| P0-SHARE-03 | Share pattern matches actual guesses | 1. Complete game with known guesses 2. Verify share text | Each row of emoji squares matches the feedback from each guess (green/yellow/gray) |
| P0-SHARE-04 | Share works on iOS Safari | 1. Complete game on iOS 2. Tap Share | Native share sheet opens OR clipboard copy succeeds |
| P0-SHARE-05 | Share works on Android Chrome | 1. Complete game on Android 2. Tap Share | Native share sheet opens OR clipboard copy succeeds |
| P0-SHARE-06 | Share does not reveal answer | 1. Examine share text | No letters or words from the answer appear in shared text |

### 2.8 Dark Mode

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| P0-DARK-01 | Dark mode follows system preference | 1. Set OS to dark mode 2. Load Cluegrid | App renders in dark mode |
| P0-DARK-02 | Dark mode toggle works | 1. Use settings toggle to switch theme | Theme changes immediately. Persists on reload. |
| P0-DARK-03 | All UI elements visible in dark mode | 1. Play full game in dark mode | Grid, keyboard, clues, modals, buttons all have proper contrast and visibility |

### 2.9 Accessibility

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| P0-A11Y-01 | Screen reader announces grid state | 1. Enable VoiceOver/TalkBack 2. Navigate grid | Each cell announces letter (if filled), position, and feedback status |
| P0-A11Y-02 | Screen reader announces clues | 1. Navigate to clue panel with SR | Clues are read aloud with crosser number |
| P0-A11Y-03 | Keyboard navigation through entire game | 1. Use only Tab/Shift+Tab/Enter/Escape | Can select words, type guesses, submit, open/close modals |
| P0-A11Y-04 | Colorblind mode distinguishes feedback | 1. Enable colorblind mode 2. Submit guesses | Feedback uses patterns/icons in addition to color |
| P0-A11Y-05 | Contrast ratios meet WCAG AA | 1. Run axe-core audit on both themes | All text meets 4.5:1 ratio. Large text meets 3:1. |
| P0-A11Y-06 | Focus indicators visible | 1. Tab through page | Every interactive element shows clear focus ring |

### 2.10 Onboarding

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| P0-ONBOARD-01 | First-time user sees tutorial | 1. Clear localStorage 2. Load app | "How to Play" modal/tutorial appears automatically |
| P0-ONBOARD-02 | Tutorial explains core mechanics | 1. Read tutorial | Explains: crosser clues, guessing, feedback colors, win condition |
| P0-ONBOARD-03 | Tutorial does not re-show | 1. Dismiss tutorial 2. Refresh | Tutorial does not appear again |
| P0-ONBOARD-04 | Tutorial accessible from menu | 1. Tap help/info icon in header | Tutorial modal opens on demand |

### 2.11 Mobile Responsiveness

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| P0-MOBILE-01 | No horizontal scroll on mobile | 1. Load on 320px viewport | All content fits within viewport width |
| P0-MOBILE-02 | Grid fits mobile screen | 1. Load on iPhone SE (375px) | Grid, clues, keyboard all visible without excessive scrolling |
| P0-MOBILE-03 | Tap targets are at least 44x44px | 1. Inspect keyboard and grid cells | All interactive elements meet minimum tap target size |
| P0-MOBILE-04 | Landscape orientation works | 1. Rotate phone to landscape | Layout adjusts. Game is playable. |

### 2.12 API Security

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| P0-SEC-01 | Puzzle endpoint does not expose answers | 1. GET /api/puzzle/[date] 2. Inspect response body | No main_word or crosser word fields in response |
| P0-SEC-02 | Verify endpoint validates input | 1. POST /api/verify with malformed data | Returns 400 with descriptive error. No server crash. |
| P0-SEC-03 | Rate limiting enforced | 1. Send 100 requests in quick succession | Returns 429 after threshold. Game still works after cooldown. |
| P0-SEC-04 | Invalid puzzle ID rejected | 1. POST /api/verify with fake puzzleId | Returns appropriate error. No data leak. |
| P0-SEC-05 | Security headers present | 1. Inspect response headers | CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy all set |

---

## 3. P1 Test Cases (Should Pass)

Non-blocking for launch but tracked. Fix before or immediately after public launch.

### 3.1 Enhanced Input

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| P1-INPUT-01 | Physical keyboard: letters only accepted | 1. Press number keys, symbols | No input registered for non-alpha keys |
| P1-INPUT-02 | Rapid typing handled | 1. Type very quickly | All letters register in order. No dropped input. |
| P1-INPUT-03 | Paste into guess blocked | 1. Try Ctrl+V into guess area | Paste is ignored (prevents cheating with external tools) |

### 3.2 Animation & Polish

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| P1-ANIM-01 | Letter flip animation on feedback | 1. Submit guess | Cells flip sequentially with 150ms stagger revealing feedback |
| P1-ANIM-02 | Error shake on invalid guess | 1. Submit invalid word | Row shakes horizontally for ~200ms |
| P1-ANIM-03 | Win celebration animation | 1. Solve puzzle | Subtle confetti or glow animation. Not overwhelming. |
| P1-ANIM-04 | Reduced motion respected | 1. Enable prefers-reduced-motion 2. Play game | No flip, shake, or celebration animations. Feedback shown instantly. |

### 3.3 Edge Cases

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| P1-EDGE-01 | Refresh mid-guess | 1. Type partial guess 2. Refresh | Current partial guess cleared. Previous submitted guesses preserved. |
| P1-EDGE-02 | Multiple tabs same puzzle | 1. Open puzzle in two tabs 2. Play in tab A | Tab B reflects correct state on next interaction or refresh |
| P1-EDGE-03 | Timezone boundary: puzzle rollover | 1. Play at 11:59 PM 2. Wait until 12:01 AM | New puzzle available. Previous game state for yesterday preserved. |
| P1-EDGE-04 | localStorage full | 1. Fill localStorage near quota 2. Try to play | Graceful fallback. Game is playable. Warning if stats cannot save. |
| P1-EDGE-05 | Corrupted localStorage | 1. Manually corrupt cluegrid:game value 2. Load app | App recovers gracefully. Resets corrupted data. Does not crash. |
| P1-EDGE-06 | Offline after initial load | 1. Load puzzle 2. Go offline 3. Continue playing | Guesses may fail to verify. Clear error message. Retry when online. |
| P1-EDGE-07 | Back/forward navigation | 1. Navigate to stats 2. Press browser back | Returns to puzzle with state intact |

### 3.4 Performance

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| P1-PERF-01 | Lighthouse score >= 90 | 1. Run Lighthouse on production | Performance, Accessibility, Best Practices, SEO all >= 90 |
| P1-PERF-02 | LCP < 1.5s | 1. Measure Largest Contentful Paint | Grid renders within 1.5s on 4G connection |
| P1-PERF-03 | CLS < 0.1 | 1. Measure Cumulative Layout Shift | No visible layout jumps during load |
| P1-PERF-04 | JS bundle < 100KB gzipped | 1. Check build output | Total JS bundle under 100KB gzipped |
| P1-PERF-05 | Input latency < 100ms | 1. Tap keyboard key 2. Measure time to letter appearing | Letter appears in cell within 100ms |

### 3.5 Content Quality

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| P1-CONTENT-01 | All 90 launch puzzles solvable | 1. Playtest each puzzle | Every puzzle has a valid solution path |
| P1-CONTENT-02 | Clues are unambiguous | 1. Review each clue | Each clue points clearly to one answer |
| P1-CONTENT-03 | No offensive words in puzzle pool | 1. Run profanity filter on all puzzle words | Zero flagged words |
| P1-CONTENT-04 | Difficulty feels fair | 1. Beta testers rate difficulty | 70-80% win rate across testers |
| P1-CONTENT-05 | Grid layouts render correctly | 1. Preview each puzzle | All crossers intersect main word correctly. No overlapping cells. |

### 3.6 Admin

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| P1-ADMIN-01 | Admin requires authentication | 1. Navigate to /admin unauthenticated | Prompted for credentials. Cannot access without valid login. |
| P1-ADMIN-02 | Create puzzle end-to-end | 1. Log in to admin 2. Create puzzle with main word + crossers + clues 3. Schedule | Puzzle appears in calendar. Playable on scheduled date. |
| P1-ADMIN-03 | Preview matches player experience | 1. Preview a puzzle in admin 2. Compare to actual game | Layout, clues, and grid identical |
| P1-ADMIN-04 | Calendar shows coverage | 1. View puzzle calendar | Scheduled dates show green. Empty dates visible. Gaps highlighted. |
| P1-ADMIN-05 | Word validation on create | 1. Try to create puzzle with invalid word | Blocked with error message |

### 3.7 Analytics & Monitoring

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| P1-ANALYTICS-01 | Page view event fires | 1. Load page 2. Check PostHog | Event captured with correct properties |
| P1-ANALYTICS-02 | Game start event fires | 1. Make first guess 2. Check PostHog | game_started event logged |
| P1-ANALYTICS-03 | Game complete event fires | 1. Complete game 2. Check PostHog | game_completed event with win/loss, guess count |
| P1-ANALYTICS-04 | Share event fires | 1. Tap share 2. Check PostHog | share_clicked event logged |
| P1-ANALYTICS-05 | Sentry captures errors | 1. Trigger a JS error 2. Check Sentry | Error appears with stack trace and context |

---

## 4. Bug Severity Definitions

| Severity | Label | Definition | Response Time | Resolution Time |
|----------|-------|------------|---------------|-----------------|
| **P0 - Critical** | Blocker | Game is unplayable. Data loss. Security vulnerability. Answer exposed to client. Crash on supported browser. | Immediate | Before next deploy |
| **P1 - High** | Major | Core feature broken for subset of users. Stats not saving. Share produces wrong output. Accessibility failure. | < 4 hours | Within 24 hours |
| **P2 - Medium** | Moderate | Non-core feature broken. Visual glitch. Animation issue. Admin tool bug. Minor UX issue. | < 24 hours | Within 1 sprint |
| **P3 - Low** | Minor | Cosmetic issue. Copy typo. Minor alignment. Edge case with workaround. | Backlog | Best effort |

### Severity Examples

**P0 Examples:**
- Main word or crosser answers visible in network response
- Submitting a guess crashes the app
- Game state lost on refresh (guesses disappear)
- Feedback colors wrong (green shown for absent letter)
- Cannot complete a puzzle due to logic error
- XSS or injection vulnerability in any input

**P1 Examples:**
- Streak count incorrect after winning
- Share text has wrong emoji pattern
- Colorblind mode not distinguishable
- Screen reader cannot navigate grid
- Dark mode text unreadable on some component
- Physical keyboard not working on Firefox

**P2 Examples:**
- Flip animation stutters on older phones
- Admin calendar shows wrong month on first load
- Toast notification stays too long
- Keyboard layout shifts slightly on guess submit

**P3 Examples:**
- 1px alignment difference between themes
- "Brilliant!" copy shows on 5-guess win (should be "Nice!")
- Footer link underline inconsistent

---

## 5. Release Checklist

This checklist must be completed and signed off before any production deploy.

### 5.1 Pre-Release (Staging)

- [ ] All P0 test cases passing on staging
- [ ] No open P0 or P1 bugs
- [ ] Lighthouse scores >= 90 on all four categories
- [ ] axe-core accessibility scan: 0 critical violations
- [ ] Security headers verified (CSP, X-Frame-Options, etc.)
- [ ] API rate limiting confirmed functional
- [ ] Puzzle endpoint verified: no answer data in response
- [ ] Today's puzzle loads correctly on staging
- [ ] Dark mode and colorblind mode manually verified
- [ ] Share card manually tested on iOS Safari + Android Chrome
- [ ] Stats persistence verified across refresh and close/reopen
- [ ] Onboarding flow works for new user (cleared localStorage)
- [ ] Build passes CI (lint, test, type-check, build)
- [ ] No new Sentry errors in staging for 24 hours
- [ ] Manual smoke test on top 3 browsers (iOS Safari, Android Chrome, Desktop Chrome)

### 5.2 Launch-Specific (One-Time)

- [ ] 90+ days of puzzles scheduled and verified
- [ ] All scheduled puzzles pass pre-publish checks (valid words, clues present, grid valid)
- [ ] Dictionary seeded with 10K+ guess words and 3K+ answer words
- [ ] PostHog dashboards configured (DAU, completion rate, share rate)
- [ ] Sentry alerting configured and tested
- [ ] Domain (cluegrid.app) DNS configured and SSL verified
- [ ] Admin credentials set in production environment
- [ ] Environment variables set in Vercel production
- [ ] README and internal docs up to date
- [ ] Beta feedback triaged: all critical items addressed

### 5.3 Post-Deploy (Production)

- [ ] Smoke test on production: load puzzle, make a guess, verify feedback
- [ ] Verify analytics events appearing in PostHog
- [ ] Verify no new Sentry errors within first 30 minutes
- [ ] Verify share card copies correctly on production URL
- [ ] Monitor error rate for first 2 hours
- [ ] Confirm daily puzzle rollover works at midnight (check next morning)

---

## 6. Quality Gate Criteria

### 6.1 Sprint Quality Gate

Each sprint must meet these criteria before merging to main:

| Gate | Criteria | Measured By |
|------|----------|-------------|
| Build | CI pipeline passes (lint, test, type-check, build) | GitHub Actions |
| Unit Tests | >= 80% line coverage on new code | Vitest coverage report |
| No P0 Bugs | Zero open P0 bugs | Bug tracker |
| Accessibility | axe-core scan: 0 critical/serious violations | CI or manual |
| Performance | Lighthouse Performance >= 85 | Lighthouse CI |

### 6.2 Beta Entry Gate

Before inviting external beta testers:

| Gate | Criteria |
|------|----------|
| Functional | All P0 test cases in sections 2.1-2.7 passing |
| Content | >= 30 days of puzzles scheduled and playtested |
| Stability | < 1% JS error rate in staging for 48 hours |
| Analytics | Key events firing correctly in PostHog |
| Feedback | In-app feedback mechanism functional |

### 6.3 Launch Gate (Go / No-Go)

**GO criteria (all must be true):**

| # | Criteria | Owner |
|---|----------|-------|
| 1 | All P0 test cases passing | QA Lead |
| 2 | Zero open P0 bugs, zero open P1 bugs | QA Lead |
| 3 | 90+ days content scheduled | Content Lead |
| 4 | Beta D1 retention >= 40% | PM |
| 5 | Beta completion rate >= 50% | PM |
| 6 | Beta win rate between 60-85% | PM + Content |
| 7 | Lighthouse all categories >= 90 | Engineering |
| 8 | Security headers and rate limiting verified | Engineering |
| 9 | Monitoring and alerting operational | Engineering |
| 10 | Release checklist (Section 5) complete | QA Lead |

**NO-GO triggers (any one blocks launch):**

- Any open P0 bug
- Answer data exposed in any API response
- D1 retention < 30% in beta
- Completion rate < 40% in beta
- Lighthouse Performance < 80
- No error tracking in production

### 6.4 Hotfix Gate

For emergency production fixes:

| Gate | Criteria |
|------|----------|
| Scope | Fix addresses only the specific bug. No feature changes. |
| Testing | P0 regression tests pass on staging |
| Review | Code reviewed by at least 1 engineer |
| Smoke | Post-deploy smoke test on production within 15 minutes |
| Monitoring | Error rate returns to baseline within 1 hour |

---

## 7. Bug Tracking Process

### 7.1 Bug Report Template

```
**Title:** [Brief description]
**Severity:** P0 / P1 / P2 / P3
**Environment:** [Browser, OS, device, viewport]
**URL:** [staging/production URL]

**Steps to Reproduce:**
1.
2.
3.

**Expected Result:**
[What should happen]

**Actual Result:**
[What actually happens]

**Screenshots/Video:**
[Attach evidence]

**Console Errors:**
[Paste any JS errors]

**Additional Context:**
[localStorage state, network requests, etc.]
```

### 7.2 Bug Lifecycle

```
New → Triaged → Assigned → In Progress → In Review → Verified → Closed
                                              ↓
                                          Reopened (if fix fails verification)
```

### 7.3 Triage Process

- **Daily:** QA Lead triages all new bugs within 24 hours
- **P0 bugs:** Triaged immediately. Engineering notified within 1 hour.
- **Duplicates:** Linked to original. Closed as duplicate.
- **Not a bug:** Closed with explanation.
- **By design:** Closed with reference to PDD decision.

---

## 8. Test Data Requirements

### 8.1 Test Puzzles

Maintain a set of known test puzzles in staging for repeatable testing:

| Puzzle | Main Word | Crossers | Purpose |
|--------|-----------|----------|---------|
| test-easy | CRANE | 3 common crossers | Happy path testing |
| test-hard | GLYPH | 2 uncommon crossers | Difficulty edge case |
| test-maxcrossers | BEACH | 4 crossers | Maximum crosser layout |
| test-mincrossers | PLANT | 2 crossers | Minimum crosser layout |

### 8.2 Test Accounts

| Account | Purpose |
|---------|---------|
| Fresh user (cleared localStorage) | Onboarding, first-time experience |
| User with 30-day streak | Streak display, stats accuracy |
| User with 0 wins | Empty stats edge case |
| User with maxed stats | Large number rendering |

---

## 9. Automated Test Coverage Targets

### 9.1 Unit Tests

| Area | Target Coverage | Priority |
|------|-----------------|----------|
| Game logic (useGame hook) | >= 95% | P0 |
| Feedback calculation | 100% | P0 |
| Streak calculation | 100% | P0 |
| Share text generation | 100% | P0 |
| Keyboard state derivation | >= 90% | P0 |
| Date/timezone utilities | >= 90% | P0 |
| localStorage wrapper | >= 80% | P1 |
| Grid layout calculation | >= 90% | P1 |
| Input validation (Zod schemas) | 100% | P0 |

### 9.2 Integration Tests

| Area | Scenarios | Priority |
|------|-----------|----------|
| Puzzle fetch + render | Load puzzle, verify grid structure | P0 |
| Guess submission + feedback | Submit guess, verify correct feedback | P0 |
| Crosser solve + reveal | Solve crosser, verify letter reveals | P0 |
| Win flow | Correct guess -> win modal -> stats update | P0 |
| Loss flow | 6 wrong guesses -> loss modal -> stats update | P0 |
| Persistence | Play, refresh, verify state restored | P0 |

### 9.3 E2E Tests (Playwright)

| Flow | Steps | Priority |
|------|-------|----------|
| Full win game | Load -> guess crossers -> guess main word -> share | P0 |
| Full loss game | Load -> 6 wrong guesses -> loss screen -> stats | P0 |
| New user onboarding | Clear state -> load -> see tutorial -> dismiss -> play | P0 |
| Stats persistence | Play game -> close -> reopen -> verify stats | P1 |
| Dark mode toggle | Load -> toggle dark mode -> verify styles -> refresh -> verify persistence | P1 |

---

## 10. Schedule

| Phase | Timing | Focus |
|-------|--------|-------|
| Sprint 2-3 (Core Gameplay) | Weeks 2-3 | Write unit tests for game logic. Manual testing of grid/keyboard. |
| Sprint 4 (Stats/Sharing) | Week 4 | Unit tests for stats/sharing. Integration tests for persistence. |
| Sprint 5 (Polish) | Week 5 | Accessibility audit. Performance audit. E2E test suite. |
| Internal Beta | Weeks 6-7 | Full P0 test pass. Exploratory testing. Bug triage. |
| Expanded Beta | Weeks 8-9 | Content QA. Cross-browser matrix. Performance monitoring. |
| Launch Prep | Week 10 | Final P0 pass. Release checklist. Go/no-go decision. |

---

*This document is a living artifact. It will be updated as features are built, bugs are found, and beta feedback is incorporated.*
