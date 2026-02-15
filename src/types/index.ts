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

// ---------------------------------------------------------------------------
// Badge / Achievement system
// ---------------------------------------------------------------------------

export type BadgeId =
  | "first_win"
  | "genius"
  | "quick_thinker"
  | "hint_master"
  | "streak_3"
  | "streak_7"
  | "streak_30"
  | "century"
  | "perfectionist";

export interface Badge {
  id: BadgeId;
  name: string;
  description: string;
  icon: string; // emoji
  earnedAt?: string; // ISO date when earned
}

export const BADGE_DEFINITIONS: Record<BadgeId, Omit<Badge, "earnedAt">> = {
  first_win: {
    id: "first_win",
    name: "First Win",
    description: "Complete your first puzzle",
    icon: "\u{1F389}", // party popper
  },
  genius: {
    id: "genius",
    name: "Genius",
    description: "Solve with no hints",
    icon: "\u{1F9E0}", // brain
  },
  quick_thinker: {
    id: "quick_thinker",
    name: "Quick Thinker",
    description: "Solve in 2 or fewer guesses",
    icon: "\u{26A1}", // lightning
  },
  hint_master: {
    id: "hint_master",
    name: "Hint Master",
    description: "Solve after using all hints",
    icon: "\u{1F50D}", // magnifying glass
  },
  streak_3: {
    id: "streak_3",
    name: "On a Roll",
    description: "Win 3 days in a row",
    icon: "\u{1F525}", // fire
  },
  streak_7: {
    id: "streak_7",
    name: "Weekly Warrior",
    description: "Win 7 days in a row",
    icon: "\u{1F4AA}", // flexed bicep
  },
  streak_30: {
    id: "streak_30",
    name: "Monthly Master",
    description: "Win 30 days in a row",
    icon: "\u{1F451}", // crown
  },
  century: {
    id: "century",
    name: "Century",
    description: "Complete 100 puzzles",
    icon: "\u{1F4AF}", // 100
  },
  perfectionist: {
    id: "perfectionist",
    name: "Perfectionist",
    description: "Get 5 perfect (3-star) solves in a row",
    icon: "\u{2B50}", // star
  },
};

export interface GameResult {
  won: boolean;
  guessCount: number;
  hintsUsed: number;
  totalCrossers: number;
  starRating: StarRating;
}
