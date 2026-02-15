# Cluegrid - Content Pipeline & Admin Tooling

## 1. Content Strategy Overview

### 1.1 Content Requirements

| Content Type | MVP Quantity | Ongoing Need |
|--------------|--------------|--------------|
| Daily puzzles | 90 (3 months) | 7/week |
| Word dictionary | 10,000+ words | Occasional additions |
| Clues per puzzle | 2-4 | Part of puzzle creation |

### 1.2 Content Quality Principles

1. **No obscure words** - Main words should be known by 90%+ of English speakers
2. **Fair clues** - Solvable without specialized knowledge
3. **No offensive content** - Words and clues screened for sensitivity
4. **Consistent difficulty** - Monday easier, Friday harder (future)
5. **Cultural awareness** - Avoid US-centric assumptions

---

## 2. Word Dictionary

### 2.1 Word Sources

**Primary Source:** Curated subset of:
- SOWPODS/TWL (Scrabble dictionaries)
- Wordle's word lists
- Frequency-ranked English word lists

**Filtering Criteria:**
- 3-7 letters
- No proper nouns (for answers)
- No offensive/slur words
- No overly obscure words

### 2.2 Word Categories

```typescript
interface WordEntry {
  word: string;
  isValidGuess: boolean;  // Can player guess this?
  isValidAnswer: boolean; // Can this be a puzzle answer?
  frequencyRank: number;  // Lower = more common
  categories: string[];   // ['common', 'nature', 'tech', etc.]
}
```

**Answer words:** ~3,000 (common, recognizable)
**Guess words:** ~10,000 (includes more obscure valid words)

### 2.3 Word Curation Process

1. Import base dictionary (10K+ words)
2. Run through automated filters:
   - Profanity filter
   - Frequency filter (remove <10K rank)
   - Length filter (3-7 letters)
3. Manual review for edge cases
4. Flag controversial/sensitive words
5. Categorize by topic (optional)

---

## 3. Puzzle Creation

### 3.1 Puzzle Structure

```
Main word: 5 letters
Crossers: 2-4 words (3-5 letters each)
Clues: 1 per crosser
Grid: Dynamically sized to fit words
```

### 3.2 Creation Workflow

```
┌──────────────────────────────────────────────────────────┐
│  1. WORD SELECTION                                        │
│  ┌─────────────┐                                          │
│  │ Pick main   │ → Validate it's answer-worthy           │
│  │ word        │                                          │
│  └──────┬──────┘                                          │
│         ▼                                                 │
│  ┌─────────────┐                                          │
│  │ Find valid  │ → System suggests compatible crossers   │
│  │ crossers    │ → Manual selection                      │
│  └──────┬──────┘                                          │
│         ▼                                                 │
├──────────────────────────────────────────────────────────┤
│  2. CLUE WRITING                                          │
│  ┌─────────────┐                                          │
│  │ Write clue  │ → Each crosser needs one clue          │
│  │ for each    │ → Follow clue guidelines               │
│  │ crosser     │                                          │
│  └──────┬──────┘                                          │
│         ▼                                                 │
├──────────────────────────────────────────────────────────┤
│  3. PREVIEW & TEST                                        │
│  ┌─────────────┐                                          │
│  │ Preview     │ → See grid as player would             │
│  │ puzzle      │ → Play through as test                  │
│  └──────┬──────┘                                          │
│         ▼                                                 │
├──────────────────────────────────────────────────────────┤
│  4. SCHEDULE                                              │
│  ┌─────────────┐                                          │
│  │ Assign date │ → Pick available date                   │
│  │ & publish   │ → Review queue or direct publish       │
│  └─────────────┘                                          │
└──────────────────────────────────────────────────────────┘
```

### 3.3 Crosser Generation Algorithm

```typescript
// lib/content/crosser-finder.ts

interface CrosserCandidate {
  word: string;
  intersectionLetter: string;
  intersectionIndex: number; // Position in crosser
  mainWordPosition: number;  // Position in main word
}

export function findCrosserCandidates(
  mainWord: string,
  dictionary: string[],
  constraints?: {
    minLength?: number;
    maxLength?: number;
    excludeWords?: string[];
  }
): CrosserCandidate[] {
  const candidates: CrosserCandidate[] = [];
  const { minLength = 3, maxLength = 6, excludeWords = [] } = constraints ?? {};

  // For each letter in main word
  for (let pos = 0; pos < mainWord.length; pos++) {
    const letter = mainWord[pos];

    // Find words containing this letter
    for (const word of dictionary) {
      if (word.length < minLength || word.length > maxLength) continue;
      if (excludeWords.includes(word)) continue;
      if (word === mainWord) continue;

      // Find all positions where letter appears
      for (let i = 0; i < word.length; i++) {
        if (word[i] === letter) {
          candidates.push({
            word,
            intersectionLetter: letter,
            intersectionIndex: i,
            mainWordPosition: pos,
          });
        }
      }
    }
  }

  return candidates;
}

// Score candidates by quality
export function scoreCrossers(candidates: CrosserCandidate[]): CrosserCandidate[] {
  return candidates
    .map(c => ({
      ...c,
      score: calculateScore(c),
    }))
    .sort((a, b) => b.score - a.score);
}

function calculateScore(candidate: CrosserCandidate): number {
  let score = 100;

  // Prefer intersection in middle of word
  const middleDistance = Math.abs(
    candidate.intersectionIndex - candidate.word.length / 2
  );
  score -= middleDistance * 5;

  // Prefer common letters at intersection
  const commonLetters = 'ETAOINSHRDLU';
  if (commonLetters.includes(candidate.intersectionLetter)) {
    score += 10;
  }

  return score;
}
```

---

## 4. Admin Interface

### 4.1 Admin Routes

```
/admin
├── /dashboard          # Overview stats
├── /puzzles            # Puzzle list & calendar
│   ├── /new            # Create puzzle
│   └── /[id]           # Edit puzzle
├── /words              # Dictionary management
└── /settings           # Admin settings
```

### 4.2 Admin UI Components

#### Dashboard

```tsx
// app/admin/dashboard/page.tsx

export default function AdminDashboard() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Content Dashboard</h1>

      <div className="grid grid-cols-3 gap-4">
        <StatCard
          title="Scheduled Puzzles"
          value={45}
          subtitle="Next 45 days covered"
        />
        <StatCard
          title="Draft Puzzles"
          value={12}
          subtitle="Awaiting review"
        />
        <StatCard
          title="Dictionary Size"
          value="10,234"
          subtitle="5,123 answer-worthy"
        />
      </div>

      <section>
        <h2 className="text-lg font-semibold mb-4">Upcoming Week</h2>
        <PuzzleCalendar view="week" />
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-4">Content Gaps</h2>
        <GapWarnings />
      </section>
    </div>
  );
}
```

#### Puzzle Creator

```tsx
// app/admin/puzzles/new/page.tsx

interface PuzzleFormState {
  date: string;
  mainWord: string;
  crossers: CrosserInput[];
  gridPreview: GridCell[][];
}

export default function NewPuzzlePage() {
  const [state, setState] = useState<PuzzleFormState>(initialState);

  return (
    <div className="grid grid-cols-2 gap-6 p-6">
      {/* Left: Form */}
      <div className="space-y-6">
        <DatePicker
          value={state.date}
          onChange={(date) => setState(s => ({ ...s, date }))}
          unavailableDates={scheduledDates}
        />

        <MainWordInput
          value={state.mainWord}
          onChange={(word) => handleMainWordChange(word)}
          validation={wordValidation}
        />

        <CrosserManager
          mainWord={state.mainWord}
          crossers={state.crossers}
          onAdd={handleAddCrosser}
          onRemove={handleRemoveCrosser}
          onUpdate={handleUpdateCrosser}
          suggestions={crosserSuggestions}
        />

        <div className="flex gap-4">
          <Button variant="secondary" onClick={saveDraft}>
            Save Draft
          </Button>
          <Button onClick={publishPuzzle}>
            Schedule Puzzle
          </Button>
        </div>
      </div>

      {/* Right: Preview */}
      <div className="sticky top-6">
        <h3 className="font-semibold mb-4">Preview</h3>
        <PuzzlePreview
          mainWord={state.mainWord}
          crossers={state.crossers}
          mode="preview"
        />

        <div className="mt-4">
          <Button variant="ghost" onClick={testPlay}>
            Test Play This Puzzle
          </Button>
        </div>
      </div>
    </div>
  );
}
```

#### Crosser Manager Component

```tsx
// components/admin/CrosserManager.tsx

interface CrosserManagerProps {
  mainWord: string;
  crossers: CrosserInput[];
  suggestions: CrosserSuggestion[];
  onAdd: (crosser: CrosserInput) => void;
  onRemove: (index: number) => void;
  onUpdate: (index: number, crosser: CrosserInput) => void;
}

function CrosserManager({
  mainWord,
  crossers,
  suggestions,
  onAdd,
  onRemove,
  onUpdate,
}: CrosserManagerProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Crossing Words ({crossers.length}/4)</h3>
        <Button
          size="sm"
          onClick={() => setShowSuggestions(true)}
          disabled={crossers.length >= 4}
        >
          + Add Crosser
        </Button>
      </div>

      {crossers.map((crosser, index) => (
        <CrosserCard
          key={index}
          crosser={crosser}
          mainWord={mainWord}
          onUpdate={(c) => onUpdate(index, c)}
          onRemove={() => onRemove(index)}
        />
      ))}

      {showSuggestions && (
        <SuggestionModal
          suggestions={suggestions}
          onSelect={(word, position) => {
            onAdd({
              word,
              position,
              clue: '',
              direction: 'down',
            });
            setShowSuggestions(false);
          }}
          onClose={() => setShowSuggestions(false)}
        />
      )}
    </div>
  );
}

function CrosserCard({ crosser, mainWord, onUpdate, onRemove }) {
  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="font-mono text-lg">{crosser.word}</span>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">
            intersects at {mainWord[crosser.position.mainWordIndex]}
          </span>
          <Button size="sm" variant="ghost" onClick={onRemove}>
            Remove
          </Button>
        </div>
      </div>

      <div>
        <Label htmlFor={`clue-${crosser.word}`}>Clue</Label>
        <Textarea
          id={`clue-${crosser.word}`}
          value={crosser.clue}
          onChange={(e) => onUpdate({ ...crosser, clue: e.target.value })}
          placeholder="Enter a clue for this word..."
          rows={2}
        />
        <ClueQualityIndicator clue={crosser.clue} />
      </div>
    </div>
  );
}
```

### 4.3 Admin Authentication

Simple password protection for MVP:

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/admin')) {
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !isValidAuth(authHeader)) {
      return new NextResponse('Unauthorized', {
        status: 401,
        headers: { 'WWW-Authenticate': 'Basic realm="Admin"' },
      });
    }
  }

  return NextResponse.next();
}

function isValidAuth(header: string): boolean {
  const [scheme, credentials] = header.split(' ');
  if (scheme !== 'Basic') return false;

  const decoded = Buffer.from(credentials, 'base64').toString();
  const [username, password] = decoded.split(':');

  return (
    username === process.env.ADMIN_USERNAME &&
    password === process.env.ADMIN_PASSWORD
  );
}
```

---

## 5. Clue Guidelines

### 5.1 Clue Quality Checklist

**Good clues:**
- [ ] One clear answer
- [ ] No specialized knowledge required
- [ ] Grammatically correct
- [ ] Appropriate length (5-50 words)
- [ ] Not too easy (definition) or too hard (trivia)

**Avoid:**
- Obscure cultural references
- US-centric assumptions
- Proper nouns without context
- Puns that don't translate
- Multiple valid interpretations

### 5.2 Clue Examples

| Word | Bad Clue | Good Clue |
|------|----------|-----------|
| CRANE | A machine or bird | Long-necked wading bird |
| BEACH | Sandy place | Where waves meet sand |
| PLANT | Living thing | It grows from a seed |
| STEAM | H2O gas | What rises from hot coffee |

### 5.3 Automated Clue Quality Check

```typescript
// lib/content/clue-validator.ts

interface ClueValidation {
  isValid: boolean;
  issues: string[];
  score: number; // 0-100
}

export function validateClue(clue: string, word: string): ClueValidation {
  const issues: string[] = [];
  let score = 100;

  // Length checks
  if (clue.length < 10) {
    issues.push('Clue is too short');
    score -= 20;
  }
  if (clue.length > 100) {
    issues.push('Clue is too long');
    score -= 10;
  }

  // Contains the answer
  if (clue.toLowerCase().includes(word.toLowerCase())) {
    issues.push('Clue contains the answer');
    score -= 50;
  }

  // Contains close variant of answer
  if (containsStemOfWord(clue, word)) {
    issues.push('Clue contains variant of answer');
    score -= 30;
  }

  // Grammar check (basic)
  if (!clue.endsWith('.') && !clue.endsWith('?')) {
    issues.push('Clue should end with punctuation');
    score -= 5;
  }

  return {
    isValid: issues.length === 0,
    issues,
    score: Math.max(0, score),
  };
}
```

---

## 6. Content Calendar

### 6.1 Calendar View

```tsx
// components/admin/PuzzleCalendar.tsx

interface CalendarDay {
  date: string;
  puzzle?: {
    id: string;
    mainWord: string;
    status: 'draft' | 'scheduled' | 'published';
  };
}

function PuzzleCalendar({ view, month, year }) {
  const days = useCalendarDays(month, year);

  return (
    <div className="grid grid-cols-7 gap-1">
      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
        <div key={day} className="text-center text-sm font-medium py-2">
          {day}
        </div>
      ))}

      {days.map((day) => (
        <CalendarCell
          key={day.date}
          day={day}
          isToday={day.date === today}
          isPast={day.date < today}
          onClick={() => handleDayClick(day)}
        />
      ))}
    </div>
  );
}

function CalendarCell({ day, isToday, isPast, onClick }) {
  const statusColors = {
    draft: 'bg-yellow-100 border-yellow-300',
    scheduled: 'bg-green-100 border-green-300',
    published: 'bg-blue-100 border-blue-300',
    empty: isPast ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200',
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        'p-2 border rounded-md min-h-[80px] text-left',
        statusColors[day.puzzle?.status ?? 'empty'],
        isToday && 'ring-2 ring-blue-500'
      )}
    >
      <div className="text-sm font-medium">{format(day.date, 'd')}</div>
      {day.puzzle && (
        <div className="mt-1 text-xs font-mono">{day.puzzle.mainWord}</div>
      )}
    </button>
  );
}
```

### 6.2 Gap Detection

```typescript
// lib/content/gap-detection.ts

interface ContentGap {
  startDate: string;
  endDate: string;
  days: number;
  severity: 'warning' | 'critical';
}

export async function detectContentGaps(): Promise<ContentGap[]> {
  const scheduledDates = await getScheduledPuzzleDates();
  const today = new Date();
  const checkUntil = addDays(today, 90); // Check 90 days ahead

  const gaps: ContentGap[] = [];
  let currentGapStart: Date | null = null;

  for (let date = today; date <= checkUntil; date = addDays(date, 1)) {
    const dateStr = formatDate(date);
    const hasContent = scheduledDates.includes(dateStr);

    if (!hasContent && !currentGapStart) {
      currentGapStart = date;
    } else if (hasContent && currentGapStart) {
      const gapDays = differenceInDays(date, currentGapStart);
      gaps.push({
        startDate: formatDate(currentGapStart),
        endDate: formatDate(subDays(date, 1)),
        days: gapDays,
        severity: gapDays >= 3 ? 'critical' : 'warning',
      });
      currentGapStart = null;
    }
  }

  return gaps;
}
```

---

## 7. Import/Export

### 7.1 Bulk Import Format

CSV format for bulk puzzle import:

```csv
date,main_word,crosser1_word,crosser1_clue,crosser1_position,crosser2_word,crosser2_clue,crosser2_position
2024-01-15,CRANE,CRISP,"Potato chip texture",0,PEACE,"Opposite of war",4
2024-01-16,BEACH,CABIN,"Small wooden house",2,TORCH,"Fire on a stick",4
```

### 7.2 Import Script

```typescript
// scripts/import-puzzles.ts

import { parse } from 'csv-parse/sync';
import { readFileSync } from 'fs';
import { supabase } from '../lib/db/client';

async function importPuzzles(csvPath: string) {
  const content = readFileSync(csvPath, 'utf-8');
  const records = parse(content, { columns: true });

  for (const record of records) {
    // Validate
    const mainWordValid = await isValidAnswerWord(record.main_word);
    if (!mainWordValid) {
      console.warn(`Skipping ${record.date}: invalid main word`);
      continue;
    }

    // Create puzzle
    const { data: puzzle, error } = await supabase
      .from('puzzles')
      .insert({
        puzzle_date: record.date,
        main_word: record.main_word.toUpperCase(),
        status: 'scheduled',
      })
      .select()
      .single();

    if (error) {
      console.error(`Error creating puzzle: ${error.message}`);
      continue;
    }

    // Add crossers
    const crossers = extractCrossers(record);
    for (const crosser of crossers) {
      await supabase.from('crossers').insert({
        puzzle_id: puzzle.id,
        ...crosser,
      });
    }

    console.log(`Imported: ${record.date} - ${record.main_word}`);
  }
}
```

---

## 8. Content Quality Automation

### 8.1 Pre-Publish Checks

```typescript
// lib/content/pre-publish-checks.ts

interface PublishCheck {
  name: string;
  passed: boolean;
  message?: string;
}

export async function runPrePublishChecks(puzzleId: string): Promise<PublishCheck[]> {
  const puzzle = await getPuzzleWithCrossers(puzzleId);
  const checks: PublishCheck[] = [];

  // Check 1: Main word is valid
  checks.push({
    name: 'Valid main word',
    passed: await isValidAnswerWord(puzzle.main_word),
    message: puzzle.main_word,
  });

  // Check 2: All crossers are valid
  for (const crosser of puzzle.crossers) {
    checks.push({
      name: `Valid crosser: ${crosser.word}`,
      passed: await isValidAnswerWord(crosser.word),
    });
  }

  // Check 3: All clues present
  const missingClues = puzzle.crossers.filter(c => !c.clue || c.clue.length < 5);
  checks.push({
    name: 'All clues present',
    passed: missingClues.length === 0,
    message: missingClues.length > 0
      ? `Missing clues for: ${missingClues.map(c => c.word).join(', ')}`
      : undefined,
  });

  // Check 4: Grid is valid (words actually intersect correctly)
  const gridValid = validateGridLayout(puzzle);
  checks.push({
    name: 'Valid grid layout',
    passed: gridValid.valid,
    message: gridValid.error,
  });

  // Check 5: Date not already taken
  const dateAvailable = await isDateAvailable(puzzle.puzzle_date, puzzle.id);
  checks.push({
    name: 'Date available',
    passed: dateAvailable,
    message: !dateAvailable ? 'Another puzzle scheduled for this date' : undefined,
  });

  return checks;
}
```

### 8.2 Difficulty Estimation

```typescript
// lib/content/difficulty.ts

interface DifficultyFactors {
  mainWordFrequency: number;   // 1-10 (10 = common)
  crosserAvgFrequency: number; // 1-10
  clueComplexity: number;      // 1-10 (10 = easy clues)
  crosserCount: number;        // More = easier
}

export function estimateDifficulty(puzzle: PuzzleWithCrossers): number {
  const factors = calculateFactors(puzzle);

  // Weighted formula
  const difficulty =
    (10 - factors.mainWordFrequency) * 0.3 +
    (10 - factors.crosserAvgFrequency) * 0.2 +
    (10 - factors.clueComplexity) * 0.3 +
    (5 - Math.min(factors.crosserCount, 5)) * 0.2;

  // Normalize to 1-5 scale
  return Math.round(Math.min(5, Math.max(1, difficulty / 2)));
}
```
