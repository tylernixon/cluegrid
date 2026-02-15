# Cluegrid - Game Rules (Canonical Reference)

**Owner:** Felix (Game Designer)
**Version:** 1.0
**Last Updated:** 2026-02-14

This document is the single source of truth for Cluegrid game mechanics. All implementation, content creation, and QA decisions defer to this spec. If the PDD conflicts with this document, this document wins.

---

## 1. Core Mechanics

### 1.1 The Grid

Each puzzle consists of one **main word** and multiple **crosser words** arranged in a crossword-style grid.

- **Main word:** Always horizontal. Always exactly 5 letters.
- **Crossers:** 2-4 vertical words that intersect the main word. Each crosser is 3-5 letters long.
- **Grid size:** Dynamically sized to fit the words. Typically 5 columns wide, 3-7 rows tall.
- **Intersection:** Each crosser shares exactly one letter with the main word at a specific position. No two crossers share the same column (each occupies a unique position along the main word).

```
Example: Main word = CRANE, Crossers = CRISP (at C), PEACE (at E)

        Col 0  Col 1  Col 2  Col 3  Col 4
Row 0     C
Row 1     R                          P
Row 2     I                          E
Row 3   [ C  ] [ R  ] [ A  ] [ N  ] [ E  ]   <-- Main word
Row 4     S                          C
Row 5     P                          E
```

### 1.2 Guessing

- **Total guesses:** 6 maximum. This is a shared budget across the entire puzzle -- guesses targeting the main word and guesses targeting crossers all draw from the same pool of 6.
- **Guess targeting:** Before submitting a guess, the player selects which word they are guessing (the main word or one of the crossers). This is done by tapping/clicking the target word in the grid.
- **Guess length:** The guess must match the length of the targeted word exactly (5 letters for the main word, 3-5 letters for crossers depending on the crosser's length).
- **Valid words only:** Guesses must be real words present in the game dictionary. Invalid guesses are rejected and do NOT consume a guess.
- **Case insensitive input, uppercase display:** Players type in any case; all display is uppercase.

### 1.3 Feedback (Color Coding)

After each valid guess, every letter receives Wordle-style positional feedback **relative to the targeted word:**

| Color | Name | Meaning |
|-------|------|---------|
| Green | Correct | Letter is in the word AND in the correct position |
| Yellow/Gold | Present | Letter is in the word but NOT in this position |
| Gray | Absent | Letter is NOT in the word at all |

**Feedback rules (matching Wordle conventions):**
- If a letter appears once in the answer but the guess contains it twice, only one instance gets green or yellow. Priority: green first, then yellow left-to-right, then gray for excess.
- Feedback is always relative to the targeted word, not the entire puzzle.

### 1.4 The Smart Keyboard

An on-screen keyboard tracks the global state of each letter across ALL guesses for ALL words:

- A letter marked **green** in any guess stays green on the keyboard.
- A letter marked **yellow** in any guess shows yellow, unless it has also been green elsewhere.
- A letter marked **gray** in any guess shows gray, unless it has been green or yellow elsewhere.
- Priority: green > yellow > gray > unknown.

The keyboard state helps players track elimination across the entire puzzle, not just one word.

---

## 2. Cross-Reveal Mechanic

This is the mechanic that makes Cluegrid unique.

### 2.1 How It Works

When a player **correctly solves a crosser word**, the letter at the intersection of that crosser and the main word is **revealed** (permanently placed) in the main word.

- The revealed letter appears in the main word's row in its correct position.
- The revealed letter is visually distinct (e.g., filled in with a highlight) to indicate it was earned through a crosser solve, not guessed directly.
- Revealed letters serve as free, confirmed information for subsequent main word guesses.

### 2.2 Strategic Implication

Players face a strategic choice:
- **Guess the main word directly** -- uses a guess but can win immediately if correct.
- **Solve crossers first** -- uses guesses on crossers but reveals confirmed letters in the main word, making later main word guesses more informed.

The optimal strategy depends on how many letters the player can deduce. This tension is the core of the game.

### 2.3 Revealed Letter Rules

- Revealed letters do NOT count as a guess. They are a reward for solving a crosser.
- A player cannot "partially" solve a crosser -- a crosser is either fully solved or not.
- If multiple crossers are solved, multiple letters are revealed in the main word.
- A revealed letter does not affect feedback for prior guesses (feedback is locked in at guess time).

---

## 3. Clue System

### 3.1 Clue Visibility

- **Crosser clues:** All crosser clues are visible from the start of the puzzle. There is no progressive reveal in MVP.
- **Main word clue:** The main word has NO clue. The main word must be deduced entirely from crosser reveals and guess feedback.

### 3.2 Clue Format

Each crosser has exactly one clue. Clues are short-form (typically 3-15 words), written in crossword style. They must:
- Point to exactly one answer unambiguously
- Not require specialized or regional knowledge
- Not contain the answer word or obvious derivatives

### 3.3 Clue Display

Clues are shown in a collapsible panel below the grid, numbered by display order (1, 2, 3...). Tapping a clue highlights the corresponding crosser word in the grid.

### 3.4 Future Consideration: Progressive Clue Reveal

A future difficulty mode may hide clues initially and reveal them after N guesses. This is NOT part of MVP and is noted here only for forward compatibility. Any progressive reveal system will be specified in a revision of this document before implementation.

---

## 4. Win and Loss Conditions

### 4.1 Win Condition

The player wins when the **main word is solved**, regardless of how many crossers were solved. Specifically:

- A correct guess targeting the main word ends the game as a **win**.
- The game is won even if zero crossers were solved (player guessed the main word directly).
- Solving all crossers does NOT automatically win the game -- the player must still submit the main word as a guess (even if all 5 letters have been revealed by crossers).

**Design rationale:** Requiring the main word guess even when fully revealed keeps the win moment intentional and satisfying. The player always "submits" their answer.

### 4.2 Loss Condition

The player loses when all 6 guesses have been exhausted without solving the main word.

- A loss is a loss regardless of how many crossers were solved.
- On loss, the correct main word AND all unsolved crosser words are revealed to the player.

### 4.3 Game Over States

| State | Trigger | Display |
|-------|---------|---------|
| Win in 1 | Main word guessed correctly on guess 1 | "Genius!" |
| Win in 2 | Main word guessed correctly on guess 2 | "Magnificent!" |
| Win in 3 | Main word guessed correctly on guess 3 | "Brilliant!" |
| Win in 4 | Main word guessed correctly on guess 4 | "Excellent!" |
| Win in 5 | Main word guessed correctly on guess 5 | "Nice!" |
| Win in 6 | Main word guessed correctly on guess 6 | "Phew!" |
| Loss | 6 guesses exhausted | "So close! The word was [WORD]" |

### 4.4 Partial Credit

On a loss, the number of crossers solved (e.g., "2/3 crossers") is displayed. This is tracked in stats as `crossersSolved` vs `totalCrossers`. Partial credit is informational only -- it does not affect streaks or win rate.

---

## 5. Guess Targeting and Validation

### 5.1 Target Selection

- On puzzle load, the default target is the main word.
- The player switches targets by tapping a crosser word in the grid or tapping its clue.
- The active target is visually highlighted in the grid.
- The keyboard input area shows the target word's length (e.g., 5 blank tiles for main word, 4 tiles for a 4-letter crosser).

### 5.2 Already-Solved Words

- Once a crosser is solved, it cannot be targeted again. Tapping a solved crosser shows its answer but does not change the target.
- Once the main word is solved (win), the game is over and no further input is accepted.

### 5.3 Guess Validation

Before a guess is evaluated for feedback, it must pass validation:

| Check | Result if failed |
|-------|-----------------|
| Guess is wrong length | Rejected, error message: "Not enough letters" or "Too many letters" |
| Guess is not in dictionary | Rejected, error message: "Not in word list." Shake animation. |
| Game is already over | Rejected silently |

**Rejected guesses do NOT consume a guess.** The player can freely retry.

### 5.4 Guess Against Already-Solved Crosser

If a player somehow attempts to guess against an already-solved crosser (e.g., via race condition), the guess is rejected. This should be prevented by the UI.

---

## 6. Streaks and Statistics

### 6.1 Core Stats

Stored locally in the browser (localStorage). Stats are per-device, not per-account (no user accounts in MVP).

| Stat | Description | Update Rule |
|------|-------------|-------------|
| `gamesPlayed` | Total games completed (win or loss) | +1 on game completion |
| `gamesWon` | Total wins | +1 on win |
| `currentStreak` | Consecutive days with a win | See 6.2 |
| `maxStreak` | Highest streak ever achieved | Updated when currentStreak exceeds it |
| `guessDistribution` | Histogram of wins by guess count (1-6) | +1 to the appropriate bucket on win |
| `totalCrossersSolved` | Lifetime crossers solved | +N on game completion (N = crossers solved in that game) |
| `lastPlayedDate` | ISO date of last game started | Updated on game start |
| `lastCompletedDate` | ISO date of last game completed | Updated on game completion |

### 6.2 Streak Rules

A streak is a consecutive run of calendar days where the player won that day's puzzle.

**Streak increments** (+1) when:
- The player wins today's puzzle AND
- `lastCompletedDate` is either yesterday or today (same-day replay does not double-count)

**Streak resets** (to 1 if winning, 0 if losing) when:
- The player completes a puzzle but `lastCompletedDate` is more than 1 calendar day ago

**Streak is unchanged** when:
- The player has not yet completed today's puzzle

**Edge case: timezone.** Puzzle dates are determined by the server (UTC-based puzzle assignment). The "day" boundary is midnight UTC. A player who plays at 11pm EST on Monday gets Monday's puzzle; at midnight EST they get Tuesday's puzzle.

### 6.3 Soft Streak (Post-MVP)

A "grace day" mechanic where missing one day does not break the streak. This is NOT in MVP but is flagged here. When implemented, the rule will be:

- Missing 1 consecutive day preserves the streak (frozen, not incremented).
- Missing 2+ consecutive days resets the streak.
- Maximum 1 grace day per 7-day window (to prevent abuse).

### 6.4 Guess Distribution

Wins are bucketed into how many total guesses it took to solve the main word (1-6). Losses are NOT included in guess distribution. The distribution is displayed as a horizontal bar chart in the stats panel.

### 6.5 Game History

The last 30 completed games are stored in localStorage as a history ring buffer. Each entry records:
- `puzzleDate`
- `status` (won/lost)
- `guessCount`
- `crossersSolved` / `totalCrossers`
- `completedAt` (timestamp)

---

## 7. Daily Puzzle Cadence

### 7.1 One Puzzle Per Day

- Exactly one puzzle is available per calendar day (UTC).
- The puzzle for a given date is deterministic and the same for all players worldwide.
- A new puzzle becomes available at **00:00 UTC** each day.

### 7.2 One Attempt Per Puzzle

- Each player gets exactly one attempt at each daily puzzle.
- If the player leaves mid-puzzle and returns, their progress is restored from localStorage.
- A completed puzzle (win or loss) cannot be replayed. The result screen is shown on return.

### 7.3 Puzzle Numbering

Each puzzle has a sequential number (Cluegrid #1, #2, ...) starting from launch day. This number is used in share cards and stats.

---

## 8. Share Card

### 8.1 Share Format

On game completion (win or loss), the player can share a spoiler-free result:

```
CLUEGRID #47
4/6 guesses | 2/3 crossers

[emoji grid of main word guesses]

cluegrid.app
```

### 8.2 Emoji Grid Rules

Each row of the share card represents one guess **targeting the main word only**. Crosser guesses are NOT shown in the emoji grid (they would spoil crosser answers).

| Feedback | Emoji (Default) | Emoji (Color-Blind) |
|----------|-----------------|---------------------|
| Correct | green square | orange square |
| Present | yellow square | blue square |
| Absent | black/white square | black/white square |

If the player solved the main word without guessing it directly (all letters revealed by crossers, then confirmed), only the final confirmation guess row is shown.

### 8.3 Loss Share Format

```
CLUEGRID #47
X/6 guesses | 2/3 crossers

[emoji grid of all main word guesses]

cluegrid.app
```

The "X/6" indicates a loss.

---

## 9. Difficulty Framework

### 9.1 Target Win Rate

The overall target win rate across all puzzles is **70-80%**. This is calibrated so that:
- The game feels achievable to casual players
- Losses are infrequent enough to sting (maintaining stakes)
- Streaks are achievable but not trivial

### 9.2 Difficulty Levers

| Lever | Easier | Harder |
|-------|--------|--------|
| Main word frequency | Common word (CRANE, BEACH) | Less common word (GRIMY, PLUMB) |
| Crosser count | 4 crossers (more reveals) | 2 crossers (fewer reveals) |
| Crosser word frequency | Common crossers | Harder crossers |
| Clue difficulty | Direct definition clues | Lateral/wordplay clues |
| Intersection positions | Reveal common letters (vowels, S, T) | Reveal uncommon letters (X, Z, Q) |

### 9.3 Difficulty Rating Scale

Each puzzle is assigned a difficulty rating of 1-5:

| Rating | Label | Target Win Rate | Crosser Count | Word Frequency |
|--------|-------|-----------------|---------------|----------------|
| 1 | Easy | 90%+ | 4 | Very common |
| 2 | Medium-Easy | 80-90% | 3-4 | Common |
| 3 | Medium | 70-80% | 3 | Common |
| 4 | Medium-Hard | 60-70% | 2-3 | Moderate |
| 5 | Hard | 50-60% | 2 | Less common |

### 9.4 MVP Difficulty Target

For MVP, all puzzles should target difficulty 2-3 (aim for consistent 75% win rate). Difficulty 1, 4, and 5 are reserved for post-MVP themed days.

---

## 10. Edge Cases and Clarifications

### 10.1 What Counts as a "Guess"?

Only successfully validated guesses (real words of correct length submitted against a valid target) consume a guess. Specifically:

- Invalid word? **Not a guess.** Does not consume.
- Wrong length? **Not a guess.** Does not consume.
- Correct crosser solve? **Is a guess.** Consumes 1 guess AND reveals the intersection letter.
- Incorrect crosser guess? **Is a guess.** Consumes 1 guess. No letter revealed.
- Correct main word? **Is a guess.** Consumes 1 guess. Game won.
- Incorrect main word? **Is a guess.** Consumes 1 guess.

### 10.2 Can You Win on a Crosser Guess?

No. Only solving the main word wins the game. Solving a crosser reveals a letter but the game continues.

### 10.3 What If All Crossers Are Solved?

The player still has to guess the main word. Even if all intersection letters have been revealed, the game does not auto-complete. The player must submit the main word as a guess to win.

**Why:** This preserves the intentional "aha" moment. The player actively solves the puzzle rather than having it solved for them.

### 10.4 Can the Same Word Appear as Both Main and Crosser?

No. The main word and all crossers must be distinct words.

### 10.5 Can a Crosser and Main Word Share Non-Intersection Letters?

Yes. A crosser's non-intersecting letters may coincidentally match letters in the main word. Feedback is always relative to the targeted word only, so this does not create confusion.

### 10.6 What Happens If the Player Guesses the Main Word as a Crosser?

The guess is evaluated against the targeted crosser, not the main word. It will likely get incorrect feedback. This is valid and costs a guess.

### 10.7 Duplicate Letters in the Main Word

The main word can contain duplicate letters (e.g., LLAMA, EERIE). Feedback follows standard Wordle duplicate-letter handling: green matches are assigned first, then yellow from left-to-right, with excess instances marked gray.

### 10.8 Can Players Guess Any Word Against Any Target?

Yes, as long as the guess is the correct length for the target and is in the dictionary. You can guess any valid 5-letter word against the main word, and any valid N-letter word against an N-letter crosser.

### 10.9 Browser/Device State

- Game state is stored in localStorage and is device-specific.
- Clearing browser data loses all progress, stats, and streaks.
- There is no account system or cross-device sync in MVP.
- If localStorage is unavailable (private browsing in some browsers), the game still functions but stats do not persist.

### 10.10 What If Today's Puzzle Fails to Load?

If the daily puzzle cannot be fetched (server error, network issue), the player sees an error state with a retry button. No guess is consumed. The player's streak is not affected unless they never complete the puzzle before the day ends.

---

## 11. Glossary

| Term | Definition |
|------|------------|
| **Main word** | The 5-letter horizontal word that must be solved to win |
| **Crosser** | A vertical word that intersects the main word; has an associated clue |
| **Intersection** | The grid cell where a crosser and the main word share a letter |
| **Reveal / Cross-reveal** | The act of a solved crosser placing its intersection letter into the main word |
| **Guess** | A validated word submission that consumes 1 of the 6 allowed attempts |
| **Feedback** | The green/yellow/gray color coding returned after a guess |
| **Streak** | Consecutive calendar days with a winning completion |
| **Share card** | The spoiler-free emoji grid result copied to clipboard |
| **Partial credit** | The count of crossers solved in a losing game (informational only) |
| **Soft streak** | (Post-MVP) Grace day mechanic that prevents streak loss for a single missed day |

---

## 12. Open Design Questions (To Be Resolved Via Playtesting)

These are decisions deferred until playtesting data is available:

1. **Should solving all crossers auto-submit the main word?** Current answer: No. But if playtesting shows this causes confusion, we may reconsider.
2. **Should the share card include crosser solve info?** Current answer: Yes ("2/3 crossers"). May remove if it clutters sharing.
3. **Should guesses targeting crossers show in the main word's guess history?** Current answer: No. Each word has its own guess history. Cross-target feedback could confuse.
4. **Should there be a "hint" button that reveals a random letter?** Current answer: No for MVP. Potential P2 feature.
5. **Should Hard Mode exist?** (e.g., must use confirmed letters in subsequent guesses) Current answer: Deferred to post-MVP. A `hardMode` flag exists in settings for forward compatibility.

---

*This document is maintained by the Game Designer. Changes require review and version bump.*
