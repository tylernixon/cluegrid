# Cluegrid - Product Design Document

## 1. Executive Summary

Cluegrid is a daily word puzzle game that combines Wordle-style deduction with crossword clue satisfaction. Built as a web-first React/Next.js application, it targets daily puzzle enthusiasts seeking a premium, ad-free experience that respects their time and intelligence.

**Core Value Proposition:** A 3-5 minute daily ritual that feels smart, calm, and satisfying.

---

## 2. Product Overview

### 2.1 What is Cluegrid?

A daily word game where players guess a 5-letter main word with the help of intersecting "crosser" words. Unlike pure Wordle, clues are provided for crossing words, giving players multiple angles of attack.

### 2.2 Core Loop

```
1. Open app → See today's puzzle
2. Read clues for crossing words
3. Guess crossing words OR main word
4. Revealed letters help solve remaining words
5. Complete puzzle → View stats → Share result
6. Return tomorrow
```

### 2.3 Key Differentiators

| Feature | Wordle | Crosswords | Cluegrid |
|---------|--------|------------|----------|
| Daily ritual | ✓ | ✓ | ✓ |
| Clue-based | ✗ | ✓ | ✓ |
| Deduction feedback | ✓ | ✗ | ✓ |
| Mobile-optimized | ✓ | ✗ | ✓ |
| Session length | 2-5 min | 10-30 min | 3-6 min |
| Complexity | Low | High | Medium |

---

## 3. Gameplay Mechanics

### 3.1 Grid Structure

```
    ┌───┬───┬───┬───┬───┐
    │   │ C │   │   │   │  ← Crosser 1 (vertical)
    ├───┼───┼───┼───┼───┤
    │ M │ A │ I │ N │ W │  ← MAIN WORD (horizontal)
    ├───┼───┼───┼───┼───┤
    │   │ R │   │   │   │  ← Crosser continues
    ├───┼───┼───┼───┼───┤
    │   │ D │   │   │   │
    └───┴───┴───┴───┴───┘
```

**MVP Grid Size:** 5-letter main word with 2-4 crossing words (3-5 letters each)

### 3.2 Guess Mechanics

- **Total guesses:** 6 maximum across all words
- **Feedback:** Wordle-style (green = correct position, yellow = present, gray = absent)
- **Cross-reveal:** Solving a crosser reveals its intersection with the main word
- **Smart keyboard:** Shows letter states across all guessing

### 3.3 Clue System

Each crossing word has an associated clue:

```
ACROSS (Main Word): No clue given - deduce from crossers
DOWN 1: "Playing cards for one person" → SOLITAIRE (intersects at 'O')
DOWN 2: "Capital of France" → PARIS (intersects at 'A')
```

**Clue Unlock Rules:**
- Crosser clues visible from start
- Main word has NO direct clue (deduction only)
- Optional: Progressive clue reveal based on guess count

### 3.4 Win/Loss Conditions

**Win:** Main word solved within 6 total guesses
**Loss:** 6 guesses exhausted without solving main word

**Partial Credit:** Crossing words solved count toward stats even on loss

---

## 4. User Experience Design

### 4.1 Information Architecture

```
HOME
├── Today's Puzzle
│   ├── Grid View
│   ├── Clue Panel
│   ├── Keyboard
│   └── Guess History
├── Stats
│   ├── Streaks
│   ├── Win Rate
│   ├── Guess Distribution
│   └── Words Solved
├── Archive (Future)
├── Settings
│   ├── Theme
│   ├── Accessibility
│   └── Notifications
└── How to Play
```

### 4.2 Core Screens

#### 4.2.1 Puzzle Screen (Primary)

**Layout (Mobile-First):**
```
┌─────────────────────────┐
│      CLUEGRID           │  Header (minimal)
├─────────────────────────┤
│                         │
│      [GRID VIEW]        │  Interactive grid
│                         │
├─────────────────────────┤
│  CLUES                  │  Collapsible clue panel
│  1. Playing cards...    │
│  2. Capital of...       │
├─────────────────────────┤
│  Guesses: ■■■□□□        │  Progress indicator
├─────────────────────────┤
│  [QWERTYUIOP]          │
│  [ASDFGHJKL]           │  Keyboard
│  [⏎ ZXCVBNM ⌫]         │
└─────────────────────────┘
```

#### 4.2.2 Completion Screen

**Win State:**
```
┌─────────────────────────┐
│         🎯              │
│    BRILLIANT!           │
│                         │
│   Solved in 4 guesses   │
│   Streak: 12 days 🔥    │
│                         │
│  [SHARE]  [VIEW STATS]  │
└─────────────────────────┘
```

**Loss State:**
```
┌─────────────────────────┐
│         📚              │
│    SO CLOSE!            │
│                         │
│   The word was: CRANE   │
│   You got 2/3 crossers  │
│                         │
│  [SHARE]  [VIEW STATS]  │
└─────────────────────────┘
```

#### 4.2.3 Share Card

```
CLUEGRID #47 🧩
4/6 guesses

🟨⬜⬜⬜⬜
🟩🟩⬜⬜⬜
🟩🟩🟩⬜⬜
🟩🟩🟩🟩🟩

cluegrid.app
```

### 4.3 Interaction Patterns

| Action | Gesture/Input |
|--------|---------------|
| Type letter | Tap keyboard |
| Submit guess | Enter/tap submit |
| Delete letter | Backspace/tap delete |
| Switch target word | Tap word in grid |
| View clue | Tap clue number |
| Share | Tap share button |

### 4.4 Accessibility Requirements

- **Contrast:** WCAG AA minimum (4.5:1 for text)
- **Color independence:** Patterns/icons supplement color coding
- **Screen reader:** Full ARIA labels for grid, keyboard, clues
- **Keyboard nav:** Tab order, focus indicators
- **Reduced motion:** Respect prefers-reduced-motion
- **Font scaling:** Support up to 200% text size

---

## 5. Visual Design Direction

### 5.1 Design Principles

1. **Calm over flashy** - Muted tones, subtle animations
2. **Premium minimalism** - Generous whitespace, refined typography
3. **Touch-first** - Large tap targets, clear feedback
4. **Dark mode native** - Not an afterthought

### 5.2 Color System

**Light Mode:**
```
Background:    #FAFAFA (warm white)
Surface:       #FFFFFF
Text Primary:  #1A1A1A
Text Secondary:#666666
Correct:       #6AAA64 (green)
Present:       #C9B458 (gold)
Absent:        #787C7E (gray)
Accent:        #4A90D9 (blue)
```

**Dark Mode:**
```
Background:    #121213
Surface:       #1E1E1F
Text Primary:  #FFFFFF
Text Secondary:#A0A0A0
Correct:       #538D4E
Present:       #B59F3B
Absent:        #3A3A3C
Accent:        #5BA4E8
```

### 5.3 Typography

```
Primary Font: Inter (system fallback: -apple-system)
Grid Letters: Inter Bold, 24px
Clues: Inter Regular, 16px
Stats Numbers: Inter Semibold, 32px
```

### 5.4 Motion Design

- **Letter entry:** Scale 1.0 → 1.05 → 1.0 (100ms)
- **Reveal animation:** Flip cards sequentially (150ms stagger)
- **Win celebration:** Subtle confetti or glow (500ms)
- **Error shake:** Horizontal shake (200ms)

---

## 6. Feature Specifications

### 6.1 MVP Features (P0)

| Feature | Description | Acceptance Criteria |
|---------|-------------|---------------------|
| Daily puzzle | New puzzle at midnight local | Puzzle loads <500ms, consistent daily |
| Grid gameplay | Guess words, receive feedback | All mechanics work per spec |
| Clue display | Show clues for crossers | Clues visible, tappable |
| Keyboard | On-screen with state colors | Letter states accurate |
| Stats | Streak, wins, distribution | Persists across sessions |
| Share card | Copy-able text result | Works on iOS, Android, desktop |
| Onboarding | First-time tutorial | <30s to understand game |
| Mobile responsive | Works 320px-428px | No horizontal scroll |

### 6.2 Post-MVP Features (P1)

| Feature | Description | Priority |
|---------|-------------|----------|
| Soft streak | Grace day for missed puzzle | High |
| Weekly recap | Summary of week's performance | Medium |
| Archive access | Play past puzzles | Medium |
| Themes | Cosmetic color themes | Low |
| PWA install | Add to home screen prompt | High |

### 6.3 Future Features (P2)

- Multiplayer/versus mode
- Sunday "long" puzzle
- Themed weeks
- Community puzzle creation
- Achievement system

---

## 7. Content Requirements

### 7.1 Puzzle Content

**MVP Launch Content:**
- 90 daily puzzles (3 months runway)
- Each puzzle: 1 main word + 2-4 crossers + clues
- All words from curated 5000-word list
- No obscure proper nouns, slurs, or overly niche terms

**Clue Quality Standards:**
- Clear and unambiguous
- Appropriate difficulty (not too easy, not trivia)
- No cultural/regional bias
- Reviewed by at least 2 people

### 7.2 UI Copy

| Element | Copy |
|---------|------|
| Win message | "Brilliant!", "Excellent!", "Nice!" |
| Loss message | "So close! The word was [WORD]" |
| Streak message | "Day [N] 🔥" |
| Share CTA | "Share your result" |
| Tutorial headline | "Guess the main word using clues" |

---

## 8. Success Metrics

### 8.1 Primary KPIs

| Metric | Target | Measurement |
|--------|--------|-------------|
| D1 Retention | 45%+ | Return within 24-48hrs |
| D7 Retention | 25%+ | Return within 7 days |
| D30 Retention | 15%+ | Return within 30 days |
| Completion Rate | 60%+ | Puzzles finished / started |
| Share Rate | 15%+ | Shares / completions |

### 8.2 Secondary KPIs

| Metric | Target |
|--------|--------|
| Session length | 3-6 minutes median |
| Weekly streak rate | 40%+ maintain 7+ days |
| Win rate | 70-80% (indicates good difficulty) |

### 8.3 Health Metrics

| Metric | Concern Threshold |
|--------|-------------------|
| Bounce rate | >50% leave before first guess |
| Error rate | >2% JS errors per session |
| Load time | >2s time to interactive |

---

## 9. Launch Plan

### 9.1 Soft Launch (Beta)

- 200-500 invited testers
- 2-4 weeks duration
- Focus: difficulty tuning, UX friction, bug fixes
- Channels: Personal network, word game communities

### 9.2 Public Launch

- Announce on Product Hunt, Hacker News
- Seed in r/wordle, r/crossword, word game Discords
- Press outreach to indie game bloggers
- Target: 5,000 DAU in first month

---

## 10. Open Questions

1. **Difficulty calibration:** How many crossers per puzzle?
2. **Clue timing:** All clues visible or progressive reveal?
3. **Partial guessing:** Can players guess individual crosser letters?
4. **Timezone handling:** UTC midnight or local midnight?
5. **Streak forgiveness:** How many grace days?

---

## Appendix A: Competitive Analysis

| App | Strengths | Weaknesses |
|-----|-----------|------------|
| Wordle | Simple, viral, free | Limited, no clues |
| NYT Mini | Quick, quality | Paywall, app-heavy |
| Connections | Novel, satisfying | No word building |
| Crossword apps | Deep content | Complex, cluttered |

## Appendix B: User Personas

**Persona 1: Morning Ritualist**
- Age 28-45
- Plays Wordle daily over coffee
- Values: consistency, calm, quick wins
- Pain: Wants more depth without more time

**Persona 2: Word Nerd**
- Age 35-60
- Does NYT crossword weekly
- Values: clever clues, vocabulary
- Pain: Mobile crosswords are frustrating

**Persona 3: Casual Gamer**
- Age 22-35
- Plays phone games during commute
- Values: no ads, no grind, satisfaction
- Pain: Most word games feel cheap
