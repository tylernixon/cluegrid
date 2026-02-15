// Puzzle data from server / mock

export interface PuzzleData {
  id: string;
  date: string;
  mainWord: {
    word: string;
    row: number;
    col: number;
    length: number;
  };
  crossers: CrosserData[];
  gridSize: { rows: number; cols: number };
  theme?: string;
  themeHint?: string;
}

export interface CrosserData {
  id: string;
  word: string;
  clue: string;
  direction: "down";
  startRow: number;
  startCol: number;
  intersectionIndex: number; // index within the crosser where it meets the main word
}

// Guess and feedback

export interface Guess {
  word: string;
  targetId: "main" | string;
  feedback: LetterFeedback[];
}

export interface LetterFeedback {
  letter: string;
  status: "correct" | "present" | "absent";
}

// Keyboard letter tracking

export type KeyStatus = "correct" | "present" | "absent" | "unused";

// Game status

export type GameStatus = "playing" | "won" | "lost";

// Difficulty levels with guess budgets

export type Difficulty = "easy" | "medium" | "hard" | "expert";

export const DIFFICULTY_GUESS_LIMITS: Record<Difficulty, number> = {
  easy: 8,
  medium: 6,
  hard: 4,
  expert: 2,
};

// Star ratings based on hints used (0 = perfect, more hints = fewer stars)

export type StarRating = 0 | 1 | 2 | 3;

export function calculateStars(hintsUsed: number, totalCrossers: number): StarRating {
  if (totalCrossers === 0) return 3;
  const ratio = hintsUsed / totalCrossers;
  if (ratio === 0) return 3;    // No hints: perfect
  if (ratio <= 0.5) return 2;   // Up to half: great
  if (ratio < 1) return 1;      // More than half: okay
  return 0;                      // All hints used: no stars
}

// Revealed letter from solving a crosser

export interface RevealedLetter {
  row: number;
  col: number;
  letter: string;
  source?: string; // crosser ID that revealed this letter
}

// Grid cell for rendering

export interface GridCell {
  row: number;
  col: number;
  letter: string;
  belongsTo: ("main" | string)[]; // word ids this cell belongs to
  isRevealed: boolean;
  isEmpty: boolean;
}

// Win messages keyed by guess count

export const WIN_MESSAGES: Record<number, string> = {
  1: "Genius!",
  2: "Magnificent!",
  3: "Brilliant!",
  4: "Excellent!",
  5: "Nice!",
  6: "Phew!",
};

// ---------------------------------------------------------------------------
// API response types (used by API routes)
// ---------------------------------------------------------------------------

export interface CrosserPublic {
  id: string;
  clue: string;
  direction: "down";
  length: number;
  startRow: number;
  startCol: number;
  displayOrder: number;
}

export interface PuzzleResponse {
  id: string;
  date: string;
  gridSize: { rows: number; cols: number };
  mainWordLength: number;
  mainWordRow: number;
  mainWordCol: number;
  crossers: CrosserPublic[];
}

export interface VerifyResponse {
  valid: boolean;
  isWord: boolean;
  feedback: LetterFeedback[];
  solved: boolean;
  revealedLetters: RevealedLetter[];
  gameOver: boolean;
  won: boolean;
  answer?: string; // only included if game is over and lost
}

export interface ApiError {
  error: string;
  message: string;
}
