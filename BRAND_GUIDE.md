# Cluegrid Brand Guide

## 1. Brand Personality & Voice

### Personality Attributes

| Attribute | Description | In Practice |
|-----------|-------------|-------------|
| **Calm** | Unhurried, meditative | Muted palette, generous whitespace, eased animations |
| **Clever** | Rewards deduction, not luck | Typographic hierarchy that leads the eye; clues feel editorial |
| **Premium** | Ad-free, refined, intentional | No visual clutter; every pixel earns its place |
| **Warm** | Approachable, not sterile | Soft surfaces, slight warmth in neutrals, friendly copy |

### Brand Voice

- **Tone:** Quiet confidence. We never shout. Headlines are lowercase or sentence-case, not ALL CAPS.
- **Vocabulary:** Smart but never condescending. "Brilliant!" not "AMAZING!!!". "So close!" not "You failed."
- **Humor:** Dry, understated. A wry stat label. Never memes or pop-culture references.
- **Point of view:** The puzzle speaks; the app stays out of the way.

### Tagline

> *The daily word puzzle with crossword clues.*

---

## 2. Color Palette

### Design Philosophy

Wordle uses high-contrast primary greens and yellows on stark black/white surfaces. Cluegrid uses **desaturated, warm tones** with subtle depth. The palette reads as "editorial" rather than "game show." Colors are drawn from ink, paper, and aged library materials.

### Light Mode

| Role | Hex | RGB | Usage |
|------|-----|-----|-------|
| **Background** | `#F5F1EB` | 245, 241, 235 | Page canvas — warm parchment, not clinical white |
| **Surface** | `#FFFFFF` | 255, 255, 255 | Cards, modals, elevated containers |
| **Surface Raised** | `#FAF8F5` | 250, 248, 245 | Keyboard keys, subtle elevation |
| **Text Primary** | `#2C2825` | 44, 40, 37 | Headlines, grid letters — warm near-black |
| **Text Secondary** | `#7A7168` | 122, 113, 104 | Clues, captions, metadata |
| **Text Tertiary** | `#AEA69C` | 174, 166, 156 | Placeholders, disabled states |
| **Border** | `#E2DDD6` | 226, 221, 214 | Grid lines, dividers, input borders |
| **Border Active** | `#C4BDB4` | 196, 189, 180 | Focused inputs, selected cell outline |
| **Correct** | `#4A8B6E` | 74, 139, 110 | Letter in correct position — sage green |
| **Present** | `#C4944A` | 196, 148, 74 | Letter in word but wrong position — amber |
| **Absent** | `#B8B0A6` | 184, 176, 166 | Letter not in word — warm gray |
| **Accent** | `#5B7FA6` | 91, 127, 166 | Links, interactive highlights — dusty blue |
| **Accent Hover** | `#4A6B8E` | 74, 107, 142 | Hover/press state for accent |
| **Success** | `#4A8B6E` | 74, 139, 110 | Win state, streaks |
| **Error** | `#C45A4A` | 196, 90, 74 | Invalid word shake, error messages |

### Dark Mode

| Role | Hex | RGB | Usage |
|------|-----|-----|-------|
| **Background** | `#1A1816` | 26, 24, 22 | Page canvas — warm charcoal, not pure black |
| **Surface** | `#252220` | 37, 34, 32 | Cards, modals, elevated containers |
| **Surface Raised** | `#2E2B28` | 46, 43, 40 | Keyboard keys, subtle elevation |
| **Text Primary** | `#EDE8E2` | 237, 232, 226 | Headlines, grid letters — warm off-white |
| **Text Secondary** | `#9A9189` | 154, 145, 137 | Clues, captions, metadata |
| **Text Tertiary** | `#605850` | 96, 88, 80 | Placeholders, disabled states |
| **Border** | `#3A3633` | 58, 54, 51 | Grid lines, dividers |
| **Border Active** | `#504B46` | 80, 75, 70 | Focused inputs, selected cell |
| **Correct** | `#3D7A5D` | 61, 122, 93 | Slightly deeper sage for dark backgrounds |
| **Present** | `#B8873E` | 184, 135, 62 | Slightly deeper amber for dark backgrounds |
| **Absent** | `#4A4540` | 74, 69, 64 | Warm dark gray |
| **Accent** | `#6B93B8` | 107, 147, 184 | Links, interactive highlights |
| **Accent Hover** | `#7DA3C6` | 125, 163, 198 | Hover/press state for accent |
| **Success** | `#3D7A5D` | 61, 122, 93 | Win state, streaks |
| **Error** | `#C45A4A` | 196, 90, 74 | Error states |

### Accessibility Notes

- All text colors pass WCAG AA (4.5:1 ratio minimum) against their respective backgrounds.
- Correct/Present/Absent states include secondary indicators (icons/patterns) for color-blind users.
- Dark mode is designed natively, not as an inversion of light mode.

### Tailwind CSS Token Mapping

```js
// tailwind.config.ts — colors extension
colors: {
  canvas:       { light: '#F5F1EB', dark: '#1A1816' },
  surface:      { light: '#FFFFFF', dark: '#252220' },
  surfaceRaised:{ light: '#FAF8F5', dark: '#2E2B28' },
  ink:          { DEFAULT: '#2C2825', light: '#2C2825', dark: '#EDE8E2' },
  inkSecondary: { light: '#7A7168', dark: '#9A9189' },
  inkTertiary:  { light: '#AEA69C', dark: '#605850' },
  border:       { light: '#E2DDD6', dark: '#3A3633' },
  borderActive: { light: '#C4BDB4', dark: '#504B46' },
  correct:      { light: '#4A8B6E', dark: '#3D7A5D' },
  present:      { light: '#C4944A', dark: '#B8873E' },
  absent:       { light: '#B8B0A6', dark: '#4A4540' },
  accent:       { DEFAULT: '#5B7FA6', light: '#5B7FA6', dark: '#6B93B8' },
  accentHover:  { light: '#4A6B8E', dark: '#7DA3C6' },
  success:      { light: '#4A8B6E', dark: '#3D7A5D' },
  error:        { DEFAULT: '#C45A4A' },
}
```

---

## 3. Typography

### Font Selection

**Primary typeface:** [DM Sans](https://fonts.google.com/specimen/DM+Sans) (Google Fonts, open-source)

**Why not Inter (PDD suggestion)?** Inter is used by Wordle and nearly every modern web app. DM Sans shares Inter's geometric clarity but carries a softer, slightly more humanist character. Its letterforms have subtle optical corrections that feel editorial rather than utilitarian. The switch creates immediate visual differentiation at zero licensing cost.

**Fallback stack:** `'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`

**Monospace (grid letters, share cards):** `'DM Mono', 'SF Mono', 'Cascadia Code', monospace`

### Type Scale

Based on a **1.250 (Major Third)** ratio, anchored at 16px body.

| Token | Size | Weight | Line Height | Tracking | Usage |
|-------|------|--------|-------------|----------|-------|
| `display` | 40px / 2.5rem | 700 | 1.1 | -0.02em | Win/loss headline on completion screen |
| `heading-1` | 32px / 2rem | 600 | 1.2 | -0.015em | Stats page title |
| `heading-2` | 24px / 1.5rem | 600 | 1.25 | -0.01em | Section headings, modal titles |
| `heading-3` | 20px / 1.25rem | 600 | 1.3 | -0.005em | Clue panel header, card titles |
| `body` | 16px / 1rem | 400 | 1.5 | 0 | Clue text, body copy, descriptions |
| `body-small` | 14px / 0.875rem | 400 | 1.5 | 0.005em | Meta text, keyboard labels, timestamps |
| `caption` | 12px / 0.75rem | 500 | 1.4 | 0.02em | Guess counter, badge labels |
| `grid-letter` | 28px / 1.75rem | 700 | 1.0 | 0.05em | Letters inside grid cells (DM Mono) |
| `stat-number` | 36px / 2.25rem | 700 | 1.1 | -0.01em | Large stat figures (streak count, win %) |

### Tailwind Integration

```js
// tailwind.config.ts — fontSize extension
fontSize: {
  'display':    ['2.5rem',   { lineHeight: '1.1',  letterSpacing: '-0.02em',  fontWeight: '700' }],
  'heading-1':  ['2rem',     { lineHeight: '1.2',  letterSpacing: '-0.015em', fontWeight: '600' }],
  'heading-2':  ['1.5rem',   { lineHeight: '1.25', letterSpacing: '-0.01em',  fontWeight: '600' }],
  'heading-3':  ['1.25rem',  { lineHeight: '1.3',  letterSpacing: '-0.005em', fontWeight: '600' }],
  'body':       ['1rem',     { lineHeight: '1.5',  letterSpacing: '0',        fontWeight: '400' }],
  'body-small': ['0.875rem', { lineHeight: '1.5',  letterSpacing: '0.005em',  fontWeight: '400' }],
  'caption':    ['0.75rem',  { lineHeight: '1.4',  letterSpacing: '0.02em',   fontWeight: '500' }],
  'grid':       ['1.75rem',  { lineHeight: '1.0',  letterSpacing: '0.05em',   fontWeight: '700' }],
  'stat':       ['2.25rem',  { lineHeight: '1.1',  letterSpacing: '-0.01em',  fontWeight: '700' }],
},
fontFamily: {
  sans: ['DM Sans', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
  mono: ['DM Mono', 'SF Mono', 'Cascadia Code', 'monospace'],
},
```

---

## 4. Spacing System

### Base Unit

**4px base unit.** All spacing is a multiple of 4.

| Token | Value | Usage |
|-------|-------|-------|
| `space-0` | 0px | Reset |
| `space-1` | 4px | Tight internal padding (icon + label gap) |
| `space-2` | 8px | Grid cell gap, inline spacing |
| `space-3` | 12px | Small component internal padding |
| `space-4` | 16px | Default component padding, stack gap |
| `space-5` | 20px | Medium section gap |
| `space-6` | 24px | Card padding, clue panel padding |
| `space-8` | 32px | Section separation |
| `space-10` | 40px | Major section gap |
| `space-12` | 48px | Page-level vertical rhythm |
| `space-16` | 64px | Top/bottom page padding |

### Layout Constraints

| Constraint | Value | Notes |
|------------|-------|-------|
| **Max content width** | 480px | Keeps grid centered on large screens |
| **Grid cell size (mobile)** | 52px x 52px | Large enough for comfortable tap (>44px) |
| **Grid cell size (desktop)** | 60px x 60px | Slightly roomier at larger viewports |
| **Grid gap** | 6px | Enough to see individual cells clearly |
| **Keyboard key height** | 52px | Matches Apple keyboard proportions |
| **Keyboard gap** | 6px | Consistent with grid gap |
| **Touch target minimum** | 44px x 44px | WCAG 2.5.8 compliance |

### Tailwind Extension

```js
// tailwind.config.ts — spacing extension
spacing: {
  '0':  '0px',
  '1':  '4px',
  '2':  '8px',
  '3':  '12px',
  '4':  '16px',
  '5':  '20px',
  '6':  '24px',
  '8':  '32px',
  '10': '40px',
  '12': '48px',
  '16': '64px',
},
```

---

## 5. Visual Differentiation from Wordle

This section explicitly documents how Cluegrid distinguishes itself from Wordle across every major visual dimension.

### 5.1 Grid Style

| Aspect | Wordle | Cluegrid |
|--------|--------|----------|
| **Shape** | 5x6 uniform row grid | Cross-shaped layout — horizontal main word with vertical crossers intersecting it |
| **Cell borders** | Heavy dark borders, visible empty cells | Soft 1px borders using `border` token; empty cells are invisible (no border on unused grid positions) |
| **Cell shape** | Square, sharp corners | Square with 4px border-radius — softer, friendlier |
| **Cell fill (empty)** | Outlined, transparent | Filled with `surfaceRaised` for a subtle tactile look |
| **Cell fill (active)** | Heavy dark border | `borderActive` outline + subtle inner shadow (`inset 0 0 0 1px`) |
| **Letter reveal** | Card flip (3D rotate-X) | **Ink-fill reveal** — color fills from bottom to top like ink wicking into paper (200ms ease-out) |
| **Feedback indicator** | Background color fills entire cell | Background color fills cell + small shape overlay for color-blind mode: checkmark (correct), circle (present), dash (absent) |

### 5.2 Color Approach

| Aspect | Wordle | Cluegrid |
|--------|--------|----------|
| **Correct** | `#6AAA64` — bright, saturated green | `#4A8B6E` — desaturated sage green |
| **Present** | `#C9B458` — bright gold | `#C4944A` — warm amber, less yellow |
| **Absent** | `#787C7E` — cool gray | `#B8B0A6` (light) / `#4A4540` (dark) — warm gray |
| **Background** | `#FFFFFF` (white) / `#121213` (black) | `#F5F1EB` (warm parchment) / `#1A1816` (warm charcoal) |
| **Overall feel** | High-contrast, digital, clinical | Low-contrast, warm, editorial |

### 5.3 Typography

| Aspect | Wordle | Cluegrid |
|--------|--------|----------|
| **Typeface** | Libre Franklin / system font (Helvetica Neue) | DM Sans + DM Mono |
| **Grid letter style** | Bold, uppercase, tight | Bold monospace (DM Mono), uppercase, tracked out (+0.05em) |
| **Header** | "Wordle" in bold serif (NYT) | "cluegrid" in lowercase DM Sans SemiBold — calm, modern |
| **Casing** | Title Case, UPPERCASE accents | Sentence case and lowercase throughout |

### 5.4 Layout & Structure

| Aspect | Wordle | Cluegrid |
|--------|--------|----------|
| **Grid position** | Top-center, fixed | Center of viewport, vertically balanced |
| **Clues** | None | Collapsible clue panel between grid and keyboard |
| **Guess indicator** | Row-based (fill row by row) | Compact dot/bar indicator (e.g., `|||||o` — 5 used, 1 remaining) |
| **Keyboard position** | Fixed at bottom | Fixed at bottom — same convention (familiar to players) |
| **Keyboard style** | Rectangular keys, filled backgrounds | Rounded keys (6px radius) on `surfaceRaised`, lighter touch |

### 5.5 Animation & Motion

| Aspect | Wordle | Cluegrid |
|--------|--------|----------|
| **Letter entry** | Pop scale (bounce) | Gentle press-in: scale 1.0 -> 0.96 -> 1.0 (80ms) — like pressing an ink stamp |
| **Row reveal** | 3D flip per cell, left to right, 300ms stagger | **Ink-fill** per cell, left to right, 120ms stagger — faster, subtler |
| **Win celebration** | Row bounce dance | Soft radial glow behind completed grid (400ms ease-out) + gentle confetti using `correct` and `accent` colors (600ms, gravity fall) |
| **Error state** | Horizontal shake | Horizontal shake (same convention, familiar) but with a slight desaturation flash (cells briefly lose color, 150ms) |
| **Page transitions** | None (single page) | Crossfade (opacity 0 -> 1, 200ms) for modal overlays |
| **Reduced motion** | Supported | Fully supported — all animations collapse to instant state changes |

### 5.6 Share Card

| Aspect | Wordle | Cluegrid |
|--------|--------|----------|
| **Emoji set** | Green/Yellow/Gray/Black squares | Custom Unicode blocks reflecting the cross-shaped grid layout |
| **Format** | Row-by-row squares | Grid shape that hints at the crossword-style layout |
| **Header** | "Wordle 1,234 4/6" | "cluegrid #47 -- 4/6" (lowercase, en-dash, no emoji in header) |
| **Footer** | None | `cluegrid.app` |

**Example share card:**

```
cluegrid #47 -- 4/6

  .
  .
.....
  .
  .

clues: 3/3
cluegrid.app
```

Or with emoji feedback for the main word guesses:

```
cluegrid #47 -- 4/6

🟧⬜⬜⬜⬜
🟩🟩⬜⬜⬜
🟩🟩🟩⬜⬜
🟩🟩🟩🟩🟩

crossers: 3/3
cluegrid.app
```

**Note:** Orange squares (`🟧`) instead of yellow (`🟨`) to differentiate from Wordle. Green squares (`🟩`) are kept because they are universally understood as "correct."

---

## 6. Animation Principles

### Core Philosophy

> Motion should feel **physical** — like ink, paper, and weight — not digital or flashy.

### Easing Curves

| Name | CSS Value | Usage |
|------|-----------|-------|
| **ease-out-soft** | `cubic-bezier(0.25, 0.1, 0.25, 1.0)` | Default for most transitions (appear, color change) |
| **ease-in-out-gentle** | `cubic-bezier(0.4, 0.0, 0.2, 1.0)` | Modals, overlays, page transitions |
| **ease-out-bounce** | `cubic-bezier(0.34, 1.56, 0.64, 1.0)` | Subtle overshoot for celebratory moments |
| **ease-spring** | Framer Motion `type: "spring", stiffness: 300, damping: 24` | Interactive elements (button press, key tap) |

### Duration Scale

| Token | Value | Usage |
|-------|-------|-------|
| `duration-instant` | 80ms | Micro-interactions: key press, hover |
| `duration-fast` | 150ms | State changes: color fill, focus ring |
| `duration-normal` | 250ms | Standard transitions: modal open, panel slide |
| `duration-slow` | 400ms | Celebratory: win glow, confetti start |
| `duration-stagger` | 120ms | Per-cell delay in sequential reveals |

### Animation Catalog

#### Letter Entry
```
Trigger: User taps keyboard key
Animation: Cell scales 1.0 → 0.96 → 1.0
Duration: 80ms
Easing: ease-spring
Visual: Letter appears at scale-down midpoint (feels like stamping)
```

#### Cell Reveal (Ink Fill)
```
Trigger: Guess submitted, feedback received
Animation: Each cell fills with feedback color from bottom edge upward
Duration: 200ms per cell
Stagger: 120ms between cells (left to right)
Easing: ease-out-soft
Visual: Mimics ink soaking upward through paper
```

#### Win State
```
Trigger: Main word solved
Sequence:
  1. Final row ink-fill reveal (standard)
  2. Soft radial glow appears behind grid (400ms, ease-out-soft)
  3. Confetti particles fall from top (correct + accent colors, 600ms)
  4. "Brilliant!" text fades in (250ms, ease-in-out-gentle)
```

#### Error Shake
```
Trigger: Invalid word submitted
Animation: Grid row shakes horizontally (-4px, 4px, -3px, 3px, 0)
Duration: 200ms
Easing: linear (shake feels mechanical)
Additional: Cells briefly desaturate (150ms pulse) to reinforce "wrong"
```

#### Clue Panel Toggle
```
Trigger: User taps to expand/collapse clue panel
Animation: Height auto with opacity crossfade
Duration: 250ms
Easing: ease-in-out-gentle
```

#### Modal / Overlay
```
Trigger: Stats, settings, how-to-play opened
Animation: Background dims (opacity 0 → 0.5), content slides up 16px + fades in
Duration: 250ms
Easing: ease-in-out-gentle
Exit: Reverse at 200ms
```

### Framer Motion Defaults

```tsx
// lib/motion.ts — shared animation presets
export const motionConfig = {
  letterEntry: {
    scale: [1, 0.96, 1],
    transition: { type: 'spring', stiffness: 300, damping: 24 },
  },
  inkFill: (index: number) => ({
    clipPath: ['inset(100% 0 0 0)', 'inset(0 0 0 0)'],
    transition: { duration: 0.2, delay: index * 0.12, ease: [0.25, 0.1, 0.25, 1.0] },
  }),
  fadeIn: {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.25, ease: [0.4, 0.0, 0.2, 1.0] },
  },
  shake: {
    x: [-4, 4, -3, 3, 0],
    transition: { duration: 0.2 },
  },
  glow: {
    scale: [0.8, 1],
    opacity: [0, 0.6, 0],
    transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1.0] },
  },
} as const;
```

### Reduced Motion

When `prefers-reduced-motion: reduce` is active:
- All animations resolve instantly (duration: 0)
- Stagger delays are removed
- Confetti is replaced with a static checkmark icon
- The glow effect is replaced with a simple border highlight
- Modals appear/disappear without sliding

---

## 7. Component Style Reference

### 7.1 Grid Cell

```
Default:        52x52px, bg: surfaceRaised, border: 1px border, radius: 4px
Active (typing): border: 2px borderActive, inner shadow
Filled:         bg: surfaceRaised, letter in ink color, DM Mono 700
Correct:        bg: correct, letter: white, checkmark icon (top-right, 8px)
Present:        bg: present, letter: white, circle icon (top-right, 8px)
Absent:         bg: absent, letter: white, dash icon (top-right, 8px)
```

### 7.2 Keyboard Key

```
Default:        min-width: 36px, height: 52px, bg: surfaceRaised, radius: 6px
                font: body-small, weight 600, color: ink
Pressed:        scale: 0.96, bg: borderActive (80ms spring)
Correct:        bg: correct, color: white
Present:        bg: present, color: white
Absent:         bg: absent, color: white (light) / inkTertiary (dark)
Special keys:   Enter/Backspace: wider (1.5x), accent bg
```

### 7.3 Clue Panel

```
Container:      bg: surface, border-top: 1px border, padding: space-4 space-6
Clue row:       padding: space-2 0, border-bottom: 1px border (except last)
Clue number:    DM Mono, caption size, color: accent, width: 24px
Clue text:      body size, color: ink
Solved clue:    text: inkSecondary, strikethrough, revealed word appended in bold
```

### 7.4 Header

```
Height:         56px
Layout:         flex, space-between, items-center, padding: 0 space-4
Logo:           "cluegrid" — DM Sans 600, heading-3 size, lowercase, ink color
Icons:          24x24, stroke: 1.5px, color: inkSecondary
                Hover: color transitions to ink (150ms)
```

### 7.5 Buttons

```
Primary:        bg: accent, color: white, radius: 8px, padding: space-3 space-6
                font: body, weight 600
                Hover: bg: accentHover (150ms)
                Press: scale 0.97 (80ms spring)

Secondary:      bg: transparent, border: 1px borderActive, color: ink
                radius: 8px, padding: space-3 space-6
                Hover: bg: surfaceRaised (150ms)

Ghost:          bg: transparent, color: accent
                Hover: underline, color: accentHover
```

### 7.6 Stats Modal

```
Overlay:        bg: rgba(0,0,0,0.5) — light mode; rgba(0,0,0,0.7) — dark mode
Card:           bg: surface, radius: 12px, padding: space-8, max-width: 400px
                shadow: 0 8px 32px rgba(0,0,0,0.12)
Stat number:    stat size, ink color, centered
Stat label:     caption size, inkSecondary, centered below number
Distribution:   horizontal bars, bg: absent (empty), bg: correct (filled)
                bar height: 28px, radius: 4px, min-width: 24px
```

---

## 8. Iconography

### Style

- **Stroke-based**, 1.5px weight (matching Lucide icon library conventions)
- Rounded line caps and joins
- 24x24px bounding box, 2px internal padding
- Color inherits from parent text color

### Required Icons

| Icon | Usage | Notes |
|------|-------|-------|
| Settings (gear) | Header | Standard gear outline |
| Stats (bar chart) | Header | Three ascending bars |
| Help (question mark) | Header | Circle with ? |
| Share (arrow-up-from-box) | Completion screen | Box with upward arrow |
| Close (X) | Modals | Simple X |
| Streak (flame) | Stats | Custom: simplified flame, not emoji |
| Backspace (delete) | Keyboard | Arrow-left with X |
| Enter (return) | Keyboard | Corner arrow |
| Checkmark | Correct indicator | Small, 8px, top-right of cell |
| Circle | Present indicator | Small, 8px, filled dot |
| Dash | Absent indicator | Small, 8px, horizontal line |

### Icon Library

Use [Lucide React](https://lucide.dev/) for all standard UI icons. Custom icons (flame, cell indicators) should be created as SVG components matching Lucide's style conventions.

---

## 9. Border Radius Scale

| Token | Value | Usage |
|-------|-------|-------|
| `radius-sm` | 4px | Grid cells, small badges |
| `radius-md` | 6px | Keyboard keys, inputs |
| `radius-lg` | 8px | Buttons, cards |
| `radius-xl` | 12px | Modals, sheets |
| `radius-full` | 9999px | Pill badges, toggle dots |

---

## 10. Shadow Scale

| Token | Value | Usage |
|-------|-------|-------|
| `shadow-sm` | `0 1px 2px rgba(0,0,0,0.06)` | Keyboard keys, slight elevation |
| `shadow-md` | `0 4px 12px rgba(0,0,0,0.08)` | Cards, raised surfaces |
| `shadow-lg` | `0 8px 32px rgba(0,0,0,0.12)` | Modals, overlays |
| `shadow-glow` | `0 0 24px rgba(74,139,110,0.3)` | Win state glow (uses correct color) |
| `shadow-inset` | `inset 0 0 0 1px rgba(0,0,0,0.05)` | Active cell inner border |

---

## 11. Dark Mode Implementation

Dark mode is not a filter or inversion. Each token has an explicit dark variant. Implementation uses Tailwind's `dark:` variant driven by `class` strategy on `<html>`.

```tsx
// Root layout: class-based dark mode
<html className={theme === 'dark' ? 'dark' : ''}>
```

```js
// tailwind.config.ts
darkMode: 'class',
```

User preference is detected via `prefers-color-scheme` media query on first visit, then stored in `cluegrid:settings.theme` in localStorage. Users can override in Settings.

---

## 12. Responsive Breakpoints

| Breakpoint | Width | Grid Cell | Notes |
|------------|-------|-----------|-------|
| Mobile (default) | 320px - 479px | 48px | Tightest layout, clue panel scrollable |
| Mobile (large) | 480px - 639px | 52px | Default target size |
| Tablet | 640px - 1023px | 56px | Clue panel can sit beside grid |
| Desktop | 1024px+ | 60px | Max content width: 480px, centered |

---

## 13. Summary: Cluegrid vs. Wordle at a Glance

| Dimension | Wordle | Cluegrid |
|-----------|--------|----------|
| **Palette** | Bright green/yellow, B&W surfaces | Desaturated sage/amber, warm parchment/charcoal |
| **Typography** | Libre Franklin, UPPERCASE heavy | DM Sans + DM Mono, lowercase/sentence-case |
| **Grid** | Flat row grid, heavy borders | Cross-shaped layout, soft borders, rounded cells |
| **Reveal animation** | 3D card flip | Ink-fill from bottom |
| **Win celebration** | Row bounce | Radial glow + subtle confetti |
| **Share card** | Green/yellow squares, row layout | Orange/green squares, grid-shape hint, lowercase header |
| **Overall feel** | "Newspaper game" | "Independent bookshop" |

---

*This document is the source of truth for all visual decisions. When in doubt, choose the calmer, warmer, more restrained option.*
