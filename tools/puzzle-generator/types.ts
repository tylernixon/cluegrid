/**
 * Type definitions for the Cluegrid puzzle generator
 */

/** A crosser word that intersects with the main word */
export interface Crosser {
  /** The crosser word (uppercase) */
  word: string;
  /** The clue for this crosser (hints at word AND theme) */
  clue: string;
  /** Position in main word where intersection occurs (0-indexed) */
  position: number;
  /** Position in crosser word where intersection occurs (0-indexed) */
  intersectionIndex: number;
}

/** Complete puzzle data matching the Cluegrid schema */
export interface PuzzleData {
  /** Scheduled date in YYYY-MM-DD format */
  date: string;
  /** The main word to guess (uppercase, 3-10 letters) */
  mainWord: string;
  /** Difficulty rating 1-5 */
  difficulty: number;
  /** Array of crossing words with clues */
  crossers: Crosser[];
  /** Optional theme/category used for generation */
  theme?: string;
  /** Optional notes about the puzzle */
  notes?: string;
}

/** Options for puzzle generation */
export interface GenerateOptions {
  /** Theme/category for the puzzle (e.g., "Ocean Life", "Food") */
  theme: string;
  /** The main word (optional - will be generated if not provided) */
  mainWord?: string;
  /** Target difficulty 1-5 (default: 3) */
  difficulty?: number;
  /** Number of crossers to generate (default: 3) */
  crosserCount?: number;
  /** Scheduled date for the puzzle (default: today) */
  date?: string;
}

/** A candidate crosser word with metadata */
export interface CrosserCandidate {
  /** The candidate word */
  word: string;
  /** Position in the main word where it can intersect */
  mainWordPosition: number;
  /** Position in this word where the intersection occurs */
  crosserPosition: number;
  /** The shared letter at intersection */
  sharedLetter: string;
  /** Relevance score to the theme (0-1) */
  thematicRelevance: number;
}

/** Result from the word finder utility */
export interface WordFinderResult {
  mainWord: string;
  theme: string;
  candidates: CrosserCandidate[];
}

/** Claude API response for word brainstorming */
export interface BrainstormWordsResponse {
  mainWord?: string;
  crosserWords: Array<{
    word: string;
    reasoning: string;
    thematicConnection: string;
  }>;
}

/** Claude API response for clue generation */
export interface GenerateCluesResponse {
  clues: Array<{
    word: string;
    clue: string;
    hintToTheme: string;
  }>;
}
