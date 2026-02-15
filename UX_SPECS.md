# Cluegrid - UX Specifications

## 1. User Flow Diagrams

### 1.1 First-Time User Flow

```
[Launch App]
     |
     v
[Check localStorage for onboarding flag]
     |
     +-- No flag found (first visit) ---------> [Onboarding Tutorial]
     |                                                |
     |                                                v
     |                                          [Step 1: Welcome]
     |                                          "Guess the main word
     |                                           using crossing clues"
     |                                                |
     |                                                v
     |                                          [Step 2: Grid Explained]
     |                                          Interactive highlight of
     |                                          main word row + crossers
     |                                                |
     |                                                v
     |                                          [Step 3: Clues & Guessing]
     |                                          "Tap a clue to target that
     |                                           word, then type your guess"
     |                                                |
     |                                                v
     |                                          [Step 4: Feedback]
     |                                          Show color coding example
     |                                          (green/yellow/gray)
     |                                                |
     |                                                v
     |                                          [Step 5: Cross-Reveal]
     |                                          "Solve a crosser to reveal
     |                                           its letter in the main word"
     |                                                |
     |                                                v
     |                                          [Set onboarding flag]
     |                                                |
     +-- Flag found (returning user) ----+            |
     |                                   |            |
     +-----------------------------------+<-----------+
     |
     v
[Load Today's Puzzle] (see 1.2)
```

**Key Design Decisions:**
- Onboarding is max 5 steps. Each step fits one screen. No scrolling within steps.
- Each step has a single "Next" button. Final step has "Let's Play".
- A "Skip" link is always visible in the top-right for impatient users.
- Total onboarding duration target: under 30 seconds.

### 1.2 Core Gameplay Flow

```
[Load Today's Puzzle]
     |
     v
[Fetch GET /api/puzzle/today]
     |
     +-- Success ---------------------> [Render Puzzle Screen]
     |                                       |
     +-- Network error ---> [Offline State]  |
     |                      "Check your      |
     |                       connection"     |
     +-- No puzzle -------> [No Puzzle]      |
                            "No puzzle       |
                             today.          |
                             Come back       |
                             tomorrow!"      |
                                             |
     +---------------------------------------+
     |
     v
[Check localStorage for saved game state]
     |
     +-- Saved state for today's puzzle ---> [Restore game state]
     |                                            |
     +-- No saved state / different date ----+    |
     |                                       |    |
     +---------------------------------------+<---+
     |
     v
[PUZZLE SCREEN: Playing State]
     |
     +--------> [Player selects target word]
     |               |
     |               +-- Tap crosser clue in panel
     |               +-- Tap word cells in grid
     |               +-- Default: first unsolved crosser
     |               |
     |               v
     |          [Target word highlighted in grid]
     |          [Matching clue highlighted in panel]
     |               |
     +--------> [Player types letters]
     |               |
     |               +-- On-screen keyboard tap
     |               +-- Physical keyboard input
     |               |
     |               v
     |          [Letters appear in current guess area]
     |          [Backspace removes last letter]
     |               |
     +--------> [Player submits guess (Enter)]
                     |
                     v
                [Validate guess length]
                     |
                     +-- Too short -------> [Shake animation]
                     |                      [Toast: "Not enough
                     |                       letters"]
                     |
                     v
                [POST /api/verify]
                     |
                     +-- Invalid word ----> [Shake animation]
                     |                      [Toast: "Not in word
                     |                       list"]
                     |
                     +-- Valid guess ------> [Reveal feedback]
                          |                  [Flip animation,
                          |                   sequential L-to-R]
                          |
                          v
                     [Update keyboard colors]
                     [Save game state to localStorage]
                          |
                          +-- Crosser solved -----> [Cross-reveal]
                          |                         [Animate letter
                          |                          appearing in
                          |                          main word row]
                          |                              |
                          |                              v
                          |                         [Auto-select next
                          |                          unsolved word]
                          |
                          +-- Main word solved ---> [WIN STATE] (see 1.3)
                          |
                          +-- 6 guesses used -----> [LOSS STATE] (see 1.3)
                          |
                          +-- Guess remaining ----> [Return to Playing]
                               (loop back up)
```

### 1.3 Completion Flow

```
[Game Complete (Win or Loss)]
     |
     v
[Update UserStats in localStorage]
[Update GameHistory in localStorage]
     |
     v
[Show Completion Modal]
     |
     +-- WIN ----------------------------+
     |   - Celebration animation         |
     |   - "Brilliant!" / "Nice!" copy   |
     |   - "Solved in N guesses"         |
     |   - Streak count with fire icon   |
     |                                   |
     +-- LOSS --------------------------+
     |   - Gentle tone, no shame         |
     |   - "So close!"                   |
     |   - "The word was: [WORD]"        |
     |   - "You got N/M crossers"        |
     |                                   |
     +-----------------------------------+
     |
     v
[Completion Modal Actions]
     |
     +-- [SHARE] ---------> [Generate share text]
     |                           |
     |                           +-- Mobile -----> [Native Share Sheet]
     |                           |                 (Web Share API)
     |                           |
     |                           +-- Desktop ---> [Copy to Clipboard]
     |                                            [Toast: "Copied!"]
     |
     +-- [VIEW STATS] ----> [Stats Modal] (see 1.4)
     |
     +-- [Close / Tap outside] --> [Return to completed puzzle]
                                    [Grid shows solved state]
                                    [Share button persists in header]
```

### 1.4 Stats Flow

```
[Stats Modal Opened]
     |
     +-- From completion modal "View Stats" button
     +-- From header stats icon (bar chart icon)
     |
     v
[Stats Modal Layout]
     |
     +-- Played: total games
     +-- Win %: percentage
     +-- Current Streak: N days
     +-- Max Streak: N days
     +-- Guess Distribution: horizontal bar chart (1-6)
     +-- Next Puzzle: countdown timer (HH:MM:SS)
     |
     v
[Actions]
     |
     +-- [SHARE] (if today's puzzle complete) --> Share flow
     +-- [Close] / tap outside --> Dismiss modal
```

### 1.5 Settings Flow

```
[Settings Opened]
     |
     +-- From header gear icon
     |
     v
[Settings Screen / Modal]
     |
     +-- Theme: [Light] [Dark] [System] toggle
     +-- Color Blind Mode: toggle switch
     +-- Reduced Motion: toggle switch
     +-- How to Play: link --> Onboarding replay
     +-- Feedback: mailto link or external form
     +-- About / Credits
     |
     v
[All changes apply immediately, saved to localStorage]
[Close] --> Return to puzzle
```

---

## 2. Screen Inventory

### 2.1 Screen List

| # | Screen | Type | Purpose | Entry Points |
|---|--------|------|---------|--------------|
| 1 | Puzzle Screen | Page (primary) | Core gameplay -- grid, clues, keyboard | App launch, daily return |
| 2 | Onboarding Tutorial | Full-screen overlay | Teach first-time users how to play | First visit only |
| 3 | Completion Modal | Modal overlay | Celebrate win or show loss, prompt share | Game ends (auto-triggered) |
| 4 | Stats Modal | Modal overlay | Display streak, win rate, distribution | Header icon, completion modal |
| 5 | Settings | Modal or slide panel | User preferences (theme, accessibility) | Header gear icon |
| 6 | How to Play | Modal overlay | Replayable tutorial for returning users | Settings, header help icon |
| 7 | Share Confirmation | Toast notification | Confirm clipboard copy succeeded | After tapping Share |

### 2.2 Screen Specifications

#### Screen 1: Puzzle Screen (Primary)

**Purpose:** The single most important screen. Players spend 100% of active gameplay here.

**Layout (Mobile, 375px):**

```
+---------------------------------------+
|  [?]    CLUEGRID    [chart] [gear]    |  44px header
+---------------------------------------+
|                                       |
|            +-+-+-+-+-+                |
|            | | | | | |                |  Grid area
|          +-+-+-+-+-+-+-+              |  (flexible height,
|          | | | | | | | |              |   centered)
|          +-+-+-+-+-+-+-+              |
|            | | | | | |                |
|            +-+-+-+-+-+                |
|                                       |
+---------------------------------------+
|  CLUES                        [v/^]   |  Clue panel
|  1. "Playing cards for..."            |  (collapsible,
|  2. "Capital of..."                   |   max 120px)
|  ---                                  |
|  MAIN: Solve using crossers           |
+---------------------------------------+
|  Guesses: * * * o o o                 |  Progress bar
+---------------------------------------+
|  Q W E R T Y U I O P                 |
|   A S D F G H J K L                  |  Keyboard
|  [Enter] Z X C V B N M [Bksp]        |  (fixed bottom)
+---------------------------------------+
```

**Layout (Desktop, 1024px+):**

```
+-----------------------------------------------------------+
|      [?]       CLUEGRID       [chart] [gear]              |
+-----------------------------------------------------------+
|                    |                                       |
|                    |  CLUES                                |
|    +-+-+-+-+-+     |  1. "Playing cards for one person"    |
|    | | | | | |     |  2. "Capital of France"               |
|  +-+-+-+-+-+-+-+   |  3. "Opposite of hot"                 |
|  | | | | | | | |   |                                       |
|  +-+-+-+-+-+-+-+   |  ---                                  |
|    | | | | | |     |  MAIN WORD: Deduce from crossers      |
|    +-+-+-+-+-+     |                                       |
|                    |  Guesses: * * * o o o                  |
+-----------------------------------------------------------+
|         Q W E R T Y U I O P                               |
|          A S D F G H J K L                                |
|        [Enter] Z X C V B N M [Bksp]                       |
+-----------------------------------------------------------+
```

**Component Responsibilities:**
- **Header:** App title (centered), help icon (left), stats icon + settings icon (right). Minimal height. No navigation burger -- this is a single-page app.
- **Grid:** Interactive crossword-style grid. Active word cells are highlighted. Tap a word region to select it. Empty/inactive cells are dimmed or hidden.
- **Clue Panel:** Lists all crosser clues by display order. Tapping a clue selects that word in the grid. Solved clues show a checkmark. Active clue is highlighted. On mobile, panel is collapsible to give grid more room.
- **Progress Indicator:** Shows guess count (filled dots for used, empty for remaining). Placed between clues and keyboard.
- **Keyboard:** Full QWERTY layout. Keys change color based on feedback state. Enter key on left, backspace on right. Min 44px touch targets.

#### Screen 2: Onboarding Tutorial

**Purpose:** Get a brand-new user from "what is this?" to "I understand and want to play" in under 30 seconds.

**Layout:**

```
+---------------------------------------+
|                              [Skip]   |
|                                       |
|                                       |
|         [Illustration/Diagram]        |
|                                       |
|                                       |
|       Step Title                      |
|       Step description text,          |
|       1-2 lines max.                  |
|                                       |
|         o  o  *  o  o                 |  Page dots
|                                       |
|         [   Next   ]                  |  Primary CTA
|                                       |
+---------------------------------------+
```

**Behavior:**
- Swipe-able or tap "Next" to advance. No backward navigation (keep it simple).
- Step indicators (dots) show progress.
- Final step CTA changes to "Let's Play".
- Skip always available, sets onboarding flag immediately.

#### Screen 3: Completion Modal

**Purpose:** Provide closure, celebrate effort, drive sharing.

**Win Layout:**

```
+---------------------------------------+
|              [X close]                |
|                                       |
|           Celebration icon            |
|           "Brilliant!"               |
|                                       |
|     Solved in 4 guesses              |
|     Streak: 12 days                  |
|                                       |
|     +--NEXT PUZZLE--+                |
|     |   05:23:47    |                |
|     +---------------+                |
|                                       |
|   [  SHARE  ]   [  VIEW STATS  ]     |
|                                       |
+---------------------------------------+
```

**Loss Layout:**

```
+---------------------------------------+
|              [X close]                |
|                                       |
|           Book icon                   |
|           "So close!"                |
|                                       |
|     The word was: CRANE              |
|     You got 2/3 crossers             |
|                                       |
|     +--NEXT PUZZLE--+                |
|     |   05:23:47    |                |
|     +---------------+                |
|                                       |
|   [  SHARE  ]   [  VIEW STATS  ]     |
|                                       |
+---------------------------------------+
```

**Behavior:**
- Appears automatically on game end with a 600ms delay (let feedback animation finish first).
- Tapping outside or [X] dismisses. Modal can be re-opened from header.
- Countdown timer ticks in real time until midnight local.
- Win copy rotates: guesses 1-2 = "Genius!", 3-4 = "Brilliant!", 5 = "Nice!", 6 = "Phew!".

#### Screen 4: Stats Modal

**Purpose:** Reward consistency, make streaks feel valuable.

**Layout:**

```
+---------------------------------------+
|         Statistics       [X close]    |
+---------------------------------------+
|                                       |
|   47      81%      12       23       |
|  Played  Win %  Current   Max        |
|                  Streak   Streak     |
|                                       |
+---------------------------------------+
|  GUESS DISTRIBUTION                   |
|                                       |
|  1  ||  2                            |
|  2  |||||  5                         |
|  3  ||||||||||||  12                 |
|  4  ||||||||||  10                   |
|  5  ||||||  6                        |
|  6  |||  3                           |
|                                       |
+---------------------------------------+
|  NEXT PUZZLE                          |
|     05:23:47                          |
+---------------------------------------+
|                                       |
|   [  SHARE  ]  (if completed today)  |
|                                       |
+---------------------------------------+
```

**Behavior:**
- Stats load from localStorage, no network needed.
- Distribution bars are proportional to max value. Current game's bar highlighted.
- Share button only appears if today's puzzle is complete.

#### Screen 5: Settings

**Purpose:** Give users control over their experience. Keep it minimal.

**Layout:**

```
+---------------------------------------+
|          Settings        [X close]    |
+---------------------------------------+
|                                       |
|  Appearance                           |
|  Theme     [Light | Dark | System]    |
|                                       |
+---------------------------------------+
|  Accessibility                        |
|  Color Blind Mode         [toggle]    |
|  Reduced Motion           [toggle]    |
|                                       |
+---------------------------------------+
|  Help                                 |
|  How to Play              [>]         |
|  Send Feedback            [>]         |
|                                       |
+---------------------------------------+
|  About                                |
|  Version 1.0.0                        |
|  Made with care                       |
|                                       |
+---------------------------------------+
```

#### Screen 6: How to Play

Identical to onboarding tutorial, but accessible any time from Settings or the header help [?] icon. Same content, same flow.

---

## 3. Key Interaction Patterns

### 3.1 Word Selection

| Trigger | Behavior |
|---------|----------|
| Tap crosser clue in panel | Select that crosser as target. Highlight its cells in the grid. Highlight the clue row. |
| Tap cell in a word region | Select the word that cell belongs to. If cell is at an intersection of two words, prefer the word that is not currently selected (toggle behavior). |
| Solve a crosser | Auto-advance selection to the next unsolved crosser (by display order). If all crossers solved, select main word. |
| Game start (no saved state) | Auto-select the first crosser (display_order = 1). |
| Game restore (saved state) | Restore previous selection. If that word is now solved, advance to next unsolved. |

**Visual Feedback:**
- Selected word cells: brighter background, subtle border glow.
- Selected clue: left accent border, slightly bolder text.
- Solved word cells: filled with green background, letter visible.

### 3.2 Letter Input

| Trigger | Behavior |
|---------|----------|
| Tap keyboard key | Append letter to current guess if guess length < target word length. |
| Physical key press (a-z, A-Z) | Same as above. |
| Tap backspace / physical Backspace | Remove last letter from current guess. No-op if guess is empty. |
| Tap Enter / physical Enter | Submit current guess. No-op if guess length != target word length. |

**Visual Feedback:**
- Letter appears in the guess input area with a quick scale pulse (100ms, 1.0 -> 1.05 -> 1.0).
- Current cursor position indicated by a blinking underline in the guess area.
- If guess is full length, Enter key subtly pulses to draw attention.

### 3.3 Guess Submission & Feedback

**Sequence (timing critical for feel):**

```
1. Player presses Enter
   |
2. Disable keyboard input (prevent double-submit)          [0ms]
   |
3. POST /api/verify (optimistic: show loading dots)         [0ms]
   |
   +-- API error / timeout --> Re-enable keyboard,          [~2000ms]
   |                           show toast "Something
   |                           went wrong, try again"
   |
4. Response received                                        [~200ms]
   |
   +-- Invalid word --> Shake animation (200ms)
   |                    Toast "Not in word list" (2s)
   |                    Re-enable keyboard
   |                    Keep letters in guess area
   |
   +-- Valid word --> Begin reveal sequence:
        |
        5. Flip tile 1 (150ms flip + color reveal)          [0ms]
        6. Flip tile 2                                      [150ms]
        7. Flip tile 3                                      [300ms]
        8. Flip tile 4                                      [450ms]
        9. Flip tile 5                                      [600ms]
        |
       10. All tiles revealed                               [750ms]
           Update keyboard key colors
           |
           +-- Crosser solved --> Cross-reveal animation:
           |   Letter "drops" into main word cell (300ms)
           |   Cell briefly glows accent color (200ms)
           |   Auto-select next unsolved word
           |
           +-- Main word solved --> Win celebration:
           |   All main word cells do a wave bounce (100ms stagger)
           |   Subtle confetti or glow effect (500ms)
           |   600ms pause, then completion modal
           |
           +-- 6th guess used, not solved --> Loss:
           |   Brief pause (400ms)
           |   Completion modal (loss variant)
           |
           +-- Guess remaining --> Clear guess area
               Re-enable keyboard
               Ready for next input
```

### 3.4 Keyboard State Management

The keyboard tracks letter states across ALL guesses, regardless of target word.

**State Priority (highest wins):**

```
correct > present > absent > unused
```

| State | Visual | Meaning |
|-------|--------|---------|
| unused | Default surface color | Not yet guessed |
| absent | Dark gray (#787C7E / #3A3A3C) | Letter is not in any remaining word |
| present | Gold (#C9B458 / #B59F3B) | Letter is in a word but wrong position |
| correct | Green (#6AAA64 / #538D4E) | Letter is in the correct position |

**Rules:**
- A letter marked "correct" in one guess stays green even if marked "absent" in another guess for a different word.
- State only upgrades, never downgrades (absent -> present -> correct, never reverse).

### 3.5 Clue Panel Interactions

| State | Visual Treatment |
|-------|------------------|
| Default (unsolved, unselected) | Normal text, normal weight |
| Selected (active target) | Accent-color left border, slightly bolder text |
| Solved | Checkmark icon, strikethrough-style muted text, green accent |
| Main word hint | Italic text: "Deduce from crossing clues" (always last item) |

**Mobile Collapse Behavior:**
- Panel has a collapse/expand toggle (chevron icon).
- Default: expanded (showing all clues).
- When collapsed: shows only the currently selected clue (1 line).
- Expanding/collapsing uses a smooth slide animation (200ms).

### 3.6 Grid Cell States

| State | Visual | Border | Background |
|-------|--------|--------|------------|
| Empty (inactive) | No cell rendered | -- | -- |
| Empty (active, in a word) | Thin border | Subtle gray | Transparent |
| Filled (current guess) | Letter visible, bold | Medium gray | Transparent |
| Correct (green) | Letter visible | Green | Green (muted) |
| Present (yellow) | Letter visible | Gold | Gold (muted) |
| Absent (gray) | Letter visible | Dark gray | Dark gray |
| Revealed (cross-reveal) | Letter visible, accented | Accent blue briefly | Surface |
| Selected word highlight | -- | Accent border | Faint accent wash |

### 3.7 Share Interaction

**Share Text Format:**

```
CLUEGRID #[puzzle_number]
[guesses_used]/6

[emoji_grid]

cluegrid.app
```

**Emoji Grid Rules:**
- One row per guess.
- Green square for correct, yellow square for present, white/black square for absent.
- Only show guesses for the main word (crosser guesses omitted to keep it clean and spoiler-free).
- If player never guessed the main word directly (solved via crossers only), show the cross-reveals as green squares.

**Platform Behavior:**

| Platform | Action | API |
|----------|--------|-----|
| Mobile (iOS/Android) | Native share sheet | navigator.share() |
| Desktop (modern) | Copy to clipboard | navigator.clipboard.writeText() |
| Desktop (fallback) | Copy to clipboard | document.execCommand('copy') |

**Feedback:**
- Mobile: Share sheet opens (OS handles feedback).
- Desktop: Toast notification "Copied to clipboard!" (2 seconds, bottom-center).

### 3.8 Modal Behavior

All modals follow consistent patterns:

| Behavior | Specification |
|----------|---------------|
| Open animation | Fade in backdrop (150ms) + slide up modal (200ms, ease-out) |
| Close animation | Slide down (150ms) + fade out backdrop (100ms) |
| Backdrop | Semi-transparent black (50% opacity light, 70% opacity dark) |
| Close triggers | [X] button, tap/click backdrop, Escape key |
| Focus trap | Yes -- tab cycles within modal only |
| Scroll | Modal body scrolls independently if content overflows |
| Stacking | Only one modal at a time. Opening a new one replaces the current. |

---

## 4. Accessibility Requirements

### 4.1 WCAG AA Compliance Checklist

#### Perceivable

| Requirement | Specification | WCAG Criterion |
|-------------|---------------|----------------|
| Color contrast (text) | 4.5:1 minimum for normal text, 3:1 for large text (18px+ bold or 24px+) | 1.4.3 |
| Color contrast (UI elements) | 3:1 for interactive components and graphical elements | 1.4.11 |
| Color independence | Feedback states must not rely on color alone. Add letter-overlay icons in color blind mode: checkmark for correct, dash for present, X for absent. | 1.4.1 |
| Text resizing | App remains usable at 200% browser zoom. No horizontal scrolling at 200%. | 1.4.4 |
| Text spacing | Content adapts to: line height 1.5x, paragraph spacing 2x, letter spacing 0.12em, word spacing 0.16em. | 1.4.12 |
| Motion | Respect `prefers-reduced-motion`. When active: no flip animations, no confetti, no shake. Instant state changes. | 2.3.3 |

#### Operable

| Requirement | Specification | WCAG Criterion |
|-------------|---------------|----------------|
| Keyboard accessible | All interactive elements reachable via Tab. Enter/Space activates buttons. Arrow keys navigate grid. | 2.1.1 |
| No keyboard trap | Tab moves through: header actions -> grid -> clue panel -> keyboard -> modals. Always escapable. | 2.1.2 |
| Focus visible | 2px solid outline, offset 2px, accent color. Visible in both light and dark modes. | 2.4.7 |
| Focus order | Logical top-to-bottom, left-to-right. Matches visual order. | 2.4.3 |
| Skip link | Hidden link at top of page: "Skip to puzzle" jumps to grid. | 2.4.1 |
| Touch targets | Minimum 44x44px for all interactive elements. Keyboard keys: 44px min height, flexible width. | 2.5.8 |

#### Understandable

| Requirement | Specification | WCAG Criterion |
|-------------|---------------|----------------|
| Language | `<html lang="en">` on root element. | 3.1.1 |
| Error identification | Invalid guess: clear text description ("Not in word list"), not just color/shake. | 3.3.1 |
| Labels | All form controls have visible or accessible labels. | 3.3.2 |
| Consistent nav | Header icons remain in same position across all states. | 3.2.3 |

#### Robust

| Requirement | Specification | WCAG Criterion |
|-------------|---------------|----------------|
| Valid HTML | Semantic HTML5 elements. Landmarks: header, main, footer. | 4.1.1 |
| ARIA roles | Grid: `role="grid"` with `role="row"` and `role="gridcell"`. Keyboard: `role="group"` with `role="button"` per key. | 4.1.2 |
| Live regions | Guess feedback announced via `aria-live="polite"`. Errors via `aria-live="assertive"`. | 4.1.3 |

### 4.2 Screen Reader Announcements

| Event | Announcement (aria-live) | Priority |
|-------|--------------------------|----------|
| Guess submitted (valid) | "Row [N]: [WORD]. [letter] correct, [letter] not in word, [letter] wrong position, ..." | polite |
| Guess submitted (invalid) | "Not in word list. Try again." | assertive |
| Crosser solved | "[CLUE] solved! Letter [L] revealed in main word position [N]." | polite |
| Game won | "Congratulations! Puzzle solved in [N] guesses. Your streak is [S] days." | assertive |
| Game lost | "Puzzle not solved. The word was [WORD]. You solved [N] of [M] crossers." | assertive |
| Word selected | "Now guessing: [clue text or 'main word']. [N] letters." | polite |
| Modal opened | "[Modal title] dialog opened." | polite |
| Modal closed | "Dialog closed." | polite |

### 4.3 Keyboard Navigation Map

```
Tab Order (forward):

[Skip to puzzle link]
  -> [Help icon]
  -> [Stats icon]
  -> [Settings icon]
  -> [Grid] (arrow keys navigate between cells)
  -> [Clue panel items] (arrow keys or Tab between clues)
  -> [Keyboard row 1: Q W E R T Y U I O P]
  -> [Keyboard row 2: A S D F G H J K L]
  -> [Keyboard row 3: Enter Z X C V B N M Backspace]
```

**Grid Arrow Key Navigation:**
- Arrow Up/Down: move between rows.
- Arrow Left/Right: move between cells in current row.
- Enter on a cell: select the word that cell belongs to.
- The grid cells themselves are informational; typing is always via the keyboard.

### 4.4 Color Blind Mode

When `colorBlindMode: true`:

| State | Color | Additional Indicator |
|-------|-------|---------------------|
| Correct | Green (#6AAA64) | Filled circle icon overlay in cell corner |
| Present | Orange (#F5793A) -- shifted from gold for better differentiation | Diagonal line pattern overlay |
| Absent | Gray (#787C7E) | No additional indicator (absence is clear) |

Changes from default:
- Gold (#C9B458) replaced with high-contrast orange (#F5793A).
- Pattern overlays rendered on grid cells AND keyboard keys.
- Patterns are SVG-based, scale with cell size.

---

## 5. Error States & Edge Cases

### 5.1 Error States

| Error | Trigger | User-Facing Message | Visual Treatment | Recovery |
|-------|---------|---------------------|-----------------|----------|
| Invalid word | Submitting a word not in the dictionary | "Not in word list" | Toast (2s) + row shake (200ms) | Letters remain in input. Player can edit and re-submit. |
| Too few letters | Pressing Enter with incomplete guess | "Not enough letters" | Toast (2s) + row shake (200ms) | Letters remain. Player adds more letters. |
| Network error (puzzle load) | GET /api/puzzle fails or times out | "Couldn't load today's puzzle. Check your connection and try again." | Full-screen centered message + [Retry] button | Tap Retry to re-fetch. |
| Network error (guess verify) | POST /api/verify fails or times out | "Something went wrong. Try again." | Toast (3s) | Keyboard re-enabled. Guess preserved. Player taps Enter to retry. |
| No puzzle available | No published puzzle for today's date | "No puzzle today. Come back tomorrow!" | Full-screen centered message + next puzzle countdown | Automatic. No action needed. |
| localStorage full | Cannot save game state | "Unable to save progress. Your browser storage may be full." | Toast (5s, persistent until dismissed) | Game continues. Player can clear browser data. |
| localStorage unavailable | Private browsing or storage disabled | No message (degrade gracefully) | Game works, but does not persist between sessions. Stats unavailable. | None needed. Inform on stats modal: "Stats require browser storage." |

### 5.2 Edge Cases

#### Gameplay Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| Player refreshes mid-game | Game state restored from localStorage exactly where they left off. Same guesses, same selected word, same revealed letters. |
| Player returns after midnight (new puzzle available) | If previous game was incomplete: it counts as a loss for stats, streak may break. New puzzle loads. Show no interrupting message -- just load the new puzzle. |
| Player opens app but already completed today's puzzle | Show completed grid state. Share and Stats buttons accessible in header. Completion modal does NOT auto-re-open (can be opened manually). |
| Player guesses main word directly on first try (without solving crossers) | Valid and celebrated. Win state triggers. Crossers remain unsolved in the grid. Stats record 1-guess win. |
| Player solves all crossers but has not guessed main word yet | Crosser letters revealed in main word. If all letters of the main word are revealed through crossers, auto-complete the main word. Treat as a win; guess count = number of guesses used. |
| All crossers solved, some main word letters revealed, but not all | Player must still guess the main word. Revealed letters are shown, remaining cells are empty. Player benefits from partial information. |
| Player's guess matches a crosser word when targeting main word | Valid guess. Feedback is computed against the MAIN word (the target). The fact that it matches a crosser is irrelevant -- feedback only considers the selected target. |
| Same letter in multiple positions | Standard Wordle rules: if the answer has one "A" and the guess has two "A"s, only one gets yellow/green. Priority: correct position first, then present for remaining. |
| Player uses all 6 guesses on crossers, never guesses main word | Loss state. Main word revealed. Crossers solved still count toward stats. |

#### Temporal Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| Player starts puzzle at 11:58 PM, finishes at 12:02 AM | The game state is tied to the puzzle date, not the clock. The puzzle they started is the puzzle they finish. Completion counts toward that day. |
| Timezone handling | Puzzles reset at midnight LOCAL time (using the browser's timezone). The "next puzzle" countdown counts down to local midnight. |
| Clock manipulation | Server-side validation prevents submitting guesses for future puzzles. Current-day and past puzzles only. |
| Multiple tabs open | All tabs share the same localStorage. Last-write-wins for game state. No cross-tab sync needed for MVP. |

#### Device / Platform Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| Extremely narrow screen (320px) | Grid cells shrink but remain tappable (min 36px). Clue text wraps. Keyboard keys shrink but stay above 40px height. |
| Extremely wide screen (2560px+) | Content centered with max-width 600px. Grid and keyboard do not stretch beyond comfortable size. |
| Landscape orientation (mobile) | Clue panel collapses by default. Grid and keyboard share horizontal space. Keyboard remains bottom-anchored. |
| Virtual keyboard conflicts (mobile) | Our on-screen keyboard is always visible. Hide the system virtual keyboard via `inputmode="none"` on any focused inputs. No text input elements in the puzzle view. |
| Slow connection (3G) | Puzzle data is small (<5KB JSON). Show skeleton loading state for grid while fetching. Guess verification should feel instant -- if >2s, show inline spinner on Enter key. |
| Offline (no connection at all) | If puzzle already loaded and cached in state: gameplay works (queue guess verifications). If not loaded: show network error with retry. Future PWA: service worker caches puzzle on load. |

### 5.3 State Transition Diagram

```
                    +----------+
                    | loading  |
                    +----+-----+
                         |
         +---------------+---------------+
         |               |               |
         v               v               v
   +---------+    +----------+    +----------+
   | error   |    | no_puzzle|    | playing  |<--+
   | (retry) |    +----------+    +----+-----+   |
   +---------+                         |         |
                                       |         |
                              +--------+---------+---+
                              |        |              |
                              v        v              |
                         +------+  +------+      (guess, not
                         | won  |  | lost |       game over)
                         +------+  +------+
```

Valid transitions:
- `loading` -> `playing` (puzzle loaded successfully)
- `loading` -> `error` (network failure)
- `loading` -> `no_puzzle` (no puzzle for today)
- `error` -> `loading` (retry tapped)
- `playing` -> `won` (main word solved)
- `playing` -> `lost` (6 guesses exhausted)
- `playing` -> `playing` (guess submitted, game continues)

Invalid transitions (must never occur):
- `won` -> `playing` (cannot undo a win)
- `lost` -> `playing` (cannot undo a loss)
- `won` -> `lost` or `lost` -> `won`

---

## 6. Design Tokens Reference

These tokens ensure consistent implementation across all screens.

### 6.1 Spacing

| Token | Value | Usage |
|-------|-------|-------|
| spacing-xs | 4px | Inline padding, icon gaps |
| spacing-sm | 8px | Grid cell gaps, tight margins |
| spacing-md | 16px | Section padding, card padding |
| spacing-lg | 24px | Section margins, modal padding |
| spacing-xl | 32px | Page margins (mobile) |
| spacing-2xl | 48px | Page margins (desktop) |

### 6.2 Typography

| Element | Font | Size | Weight | Line Height |
|---------|------|------|--------|-------------|
| App title | Inter | 20px | 700 | 1.2 |
| Grid letter | Inter | 24px (mobile), 28px (desktop) | 700 | 1.0 |
| Clue text | Inter | 15px | 400 | 1.4 |
| Clue text (active) | Inter | 15px | 500 | 1.4 |
| Keyboard key | Inter | 14px | 600 | 1.0 |
| Stat number | Inter | 32px | 600 | 1.0 |
| Stat label | Inter | 12px | 400 | 1.2 |
| Toast text | Inter | 14px | 500 | 1.3 |
| Modal title | Inter | 18px | 600 | 1.2 |
| Body text | Inter | 16px | 400 | 1.5 |

### 6.3 Animation Timing

| Animation | Duration | Easing | Reduced Motion Alternative |
|-----------|----------|--------|---------------------------|
| Letter entry pulse | 100ms | ease-out | No animation, instant appear |
| Tile flip (per tile) | 150ms | ease-in-out | Instant color change |
| Tile flip stagger | 150ms between tiles | linear | All tiles change simultaneously |
| Row shake (invalid) | 200ms | ease-in-out (3 oscillations) | Red border flash (100ms) |
| Cross-reveal drop | 300ms | cubic-bezier(0.34, 1.56, 0.64, 1) | Instant appear |
| Win bounce wave | 100ms stagger per tile, 300ms bounce | ease-out | No animation |
| Win confetti/glow | 500ms | ease-out | Omitted entirely |
| Modal enter | 200ms slide + 150ms fade | ease-out | Instant appear |
| Modal exit | 150ms slide + 100ms fade | ease-in | Instant disappear |
| Toast enter | 150ms slide-up | ease-out | Instant appear |
| Toast auto-dismiss | 2000ms display, 150ms fade-out | ease-in | Same timing, no fade |

### 6.4 Breakpoints

| Name | Width | Layout Changes |
|------|-------|----------------|
| Mobile | 0-639px | Single column. Clues below grid. Keyboard full-width. |
| Tablet | 640-1023px | Grid and clues side by side. Keyboard centered. |
| Desktop | 1024px+ | Content max-width 800px, centered. Generous whitespace. |

---

## 7. Component Hierarchy

```
App
+-- Header
|   +-- HelpButton
|   +-- AppTitle
|   +-- StatsButton
|   +-- SettingsButton
|
+-- Main
|   +-- PuzzleScreen (primary, always mounted)
|   |   +-- Grid
|   |   |   +-- GridRow (repeated)
|   |   |       +-- Cell (repeated)
|   |   |
|   |   +-- CluePanel
|   |   |   +-- ClueItem (repeated)
|   |   |   +-- MainWordHint
|   |   |
|   |   +-- GuessProgress
|   |   |
|   |   +-- Keyboard
|   |       +-- KeyboardRow (3x)
|   |           +-- Key (repeated)
|   |
|   +-- OnboardingOverlay (conditional: first visit)
|   |   +-- OnboardingStep (5 steps)
|   |       +-- StepIllustration
|   |       +-- StepContent
|   |       +-- ProgressDots
|   |       +-- NextButton
|   |
|   +-- CompletionModal (conditional: game over)
|   |   +-- ResultIcon
|   |   +-- ResultMessage
|   |   +-- ResultDetails
|   |   +-- CountdownTimer
|   |   +-- ShareButton
|   |   +-- ViewStatsButton
|   |
|   +-- StatsModal (conditional: toggled)
|   |   +-- StatsSummary (4 numbers)
|   |   +-- GuessDistributionChart
|   |   +-- CountdownTimer
|   |   +-- ShareButton
|   |
|   +-- SettingsModal (conditional: toggled)
|   |   +-- ThemeSelector
|   |   +-- AccessibilityToggles
|   |   +-- HelpLinks
|   |   +-- AboutSection
|   |
|   +-- HowToPlayModal (conditional: toggled)
|
+-- ToastContainer (fixed position, bottom-center)
    +-- Toast (0-1 visible at a time)

+-- ScreenReaderAnnouncements (visually hidden, aria-live regions)
```
