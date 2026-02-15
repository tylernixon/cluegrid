# Cluegrid - Data Models & APIs

## 1. Database Schema

### 1.1 Entity Relationship Diagram

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│   puzzles   │──────<│  crossers   │       │    words    │
└─────────────┘       └─────────────┘       └─────────────┘
       │
       │
       ▼
┌─────────────┐
│puzzle_stats │
└─────────────┘
```

### 1.2 Table Definitions

#### puzzles

Primary table for daily puzzles.

```sql
CREATE TABLE puzzles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    puzzle_date DATE UNIQUE NOT NULL,
    main_word VARCHAR(10) NOT NULL,
    main_word_row INT NOT NULL DEFAULT 2,
    main_word_col INT NOT NULL DEFAULT 0,
    grid_rows INT NOT NULL DEFAULT 5,
    grid_cols INT NOT NULL DEFAULT 5,
    status VARCHAR(20) NOT NULL DEFAULT 'draft',
    difficulty_rating INT CHECK (difficulty_rating BETWEEN 1 AND 5),
    author VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    published_at TIMESTAMPTZ,

    CONSTRAINT valid_status CHECK (status IN ('draft', 'scheduled', 'published', 'archived'))
);

-- Indexes
CREATE INDEX idx_puzzles_date ON puzzles(puzzle_date);
CREATE INDEX idx_puzzles_status ON puzzles(status);
CREATE INDEX idx_puzzles_published ON puzzles(status, puzzle_date) WHERE status = 'published';

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER puzzles_updated_at
    BEFORE UPDATE ON puzzles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();
```

#### crossers

Crossing words that intersect with the main word.

```sql
CREATE TABLE crossers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    puzzle_id UUID NOT NULL REFERENCES puzzles(id) ON DELETE CASCADE,
    word VARCHAR(10) NOT NULL,
    clue TEXT NOT NULL,
    direction VARCHAR(10) NOT NULL,
    start_row INT NOT NULL,
    start_col INT NOT NULL,
    intersection_index INT NOT NULL, -- 0-indexed position in crosser that intersects main
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT valid_direction CHECK (direction IN ('across', 'down')),
    CONSTRAINT valid_intersection CHECK (intersection_index >= 0)
);

-- Indexes
CREATE INDEX idx_crossers_puzzle ON crossers(puzzle_id);

-- Ensure consistent ordering
CREATE INDEX idx_crossers_order ON crossers(puzzle_id, display_order);
```

#### words

Dictionary of valid words for validation.

```sql
CREATE TABLE words (
    word VARCHAR(10) PRIMARY KEY,
    length INT GENERATED ALWAYS AS (char_length(word)) STORED,
    frequency_rank INT, -- Lower = more common
    is_valid_guess BOOLEAN NOT NULL DEFAULT true,
    is_valid_answer BOOLEAN NOT NULL DEFAULT true,
    categories TEXT[], -- Optional: ['common', 'obscure', 'proper_noun']
    added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    added_by VARCHAR(100)
);

-- Indexes
CREATE INDEX idx_words_length ON words(length) WHERE is_valid_guess = true;
CREATE INDEX idx_words_answer ON words(length) WHERE is_valid_answer = true;
CREATE INDEX idx_words_frequency ON words(frequency_rank) WHERE frequency_rank IS NOT NULL;
```

#### puzzle_stats

Aggregated statistics per puzzle (optional server-side tracking).

```sql
CREATE TABLE puzzle_stats (
    puzzle_id UUID PRIMARY KEY REFERENCES puzzles(id) ON DELETE CASCADE,
    total_plays INT NOT NULL DEFAULT 0,
    total_completions INT NOT NULL DEFAULT 0,
    total_wins INT NOT NULL DEFAULT 0,
    avg_guesses DECIMAL(4,2),
    guess_distribution JSONB NOT NULL DEFAULT '{}',
    -- Example: {"1": 5, "2": 20, "3": 50, "4": 100, "5": 80, "6": 40}
    fastest_solve_seconds INT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER puzzle_stats_updated_at
    BEFORE UPDATE ON puzzle_stats
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();
```

---

## 2. TypeScript Types

### 2.1 Core Domain Types

```typescript
// types/puzzle.ts

export interface Puzzle {
  id: string;
  date: string; // ISO date: "2024-01-15"
  gridSize: GridSize;
  mainWord: MainWord;
  crossers: Crosser[];
}

export interface GridSize {
  rows: number;
  cols: number;
}

export interface MainWord {
  length: number;
  row: number;
  col: number;
}

export interface Crosser {
  id: string;
  clue: string;
  direction: 'across' | 'down';
  length: number;
  startPosition: Position;
  intersectionIndex: number;
  displayOrder: number;
}

export interface Position {
  row: number;
  col: number;
}

// Public puzzle data (sent to client - NO ANSWERS)
export interface PuzzleResponse {
  id: string;
  date: string;
  gridSize: GridSize;
  mainWordLength: number;
  mainWordRow: number;
  mainWordCol: number;
  crossers: CrosserPublic[];
}

export interface CrosserPublic {
  id: string;
  clue: string;
  direction: 'across' | 'down';
  length: number;
  startRow: number;
  startCol: number;
  displayOrder: number;
}
```

### 2.2 Game State Types

```typescript
// types/game.ts

export type GameStatus = 'loading' | 'playing' | 'won' | 'lost';
export type LetterStatus = 'correct' | 'present' | 'absent' | 'unknown';
export type WordTarget = 'main' | string; // 'main' or crosser ID

export interface GameState {
  puzzleId: string;
  puzzleDate: string;
  guesses: Guess[];
  currentGuess: string;
  selectedTarget: WordTarget;
  solvedWords: Set<string>; // IDs of solved words
  revealedLetters: RevealedLetter[];
  status: GameStatus;
  startedAt: number; // timestamp
  completedAt?: number;
}

export interface Guess {
  id: string;
  word: string;
  target: WordTarget;
  feedback: LetterFeedback[];
  timestamp: number;
}

export interface LetterFeedback {
  letter: string;
  status: LetterStatus;
  position: number;
}

export interface RevealedLetter {
  row: number;
  col: number;
  letter: string;
  source: string; // crosser ID that revealed this
}

// Keyboard state
export interface KeyboardState {
  [letter: string]: LetterStatus;
}
```

### 2.3 User Data Types

```typescript
// types/user.ts

export interface UserStats {
  gamesPlayed: number;
  gamesWon: number;
  currentStreak: number;
  maxStreak: number;
  guessDistribution: GuessDistribution;
  lastPlayedDate: string | null; // ISO date
  lastCompletedDate: string | null;
  totalCrossersSlved: number;
}

export interface GuessDistribution {
  1: number;
  2: number;
  3: number;
  4: number;
  5: number;
  6: number;
}

export interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  colorBlindMode: boolean;
  reducedMotion: boolean;
  hardMode: boolean; // future
}

export interface GameHistory {
  puzzleDate: string;
  status: 'won' | 'lost';
  guessCount: number;
  crossersSolved: number;
  totalCrossers: number;
  completedAt: number;
}
```

### 2.4 API Types

```typescript
// types/api.ts

// GET /api/puzzle/[date]
export interface GetPuzzleResponse {
  puzzle: PuzzleResponse;
}

// POST /api/verify
export interface VerifyGuessRequest {
  puzzleId: string;
  guess: string; // 5 uppercase letters
  target: WordTarget;
}

export interface VerifyGuessResponse {
  valid: boolean;
  isWord: boolean; // false if not in dictionary
  feedback: LetterFeedback[];
  solved: boolean;
  revealedLetters: RevealedLetter[];
  gameOver: boolean;
  won: boolean;
  answer?: string; // Only included if game is over and lost
}

// Error responses
export interface ApiError {
  error: string;
  message: string;
  code?: string;
}

export type ApiErrorCode =
  | 'INVALID_WORD'
  | 'INVALID_LENGTH'
  | 'PUZZLE_NOT_FOUND'
  | 'GAME_ALREADY_COMPLETE'
  | 'RATE_LIMITED'
  | 'SERVER_ERROR';
```

---

## 3. API Endpoints

### 3.1 Puzzle Endpoints

#### GET /api/puzzle/today

Redirects to today's puzzle.

```typescript
// Response: 302 Redirect
// Location: /api/puzzle/2024-01-15
```

#### GET /api/puzzle/[date]

Fetch puzzle for a specific date.

**Parameters:**
- `date` (path): ISO date string (YYYY-MM-DD)

**Response 200:**
```json
{
  "puzzle": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "date": "2024-01-15",
    "gridSize": { "rows": 7, "cols": 5 },
    "mainWordLength": 5,
    "mainWordRow": 3,
    "mainWordCol": 0,
    "crossers": [
      {
        "id": "crosser-1",
        "clue": "Playing cards for one person",
        "direction": "down",
        "length": 5,
        "startRow": 1,
        "startCol": 1,
        "displayOrder": 1
      },
      {
        "id": "crosser-2",
        "clue": "Capital of France",
        "direction": "down",
        "length": 5,
        "startRow": 1,
        "startCol": 3,
        "displayOrder": 2
      }
    ]
  }
}
```

**Response 404:**
```json
{
  "error": "PUZZLE_NOT_FOUND",
  "message": "No puzzle available for 2024-01-15"
}
```

### 3.2 Game Endpoints

#### POST /api/verify

Validate a guess and return feedback.

**Request:**
```json
{
  "puzzleId": "550e8400-e29b-41d4-a716-446655440000",
  "guess": "CRANE",
  "target": "main"
}
```

**Response 200 (valid guess, not solved):**
```json
{
  "valid": true,
  "isWord": true,
  "feedback": [
    { "letter": "C", "status": "correct", "position": 0 },
    { "letter": "R", "status": "absent", "position": 1 },
    { "letter": "A", "status": "present", "position": 2 },
    { "letter": "N", "status": "correct", "position": 3 },
    { "letter": "E", "status": "correct", "position": 4 }
  ],
  "solved": false,
  "revealedLetters": [],
  "gameOver": false,
  "won": false
}
```

**Response 200 (crosser solved):**
```json
{
  "valid": true,
  "isWord": true,
  "feedback": [
    { "letter": "P", "status": "correct", "position": 0 },
    { "letter": "A", "status": "correct", "position": 1 },
    { "letter": "R", "status": "correct", "position": 2 },
    { "letter": "I", "status": "correct", "position": 3 },
    { "letter": "S", "status": "correct", "position": 4 }
  ],
  "solved": true,
  "revealedLetters": [
    { "row": 3, "col": 3, "letter": "I", "source": "crosser-2" }
  ],
  "gameOver": false,
  "won": false
}
```

**Response 200 (game won):**
```json
{
  "valid": true,
  "isWord": true,
  "feedback": [...],
  "solved": true,
  "revealedLetters": [],
  "gameOver": true,
  "won": true
}
```

**Response 200 (game lost - 6th wrong guess):**
```json
{
  "valid": true,
  "isWord": true,
  "feedback": [...],
  "solved": false,
  "revealedLetters": [],
  "gameOver": true,
  "won": false,
  "answer": "CRISP"
}
```

**Response 400 (invalid word):**
```json
{
  "valid": false,
  "isWord": false,
  "error": "INVALID_WORD",
  "message": "Not in word list"
}
```

**Response 400 (invalid length):**
```json
{
  "valid": false,
  "error": "INVALID_LENGTH",
  "message": "Guess must be 5 letters"
}
```

### 3.3 Admin Endpoints

#### GET /api/admin/puzzles

List all puzzles with pagination.

**Query Parameters:**
- `status` (optional): Filter by status
- `limit` (optional): Page size (default 20)
- `offset` (optional): Pagination offset

**Response 200:**
```json
{
  "puzzles": [
    {
      "id": "...",
      "date": "2024-01-15",
      "mainWord": "CRISP",
      "status": "published",
      "crosserCount": 3,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 90,
  "limit": 20,
  "offset": 0
}
```

#### POST /api/admin/puzzles

Create a new puzzle.

**Request:**
```json
{
  "date": "2024-01-20",
  "mainWord": "CRANE",
  "mainWordRow": 3,
  "gridRows": 7,
  "gridCols": 5,
  "crossers": [
    {
      "word": "CRISP",
      "clue": "Potato chip texture",
      "direction": "down",
      "startRow": 1,
      "startCol": 0,
      "intersectionIndex": 2
    }
  ],
  "status": "scheduled"
}
```

**Response 201:**
```json
{
  "puzzle": {
    "id": "new-puzzle-id",
    "date": "2024-01-20",
    ...
  }
}
```

#### PUT /api/admin/puzzles/[id]

Update an existing puzzle.

#### DELETE /api/admin/puzzles/[id]

Delete a puzzle (draft only).

---

## 4. localStorage Schema

### 4.1 Keys

```typescript
const STORAGE_KEYS = {
  GAME_STATE: 'cluegrid:game:v1',
  USER_STATS: 'cluegrid:stats:v1',
  USER_SETTINGS: 'cluegrid:settings:v1',
  GAME_HISTORY: 'cluegrid:history:v1',
  ONBOARDING: 'cluegrid:onboarding:v1',
} as const;
```

### 4.2 Stored Data Structures

#### Game State
```json
{
  "puzzleId": "550e8400-e29b-41d4-a716-446655440000",
  "puzzleDate": "2024-01-15",
  "guesses": [
    {
      "id": "guess-1",
      "word": "CRANE",
      "target": "main",
      "feedback": [
        {"letter": "C", "status": "correct", "position": 0},
        {"letter": "R", "status": "absent", "position": 1},
        {"letter": "A", "status": "present", "position": 2},
        {"letter": "N", "status": "correct", "position": 3},
        {"letter": "E", "status": "correct", "position": 4}
      ],
      "timestamp": 1705312800000
    }
  ],
  "solvedWords": ["crosser-1"],
  "revealedLetters": [
    {"row": 3, "col": 1, "letter": "A", "source": "crosser-1"}
  ],
  "status": "playing",
  "startedAt": 1705312700000
}
```

#### User Stats
```json
{
  "gamesPlayed": 47,
  "gamesWon": 38,
  "currentStreak": 12,
  "maxStreak": 23,
  "guessDistribution": {
    "1": 2,
    "2": 5,
    "3": 12,
    "4": 10,
    "5": 6,
    "6": 3
  },
  "lastPlayedDate": "2024-01-15",
  "lastCompletedDate": "2024-01-15",
  "totalCrossersSolved": 142
}
```

#### User Settings
```json
{
  "theme": "dark",
  "colorBlindMode": false,
  "reducedMotion": false,
  "hardMode": false
}
```

#### Game History
```json
{
  "games": [
    {
      "puzzleDate": "2024-01-15",
      "status": "won",
      "guessCount": 4,
      "crossersSolved": 2,
      "totalCrossers": 3,
      "completedAt": 1705313400000
    }
  ],
  "maxGames": 30
}
```

---

## 5. Data Validation

### 5.1 Zod Schemas

```typescript
// lib/validation.ts
import { z } from 'zod';

export const GuessSchema = z.object({
  puzzleId: z.string().uuid(),
  guess: z
    .string()
    .length(5)
    .regex(/^[A-Z]+$/, 'Must be uppercase letters only'),
  target: z.union([z.literal('main'), z.string().uuid()]),
});

export const CreatePuzzleSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  mainWord: z
    .string()
    .min(4)
    .max(7)
    .regex(/^[A-Z]+$/),
  mainWordRow: z.number().int().min(0),
  gridRows: z.number().int().min(3).max(10),
  gridCols: z.number().int().min(3).max(10),
  crossers: z.array(
    z.object({
      word: z.string().min(3).max(7).regex(/^[A-Z]+$/),
      clue: z.string().min(5).max(200),
      direction: z.enum(['across', 'down']),
      startRow: z.number().int().min(0),
      startCol: z.number().int().min(0),
      intersectionIndex: z.number().int().min(0),
    })
  ).min(2).max(6),
  status: z.enum(['draft', 'scheduled']).default('draft'),
});

export type VerifyGuessInput = z.infer<typeof GuessSchema>;
export type CreatePuzzleInput = z.infer<typeof CreatePuzzleSchema>;
```

### 5.2 Server-Side Validation

```typescript
// app/api/verify/route.ts
import { NextResponse } from 'next/server';
import { GuessSchema } from '@/lib/validation';

export async function POST(request: Request) {
  const body = await request.json();

  const result = GuessSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      {
        error: 'VALIDATION_ERROR',
        message: result.error.issues[0].message
      },
      { status: 400 }
    );
  }

  const { puzzleId, guess, target } = result.data;

  // Continue with validation...
}
```

---

## 6. Database Queries

### 6.1 Common Queries

```typescript
// lib/db/queries.ts
import { supabase } from './client';

// Get today's puzzle
export async function getTodaysPuzzle() {
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('puzzles')
    .select(`
      id,
      puzzle_date,
      main_word,
      main_word_row,
      main_word_col,
      grid_rows,
      grid_cols,
      crossers (
        id,
        word,
        clue,
        direction,
        start_row,
        start_col,
        intersection_index,
        display_order
      )
    `)
    .eq('puzzle_date', today)
    .eq('status', 'published')
    .single();

  if (error) throw error;
  return data;
}

// Validate word exists
export async function isValidWord(word: string): Promise<boolean> {
  const { count, error } = await supabase
    .from('words')
    .select('word', { count: 'exact', head: true })
    .eq('word', word.toUpperCase())
    .eq('is_valid_guess', true);

  if (error) throw error;
  return (count ?? 0) > 0;
}

// Get puzzle by date (public, no answers)
export async function getPuzzlePublic(date: string) {
  const { data, error } = await supabase
    .from('puzzles')
    .select(`
      id,
      puzzle_date,
      grid_rows,
      grid_cols,
      main_word_row,
      main_word_col,
      crossers (
        id,
        clue,
        direction,
        start_row,
        start_col,
        display_order
      )
    `)
    .eq('puzzle_date', date)
    .eq('status', 'published')
    .single();

  // Note: main_word and crosser words are NOT selected

  if (error) throw error;
  return data;
}

// Update puzzle stats
export async function incrementPuzzleStats(
  puzzleId: string,
  won: boolean,
  guessCount: number
) {
  const { error } = await supabase.rpc('increment_puzzle_stats', {
    p_puzzle_id: puzzleId,
    p_won: won,
    p_guess_count: guessCount,
  });

  if (error) throw error;
}
```

### 6.2 Stored Procedures

```sql
-- Increment puzzle stats atomically
CREATE OR REPLACE FUNCTION increment_puzzle_stats(
  p_puzzle_id UUID,
  p_won BOOLEAN,
  p_guess_count INT
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO puzzle_stats (puzzle_id, total_plays, total_completions, total_wins, guess_distribution)
  VALUES (
    p_puzzle_id,
    1,
    1,
    CASE WHEN p_won THEN 1 ELSE 0 END,
    jsonb_build_object(p_guess_count::text, 1)
  )
  ON CONFLICT (puzzle_id) DO UPDATE SET
    total_plays = puzzle_stats.total_plays + 1,
    total_completions = puzzle_stats.total_completions + 1,
    total_wins = puzzle_stats.total_wins + CASE WHEN p_won THEN 1 ELSE 0 END,
    guess_distribution = puzzle_stats.guess_distribution ||
      jsonb_build_object(
        p_guess_count::text,
        COALESCE((puzzle_stats.guess_distribution->>p_guess_count::text)::int, 0) + 1
      ),
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;
```

---

## 7. Migration Strategy

### 7.1 Initial Migration

```sql
-- migrations/001_initial_schema.sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create tables (see Section 1.2)
-- Create indexes
-- Create functions and triggers
-- Seed words table with dictionary
```

### 7.2 Seeding Words

```typescript
// scripts/seed-words.ts
import { readFileSync } from 'fs';
import { supabase } from '../lib/db/client';

async function seedWords() {
  // Load curated word list (5-letter words)
  const words = readFileSync('data/words-5.txt', 'utf-8')
    .split('\n')
    .filter(Boolean)
    .map((word, index) => ({
      word: word.toUpperCase(),
      frequency_rank: index,
      is_valid_guess: true,
      is_valid_answer: index < 3000, // Top 3000 can be answers
    }));

  const { error } = await supabase
    .from('words')
    .upsert(words, { onConflict: 'word' });

  if (error) throw error;
  console.log(`Seeded ${words.length} words`);
}

seedWords();
```
