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
