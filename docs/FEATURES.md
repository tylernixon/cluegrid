# Gist - Feature Documentation

## Hamburger Menu

The hamburger menu provides navigation to key sections of the app. Located in the top-left corner of the header.

### Opening the Menu
- **Tap the hamburger icon** (three horizontal lines) in the top-left corner
- **Swipe right from the left edge** of the screen (within ~20px of the edge). The gesture triggers when dragging past 80px or with sufficient velocity.

### Menu Items
- **Settings** - Theme toggle (light/dark) and difficulty selector
- **Stats** - Game statistics, guess distribution chart, and earned badges
- **History** - Calendar view of past puzzle results with shareable detail cards

### Closing the Menu
- Tap the X button in the drawer header
- Tap the dark overlay behind the drawer
- Press the Escape key
- Swipe the drawer to the left (drag past 100px or flick with velocity)

### Accessibility
- The drawer traps focus when open (Tab cycles within the drawer)
- `aria-modal="true"` and `role="dialog"` on the drawer panel
- `aria-expanded` on the hamburger button reflects drawer state
- Body scroll is locked while the drawer is open

## History Feature

The History view displays a calendar of all past puzzles played, with the ability to view game details and share results.

### Calendar View
- Navigate between months using the left/right arrows
- Days with played puzzles show a colored status dot:
  - **Green** - Won
  - **Red** - Lost
  - **Gray** - Missed
- Tap a day to see a quick summary card below the calendar
- Tap the summary card to open a detailed modal

### History Detail Modal
- Shows the full game result: date, star rating, guess count, hints used, difficulty
- Displays the visual guess grid (colored squares showing feedback)
- **Share button** generates a shareable text summary including:
  - Puzzle date
  - Star rating (emoji stars)
  - Guess count
  - Hints used
  - Crosser solve summary
- Uses the Web Share API on mobile, falls back to clipboard on desktop

### Data Storage
- Game history is stored in `localStorage` under the `gist:history` key
- Persisted via Zustand's `persist` middleware
- Automatic quota management: if `localStorage` is full, the oldest 20% of entries are pruned

## Help System

The help system provides two ways to learn the game:

### Help Menu
- Tap the **?** icon in the top-right corner of the header
- An action sheet slides up from the bottom with two options:
  - **View Tutorial** - Opens the onboarding slideshow
  - **Interactive Walkthrough** - Starts a guided practice puzzle

### Onboarding / Tutorial
- A 4-slide carousel explaining the game mechanics:
  1. Welcome
  2. Main word concept (find the horizontal word)
  3. Hints (solve crossing words to reveal letters)
  4. Ready to play
- Navigate via swipe, arrow keys, or dot indicators
- Shows automatically on first visit; can be reopened from the help menu

### Interactive Tour (Walkthrough)
- A self-contained practice puzzle with step-by-step guidance
- Uses a custom tutorial puzzle (not today's real puzzle)
- 7 guided steps that walk through solving a crosser and the main word
- Includes a virtual keyboard for input during practice
- Tooltip overlay provides instructions at each step with skip option

## Keyboard & Input

### Physical Keyboard
- Type letters A-Z to fill the current target word
- **Enter** to submit a guess
- **Backspace** to remove the last letter
- **Escape** to close modals/drawers
- **Arrow keys** to navigate onboarding slides

### Virtual Keyboard
- Standard QWERTY layout with Enter and Backspace keys
- Keys are color-coded based on feedback for the current target:
  - **Green** - Letter is correct in this position
  - **Gold** - Letter is in the word but wrong position
  - **Gray** - Letter is not in the word
- Disabled during loading, submission, or when the game is over

## Accessibility

- Skip link to jump directly to the puzzle grid
- Screen reader announcements for guess feedback and game outcomes
- `aria-live` regions for toasts and game status updates
- All modals/dialogs have proper `role="dialog"` and `aria-modal="true"`
- Focus is trapped within open modals and drawers
- All interactive elements have `focus-visible` ring indicators
- Touch targets meet the 44x44px WCAG minimum
- High contrast mode support via `@media (prefers-contrast: more)`
- Forced colors (Windows High Contrast) support via `@media (forced-colors: active)`
- Reduced motion support via `@media (prefers-reduced-motion: reduce)` disabling CSS animations
- Framer Motion respects `prefers-reduced-motion` automatically
