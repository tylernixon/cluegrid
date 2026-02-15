// Core puzzle types

export interface Puzzle {
  id: string;
  date: string; // YYYY-MM-DD
  mainWord: string;
  crossers: Crosser[];
  gridSize: { rows: number; cols: number };
}

export interface Crosser {
  id: string;
  word: string;
  clue: string;
  direction: "across" | "down";
  startPosition: { row: number; col: number };
  intersectionIndex: number;
}

export interface Guess {
  word: string;
  targetWord: "main" | string; // 'main' or crosser id
  feedback: LetterFeedback[];
  timestamp: number;
}

export interface LetterFeedback {
  letter: string;
  status: "correct" | "present" | "absent";
}

// Game state

export interface GameState {
  puzzleId: string;
  guesses: Guess[];
  solvedWords: string[]; // word ids that are solved
  status: "playing" | "won" | "lost";
  startedAt: number;
  completedAt?: number;
}

// User stats (localStorage)

export interface UserStats {
  gamesPlayed: number;
  gamesWon: number;
  currentStreak: number;
  maxStreak: number;
  guessDistribution: Record<number, number>;
  lastPlayedDate: string;
  lastCompletedDate: string;
}

// Cell states for rendering

export const CELL_STATUS = {
  EMPTY: "empty",
  FILLED: "filled",
  CORRECT: "correct",
  PRESENT: "present",
  ABSENT: "absent",
} as const;

export type CellStatus = (typeof CELL_STATUS)[keyof typeof CELL_STATUS];

export interface CellData {
  letter: string;
  status: CellStatus;
  isMainWord: boolean;
  wordId?: string;
}

// API response types

export interface PuzzleResponse {
  id: string;
  date: string;
  gridSize: { rows: number; cols: number };
  crossers: {
    id: string;
    clue: string;
    direction: "across" | "down";
    startPosition: { row: number; col: number };
    length: number;
  }[];
  mainWordLength: number;
  mainWordRow: number;
}

export interface VerifyResponse {
  valid: boolean;
  feedback: LetterFeedback[];
  solved: boolean;
  revealedLetters: {
    row: number;
    col: number;
    letter: string;
  }[];
}

export interface ApiError {
  error: string;
  message: string;
}

// Settings

export interface UserSettings {
  theme: "light" | "dark" | "system";
  reducedMotion: boolean;
  colorBlindMode: boolean;
}
