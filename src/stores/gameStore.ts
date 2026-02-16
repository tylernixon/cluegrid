"use client";

import { create } from "zustand";
import type {
  PuzzleData,
  Guess,
  LetterFeedback,
  GameStatus,
  RevealedLetter,
  KeyStatus,
  Difficulty,
  StarRating,
} from "@/types";
import { DIFFICULTY_GUESS_LIMITS, calculateStars } from "@/types";
import type { GameResult } from "@/types";
import { useStatsStore } from "./statsStore";
import { useHistoryStore } from "./historyStore";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DIFFICULTY_STORAGE_KEY = "cluegrid:difficulty";
const DEFAULT_DIFFICULTY: Difficulty = "medium";

// ---------------------------------------------------------------------------
// Word validation
// ---------------------------------------------------------------------------

// Cache of validated words to avoid repeat API calls
const validatedWords = new Set<string>();

// Validate word against Supabase dictionary
async function validateWord(word: string): Promise<boolean> {
  const normalized = word.trim().toUpperCase();

  console.log("[validateWord] Checking:", {
    input: word,
    normalized,
    cacheSize: validatedWords.size,
    inCache: validatedWords.has(normalized),
    cacheContents: Array.from(validatedWords),
  });

  // Check cache first
  if (validatedWords.has(normalized)) {
    console.log("[validateWord] Found in cache, returning true");
    return true;
  }

  try {
    const response = await fetch('/api/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ word: normalized }),
    });

    const data = await response.json();

    if (data.valid) {
      validatedWords.add(normalized);
    }

    return data.valid;
  } catch {
    // On network error, allow the word (fail open for UX)
    console.warn('Word validation failed, allowing word');
    return true;
  }
}

// Pre-add puzzle answers to validation cache
function addPuzzleWordsToCache(mainWord: string, crossers: Array<{ word: string }>) {
  const normalizedMain = mainWord.trim().toUpperCase();
  validatedWords.add(normalizedMain);
  console.log("[addPuzzleWordsToCache] Added main word:", normalizedMain);

  for (const c of crossers) {
    const normalizedCrosser = c.word.trim().toUpperCase();
    validatedWords.add(normalizedCrosser);
    console.log("[addPuzzleWordsToCache] Added crosser:", normalizedCrosser);
  }

  console.log("[addPuzzleWordsToCache] Cache now contains:", Array.from(validatedWords));
}

// ---------------------------------------------------------------------------
// Mock puzzle (fallback)
// ---------------------------------------------------------------------------

const MOCK_PUZZLE: PuzzleData = {
  id: "mock-1",
  date: "2024-01-15",
  mainWord: { word: "BEACH", row: 2, col: 0, length: 5 },
  crossers: [
    {
      id: "c1",
      word: "SHELL",
      clue: "A hard outer covering found on the shore",
      direction: "down",
      startRow: 0,
      startCol: 1,
      intersectionIndex: 2,
    },
    {
      id: "c2",
      word: "CRAB",
      clue: "A crustacean that walks sideways",
      direction: "down",
      startRow: 0,
      startCol: 2,
      intersectionIndex: 2,
    },
    {
      id: "c3",
      word: "OCEAN",
      clue: "A vast body of salt water",
      direction: "down",
      startRow: 1,
      startCol: 3,
      intersectionIndex: 1,
    },
  ],
  gridSize: { rows: 6, cols: 5 },
  theme: "At the Beach",
  themeHint: "Sun, sand, and surf",
};

// ---------------------------------------------------------------------------
// Feedback computation (Wordle-style)
// ---------------------------------------------------------------------------

function computeFeedback(guess: string, answer: string): LetterFeedback[] {
  const result: LetterFeedback[] = Array.from(guess, (letter) => ({
    letter,
    status: "absent" as const,
  }));
  const answerChars = answer.split("");
  const remaining: (string | null)[] = [...answerChars];

  // First pass: mark correct positions
  for (let i = 0; i < guess.length; i++) {
    if (guess[i] === answerChars[i]) {
      result[i] = { letter: guess[i]!, status: "correct" };
      remaining[i] = null;
    }
  }

  // Second pass: mark present (left to right)
  for (let i = 0; i < guess.length; i++) {
    if (result[i]!.status === "correct") continue;
    const idx = remaining.indexOf(guess[i]!);
    if (idx !== -1) {
      result[i] = { letter: guess[i]!, status: "present" };
      remaining[idx] = null;
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Difficulty persistence
// ---------------------------------------------------------------------------

function loadDifficulty(): Difficulty {
  if (typeof window === "undefined") return DEFAULT_DIFFICULTY;
  try {
    const stored = localStorage.getItem(DIFFICULTY_STORAGE_KEY);
    if (stored && ["easy", "medium", "hard", "expert"].includes(stored)) {
      return stored as Difficulty;
    }
  } catch {
    // Ignore storage errors
  }
  return DEFAULT_DIFFICULTY;
}

function saveDifficulty(difficulty: Difficulty): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(DIFFICULTY_STORAGE_KEY, difficulty);
  } catch {
    // Ignore storage errors
  }
}

// ---------------------------------------------------------------------------
// Session persistence
// ---------------------------------------------------------------------------

function getSessionKey(puzzleId: string): string {
  return `cluegrid:session:${puzzleId}`;
}

interface SessionData {
  puzzleId: string;
  guesses: Guess[];
  solvedWords: string[];
  revealedLetters: RevealedLetter[];
  status: GameStatus;
  selectedTarget: string;
  statsRecorded: boolean;
  difficulty: Difficulty;
  hintsUsed: number;
  mainGuessCount: number;
}

function loadSession(puzzleId: string): Partial<SessionData> | null {
  if (typeof window === "undefined") return null;
  try {
    const key = getSessionKey(puzzleId);
    const data = localStorage.getItem(key);
    if (!data) return null;
    const parsed = JSON.parse(data) as SessionData;
    if (parsed.puzzleId !== puzzleId) return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveSession(state: GameStore): void {
  if (typeof window === "undefined") return;
  try {
    const key = getSessionKey(state.puzzle.id);
    const data: SessionData = {
      puzzleId: state.puzzle.id,
      guesses: state.guesses,
      solvedWords: Array.from(state.solvedWords),
      revealedLetters: state.revealedLetters,
      status: state.status,
      selectedTarget: state.selectedTarget,
      statsRecorded: state.statsRecorded,
      difficulty: state.difficulty,
      hintsUsed: state.hintsUsed,
      mainGuessCount: state.mainGuessCount,
    };
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // Ignore storage errors
  }
}

// ---------------------------------------------------------------------------
// Store interface
// ---------------------------------------------------------------------------

interface GameStore {
  // Data
  puzzle: PuzzleData;
  guesses: Guess[];
  currentGuess: string;
  selectedTarget: "main" | string;
  solvedWords: Set<string>;
  revealedLetters: RevealedLetter[];
  status: GameStatus;
  shakeTarget: string | null;
  toastMessage: string | null;
  showCompletionModal: boolean;
  statsRecorded: boolean;

  // Hint-based gameplay
  difficulty: Difficulty;
  hintsUsed: number;       // Number of crossers solved (each costs a "hint")
  mainGuessCount: number;  // Guesses spent on the main word only

  // Loading state
  isLoading: boolean;
  isSubmitting: boolean; // True while submitGuess is in progress
  error: string | null;
  puzzleLoaded: boolean;
  isPreviewMode: boolean; // True when viewing a preview puzzle

  // Archive mode (playing a past puzzle from history)
  isArchiveMode: boolean;
  archiveDate: string | null; // YYYY-MM-DD of the archived puzzle

  // Derived
  maxGuesses: () => number;
  guessesRemaining: () => number;
  targetWordLength: () => number;
  targetWord: () => string;
  keyStatuses: () => Record<string, KeyStatus>;
  guessesForTarget: (targetId: "main" | string) => Guess[];
  starRating: () => StarRating;
  lockedPositions: () => Map<number, string>; // position -> letter for current target
  presentLettersForTarget: () => string[]; // letters in word but wrong position (yellow)

  // Actions
  fetchPuzzle: () => Promise<void>;
  loadArchivePuzzle: (date: string) => Promise<void>;
  exitArchiveMode: () => void;
  setDifficulty: (difficulty: Difficulty) => void;
  addLetter: (letter: string) => void;
  removeLetter: () => void;
  submitGuess: () => Promise<void>;
  selectTarget: (targetId: "main" | string) => void;
  clearToast: () => void;
  setShowCompletionModal: (show: boolean) => void;
  resetGame: () => void;
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

/**
 * Get today's date in YYYY-MM-DD format using Pacific Time.
 * Puzzles are published in Pacific Time, so we use that timezone
 * to determine which puzzle to show.
 */
function getTodayDate(): string {
  const now = new Date();
  // Format in Pacific Time (handles PST/PDT automatically)
  const pacificDate = now.toLocaleDateString('en-CA', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  // en-CA locale gives YYYY-MM-DD format
  return pacificDate;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useGameStore = create<GameStore>((set, get) => ({
  // Initial state
  puzzle: MOCK_PUZZLE,
  guesses: [],
  currentGuess: "",
  selectedTarget: "main", // Main word is the primary target now
  solvedWords: new Set<string>(),
  revealedLetters: [],
  status: "playing",
  shakeTarget: null,
  toastMessage: null,
  showCompletionModal: false,
  statsRecorded: false,

  // Hint-based gameplay
  difficulty: loadDifficulty(),
  hintsUsed: 0,
  mainGuessCount: 0,

  // Loading state
  isLoading: true,
  isSubmitting: false,
  error: null,
  puzzleLoaded: false,
  isPreviewMode: false,

  // Archive mode
  isArchiveMode: false,
  archiveDate: null,

  // -----------------------------------------------------------------------
  // Derived values
  // -----------------------------------------------------------------------

  maxGuesses: () => DIFFICULTY_GUESS_LIMITS[get().difficulty],

  guessesRemaining: () => {
    const state = get();
    return state.maxGuesses() - state.mainGuessCount;
  },

  targetWordLength: () => {
    const { puzzle, selectedTarget } = get();
    if (selectedTarget === "main") return puzzle.mainWord.word.length;
    const crosser = puzzle.crossers.find((c) => c.id === selectedTarget);
    return crosser ? crosser.word.length : 5;
  },

  targetWord: () => {
    const { puzzle, selectedTarget } = get();
    if (selectedTarget === "main") return puzzle.mainWord.word;
    const crosser = puzzle.crossers.find((c) => c.id === selectedTarget);
    return crosser ? crosser.word : "";
  },

  keyStatuses: () => {
    const statuses: Record<string, KeyStatus> = {};
    const { guesses, selectedTarget } = get();
    for (const guess of guesses) {
      // Show key statuses for the currently selected target
      // This makes keyboard feedback contextual (crosser vs main word)
      if (guess.targetId !== selectedTarget) continue;
      for (const fb of guess.feedback) {
        const key = fb.letter;
        const current = statuses[key] ?? "unused";
        if (fb.status === "correct") {
          statuses[key] = "correct";
        } else if (fb.status === "present" && current !== "correct") {
          statuses[key] = "present";
        } else if (
          fb.status === "absent" &&
          current !== "correct" &&
          current !== "present"
        ) {
          statuses[key] = "absent";
        }
      }
    }
    return statuses;
  },

  guessesForTarget: (targetId: "main" | string) => {
    return get().guesses.filter((g) => g.targetId === targetId);
  },

  starRating: () => {
    const { hintsUsed, puzzle } = get();
    return calculateStars(hintsUsed, puzzle.crossers.length);
  },

  lockedPositions: () => {
    const { puzzle, selectedTarget, revealedLetters, guesses } = get();
    const locked = new Map<number, string>();

    if (selectedTarget === "main") {
      // For main word: check revealedLetters at main word row
      const mainRow = puzzle.mainWord.row;
      const mainCol = puzzle.mainWord.col;
      for (const rl of revealedLetters) {
        if (rl.row === mainRow) {
          const position = rl.col - mainCol;
          if (position >= 0 && position < puzzle.mainWord.word.length) {
            locked.set(position, rl.letter.toUpperCase());
          }
        }
      }
    } else {
      // For crosser: check revealedLetters at crosser column
      const crosser = puzzle.crossers.find((c) => c.id === selectedTarget);
      if (crosser) {
        for (const rl of revealedLetters) {
          if (rl.col === crosser.startCol) {
            const position = rl.row - crosser.startRow;
            if (position >= 0 && position < crosser.word.length) {
              locked.set(position, rl.letter.toUpperCase());
            }
          }
        }
      }
    }

    // Also lock positions from previous guesses that got "correct" feedback
    const targetGuesses = guesses.filter((g) => g.targetId === selectedTarget);
    for (const guess of targetGuesses) {
      for (let i = 0; i < guess.feedback.length; i++) {
        const fb = guess.feedback[i];
        if (fb && fb.status === "correct") {
          locked.set(i, fb.letter.toUpperCase());
        }
      }
    }

    return locked;
  },

  // Get letters that are in the word but in wrong position (yellow/present)
  presentLettersForTarget: () => {
    const { selectedTarget, guesses } = get();
    const present = new Set<string>();
    const correctLetters = new Set<string>();

    const targetGuesses = guesses.filter((g) => g.targetId === selectedTarget);
    for (const guess of targetGuesses) {
      for (const fb of guess.feedback) {
        if (fb.status === "present") {
          present.add(fb.letter.toUpperCase());
        }
        if (fb.status === "correct") {
          correctLetters.add(fb.letter.toUpperCase());
        }
      }
    }

    // Remove letters that have been found in correct positions
    // (unless they appear multiple times in the answer)
    // For simplicity, we keep showing present letters even if one instance is correct
    // This helps when a letter appears multiple times

    return Array.from(present).sort();
  },

  // -----------------------------------------------------------------------
  // Actions
  // -----------------------------------------------------------------------

  setDifficulty: (difficulty: Difficulty) => {
    saveDifficulty(difficulty);
    set({ difficulty });
  },

  fetchPuzzle: async () => {
    // Check if URL has reset param - clears all sessions (must happen BEFORE puzzleLoaded check)
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.has("reset")) {
        Object.keys(localStorage)
          .filter((k) => k.startsWith("cluegrid:session:"))
          .forEach((k) => localStorage.removeItem(k));
        // Remove reset param from URL and force reload to get fresh state
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete("reset");
        window.location.replace(newUrl.toString());
        return;
      }
    }

    if (get().puzzleLoaded) return;

    set({ isLoading: true, error: null });

    try {
      // Check if URL has preview param (admin preview mode)
      const urlParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
      const previewId = urlParams?.get("preview");
      const isPreviewMode = !!previewId;

      let url: string;
      if (previewId) {
        // Preview mode - fetch specific puzzle by ID
        url = `/api/puzzle/preview/${previewId}`;
        console.log("[fetchPuzzle] Preview mode, fetching puzzle ID:", previewId);
      } else {
        // Normal mode - fetch today's puzzle
        const today = getTodayDate();
        console.log("[fetchPuzzle] Fetching for date:", today);
        const shouldBustCache = urlParams?.has("t") || urlParams?.has("bust");
        const bustParam = shouldBustCache ? "?bust" : "";
        url = `/api/puzzle/${today}${bustParam}`;
      }

      console.log("[fetchPuzzle] Fetching URL:", url);
      const response = await fetch(url);
      console.log("[fetchPuzzle] Response status:", response.status);

      if (!response.ok) {
        throw new Error(`Failed to fetch puzzle: ${response.status}`);
      }

      const data = await response.json();
      const puzzle: PuzzleData = data.puzzle;

      addPuzzleWordsToCache(puzzle.mainWord.word, puzzle.crossers);

      // In preview mode, don't load saved session - always start fresh
      const session = isPreviewMode ? null : loadSession(puzzle.id);

      if (session) {
        // Compute pre-filled currentGuess with locked letters from revealed letters AND correct feedback
        const selectedTarget = session.selectedTarget ?? "main";
        const revealedLetters = session.revealedLetters ?? [];
        const sessionGuesses = session.guesses ?? [];
        const locked = new Map<number, string>();
        let targetLength = 5;

        if (selectedTarget === "main") {
          targetLength = puzzle.mainWord.word.length;
          const mainRow = puzzle.mainWord.row;
          const mainCol = puzzle.mainWord.col;
          for (const rl of revealedLetters) {
            if (rl.row === mainRow) {
              const position = rl.col - mainCol;
              if (position >= 0 && position < targetLength) {
                locked.set(position, rl.letter.toUpperCase());
              }
            }
          }
        } else {
          const crosser = puzzle.crossers.find((c) => c.id === selectedTarget);
          if (crosser) {
            targetLength = crosser.word.length;
            for (const rl of revealedLetters) {
              if (rl.col === crosser.startCol) {
                const position = rl.row - crosser.startRow;
                if (position >= 0 && position < targetLength) {
                  locked.set(position, rl.letter.toUpperCase());
                }
              }
            }
          }
        }

        // Also lock positions from previous guesses that got "correct" feedback
        const targetGuesses = sessionGuesses.filter((g) => g.targetId === selectedTarget);
        for (const guess of targetGuesses) {
          for (let i = 0; i < guess.feedback.length; i++) {
            const fb = guess.feedback[i];
            if (fb && fb.status === "correct") {
              locked.set(i, fb.letter.toUpperCase());
            }
          }
        }

        // Build initial guess with locked letters pre-filled
        const initialGuess = Array.from({ length: targetLength }, (_, i) =>
          locked.has(i) ? locked.get(i)! : " "
        ).join("");

        set({
          puzzle,
          guesses: sessionGuesses,
          currentGuess: initialGuess,
          selectedTarget,
          solvedWords: new Set(session.solvedWords ?? []),
          revealedLetters,
          status: session.status ?? "playing",
          statsRecorded: session.statsRecorded ?? false,
          difficulty: session.difficulty ?? loadDifficulty(),
          hintsUsed: session.hintsUsed ?? 0,
          mainGuessCount: session.mainGuessCount ?? 0,
          isLoading: false,
          puzzleLoaded: true,
          isPreviewMode,
        });
      } else {
        set({
          puzzle,
          guesses: [],
          currentGuess: "",
          selectedTarget: "main",
          solvedWords: new Set<string>(),
          revealedLetters: [],
          status: "playing",
          statsRecorded: false,
          difficulty: loadDifficulty(),
          hintsUsed: 0,
          mainGuessCount: 0,
          isLoading: false,
          puzzleLoaded: true,
          isPreviewMode,
        });
      }
    } catch (err) {
      console.error("Failed to fetch puzzle:", err);
      addPuzzleWordsToCache(MOCK_PUZZLE.mainWord.word, MOCK_PUZZLE.crossers);

      const session = loadSession(MOCK_PUZZLE.id);

      if (session) {
        // Compute pre-filled currentGuess with locked letters from revealed letters AND correct feedback
        const selectedTarget = session.selectedTarget ?? "main";
        const revealedLetters = session.revealedLetters ?? [];
        const sessionGuesses = session.guesses ?? [];
        const locked = new Map<number, string>();
        let targetLength = 5;

        if (selectedTarget === "main") {
          targetLength = MOCK_PUZZLE.mainWord.word.length;
          const mainRow = MOCK_PUZZLE.mainWord.row;
          const mainCol = MOCK_PUZZLE.mainWord.col;
          for (const rl of revealedLetters) {
            if (rl.row === mainRow) {
              const position = rl.col - mainCol;
              if (position >= 0 && position < targetLength) {
                locked.set(position, rl.letter.toUpperCase());
              }
            }
          }
        } else {
          const crosser = MOCK_PUZZLE.crossers.find((c) => c.id === selectedTarget);
          if (crosser) {
            targetLength = crosser.word.length;
            for (const rl of revealedLetters) {
              if (rl.col === crosser.startCol) {
                const position = rl.row - crosser.startRow;
                if (position >= 0 && position < targetLength) {
                  locked.set(position, rl.letter.toUpperCase());
                }
              }
            }
          }
        }

        // Also lock positions from previous guesses that got "correct" feedback
        const targetGuesses = sessionGuesses.filter((g) => g.targetId === selectedTarget);
        for (const guess of targetGuesses) {
          for (let i = 0; i < guess.feedback.length; i++) {
            const fb = guess.feedback[i];
            if (fb && fb.status === "correct") {
              locked.set(i, fb.letter.toUpperCase());
            }
          }
        }

        // Build initial guess with locked letters pre-filled
        const initialGuess = Array.from({ length: targetLength }, (_, i) =>
          locked.has(i) ? locked.get(i)! : " "
        ).join("");

        set({
          puzzle: MOCK_PUZZLE,
          guesses: sessionGuesses,
          currentGuess: initialGuess,
          selectedTarget,
          solvedWords: new Set(session.solvedWords ?? []),
          revealedLetters,
          status: session.status ?? "playing",
          statsRecorded: session.statsRecorded ?? false,
          difficulty: session.difficulty ?? loadDifficulty(),
          hintsUsed: session.hintsUsed ?? 0,
          mainGuessCount: session.mainGuessCount ?? 0,
          isLoading: false,
          error: err instanceof Error ? err.message : "Failed to load puzzle",
          puzzleLoaded: true,
        });
      } else {
        set({
          puzzle: MOCK_PUZZLE,
          guesses: [],
          currentGuess: "",
          selectedTarget: "main",
          solvedWords: new Set<string>(),
          revealedLetters: [],
          status: "playing",
          statsRecorded: false,
          difficulty: loadDifficulty(),
          hintsUsed: 0,
          mainGuessCount: 0,
          isLoading: false,
          error: err instanceof Error ? err.message : "Failed to load puzzle",
          puzzleLoaded: true,
        });
      }
    }
  },

  loadArchivePuzzle: async (date: string) => {
    set({ isLoading: true, error: null });

    try {
      const response = await fetch(`/api/puzzle/${date}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch archive puzzle: ${response.status}`);
      }

      const data = await response.json();
      const puzzle: PuzzleData = data.puzzle;

      addPuzzleWordsToCache(puzzle.mainWord.word, puzzle.crossers);

      // Check for an existing session for this archive puzzle
      const session = loadSession(puzzle.id);

      if (session) {
        // Restore saved archive session
        const selectedTarget = session.selectedTarget ?? "main";
        const revealedLetters = session.revealedLetters ?? [];
        const sessionGuesses = session.guesses ?? [];
        const locked = new Map<number, string>();
        let targetLength = 5;

        if (selectedTarget === "main") {
          targetLength = puzzle.mainWord.word.length;
          const mainRow = puzzle.mainWord.row;
          const mainCol = puzzle.mainWord.col;
          for (const rl of revealedLetters) {
            if (rl.row === mainRow) {
              const position = rl.col - mainCol;
              if (position >= 0 && position < targetLength) {
                locked.set(position, rl.letter.toUpperCase());
              }
            }
          }
        } else {
          const crosser = puzzle.crossers.find((c) => c.id === selectedTarget);
          if (crosser) {
            targetLength = crosser.word.length;
            for (const rl of revealedLetters) {
              if (rl.col === crosser.startCol) {
                const position = rl.row - crosser.startRow;
                if (position >= 0 && position < targetLength) {
                  locked.set(position, rl.letter.toUpperCase());
                }
              }
            }
          }
        }

        const targetGuesses = sessionGuesses.filter((g) => g.targetId === selectedTarget);
        for (const guess of targetGuesses) {
          for (let i = 0; i < guess.feedback.length; i++) {
            const fb = guess.feedback[i];
            if (fb && fb.status === "correct") {
              locked.set(i, fb.letter.toUpperCase());
            }
          }
        }

        const initialGuess = Array.from({ length: targetLength }, (_, i) =>
          locked.has(i) ? locked.get(i)! : " "
        ).join("");

        set({
          puzzle,
          guesses: sessionGuesses,
          currentGuess: initialGuess,
          selectedTarget,
          solvedWords: new Set(session.solvedWords ?? []),
          revealedLetters,
          status: session.status ?? "playing",
          statsRecorded: session.statsRecorded ?? false,
          difficulty: session.difficulty ?? loadDifficulty(),
          hintsUsed: session.hintsUsed ?? 0,
          mainGuessCount: session.mainGuessCount ?? 0,
          isLoading: false,
          puzzleLoaded: true,
          isPreviewMode: false,
          isArchiveMode: true,
          archiveDate: date,
        });
      } else {
        set({
          puzzle,
          guesses: [],
          currentGuess: "",
          selectedTarget: "main",
          solvedWords: new Set<string>(),
          revealedLetters: [],
          status: "playing",
          statsRecorded: false,
          difficulty: loadDifficulty(),
          hintsUsed: 0,
          mainGuessCount: 0,
          isLoading: false,
          puzzleLoaded: true,
          isPreviewMode: false,
          isArchiveMode: true,
          archiveDate: date,
        });
      }
    } catch (err) {
      console.error("Failed to fetch archive puzzle:", err);
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : "Failed to load archive puzzle",
      });
    }
  },

  exitArchiveMode: () => {
    // Reset state so fetchPuzzle can reload the daily puzzle
    set({
      puzzleLoaded: false,
      isArchiveMode: false,
      archiveDate: null,
      guesses: [],
      currentGuess: "",
      selectedTarget: "main",
      solvedWords: new Set<string>(),
      revealedLetters: [],
      status: "playing",
      statsRecorded: false,
      hintsUsed: 0,
      mainGuessCount: 0,
      isLoading: true,
      error: null,
      showCompletionModal: false,
    });
  },

  addLetter: (letter: string) => {
    // Use functional update to avoid race conditions with rapid typing
    set((state) => {
      if (state.isLoading || state.isSubmitting) return state;
      if (state.status !== "playing") return state;

      // Compute locked positions for current target (revealed letters + correct feedback)
      const locked = new Set<number>();
      let targetLength = 5;

      if (state.selectedTarget === "main") {
        targetLength = state.puzzle.mainWord.word.length;
        const mainRow = state.puzzle.mainWord.row;
        const mainCol = state.puzzle.mainWord.col;
        for (const rl of state.revealedLetters) {
          if (rl.row === mainRow) {
            const position = rl.col - mainCol;
            if (position >= 0 && position < targetLength) {
              locked.add(position);
            }
          }
        }
      } else {
        const crosser = state.puzzle.crossers.find((c) => c.id === state.selectedTarget);
        if (crosser) {
          targetLength = crosser.word.length;
          for (const rl of state.revealedLetters) {
            if (rl.col === crosser.startCol) {
              const position = rl.row - crosser.startRow;
              if (position >= 0 && position < targetLength) {
                locked.add(position);
              }
            }
          }
        }
      }

      // Also lock positions from previous guesses that got "correct" feedback
      const targetGuesses = state.guesses.filter((g) => g.targetId === state.selectedTarget);
      for (const guess of targetGuesses) {
        for (let i = 0; i < guess.feedback.length; i++) {
          const fb = guess.feedback[i];
          if (fb && fb.status === "correct") {
            locked.add(i);
          }
        }
      }

      // Ensure currentGuess is the right length (pad with spaces if needed)
      const guess = state.currentGuess.padEnd(targetLength, " ");

      // Find the first empty (space) position that's not locked
      let insertPos = -1;
      for (let i = 0; i < targetLength; i++) {
        if (!locked.has(i) && guess[i] === " ") {
          insertPos = i;
          break;
        }
      }

      if (insertPos === -1) {
        // No empty position available - word is complete, don't add anything
        return state;
      }

      // Insert the letter at the found position
      const guessArray = guess.split("");
      guessArray[insertPos] = letter.toUpperCase();
      const newGuess = guessArray.join("");

      return { currentGuess: newGuess };
    });
  },

  removeLetter: () => {
    // Use functional update to avoid race conditions with rapid typing
    set((state) => {
      if (state.isLoading || state.isSubmitting) return state;
      if (state.status !== "playing") return state;

      // Compute locked positions for current target (revealed letters + correct feedback)
      const locked = new Set<number>();
      let targetLength = 5;

      if (state.selectedTarget === "main") {
        targetLength = state.puzzle.mainWord.word.length;
        const mainRow = state.puzzle.mainWord.row;
        const mainCol = state.puzzle.mainWord.col;
        for (const rl of state.revealedLetters) {
          if (rl.row === mainRow) {
            const position = rl.col - mainCol;
            if (position >= 0 && position < targetLength) {
              locked.add(position);
            }
          }
        }
      } else {
        const crosser = state.puzzle.crossers.find((c) => c.id === state.selectedTarget);
        if (crosser) {
          targetLength = crosser.word.length;
          for (const rl of state.revealedLetters) {
            if (rl.col === crosser.startCol) {
              const position = rl.row - crosser.startRow;
              if (position >= 0 && position < targetLength) {
                locked.add(position);
              }
            }
          }
        }
      }

      // Also lock positions from previous guesses that got "correct" feedback
      const targetGuesses = state.guesses.filter((g) => g.targetId === state.selectedTarget);
      for (const guess of targetGuesses) {
        for (let i = 0; i < guess.feedback.length; i++) {
          const fb = guess.feedback[i];
          if (fb && fb.status === "correct") {
            locked.add(i);
          }
        }
      }

      // Ensure currentGuess is the right length
      const guess = state.currentGuess.padEnd(targetLength, " ");

      // Find the last filled (non-space) position that's not locked
      let removePos = -1;
      for (let i = targetLength - 1; i >= 0; i--) {
        if (!locked.has(i) && guess[i] !== " ") {
          removePos = i;
          break;
        }
      }

      if (removePos === -1) {
        // Nothing to remove
        return state;
      }

      // Remove the letter at the found position (replace with space)
      const guessArray = guess.split("");
      guessArray[removePos] = " ";
      const newGuess = guessArray.join("");

      return { currentGuess: newGuess };
    });
  },

  submitGuess: async () => {
    const state = get();

    // Debug: trace the entire submission flow
    console.log("[submitGuess] Starting submission:", {
      currentGuess: state.currentGuess,
      selectedTarget: state.selectedTarget,
      isLoading: state.isLoading,
      isSubmitting: state.isSubmitting,
      status: state.status,
      puzzleId: state.puzzle.id,
    });

    if (state.isLoading || state.isSubmitting) {
      console.log("[submitGuess] Blocked - isLoading or isSubmitting");
      return;
    }
    if (state.status !== "playing") {
      console.log("[submitGuess] Blocked - status is not playing:", state.status);
      return;
    }

    // Lock to prevent race conditions with typing
    set({ isSubmitting: true });

    const isMainGuess = state.selectedTarget === "main";

    // For main-word guesses, check the guess budget
    if (isMainGuess && state.guessesRemaining() <= 0) {
      console.log("[submitGuess] Blocked - no guesses remaining");
      set({ isSubmitting: false, toastMessage: "No guesses remaining" });
      return;
    }

    const requiredLength = state.targetWordLength();
    // With crossword-style input, spaces indicate unfilled positions
    const rawGuess = state.currentGuess.toUpperCase();
    const hasUnfilledPositions = rawGuess.includes(" ") || rawGuess.length < requiredLength;
    const guess = rawGuess.replace(/ /g, ""); // Remove spaces for comparison

    console.log("[submitGuess] Length check:", {
      rawGuess,
      guess,
      guessLength: guess.length,
      requiredLength,
      hasUnfilledPositions,
    });

    // Check if all positions are filled
    if (hasUnfilledPositions || guess.length < requiredLength) {
      console.log("[submitGuess] Blocked - not enough letters");
      set({ isSubmitting: false, shakeTarget: state.selectedTarget, toastMessage: "Not enough letters" });
      setTimeout(() => set({ shakeTarget: null }), 300);
      return;
    }

    // Check if target is already solved
    if (state.solvedWords.has(state.selectedTarget)) {
      set({ isSubmitting: false, toastMessage: "Already solved" });
      return;
    }

    // Get the target answer directly from captured state
    const rawAnswer = state.selectedTarget === "main"
      ? state.puzzle.mainWord.word
      : state.puzzle.crossers.find((c) => c.id === state.selectedTarget)?.word ?? "";
    const answer = rawAnswer.trim().toUpperCase();

    // Debug: detailed comparison logging
    console.log("[submitGuess] Answer lookup:", {
      selectedTarget: state.selectedTarget,
      rawAnswer,
      normalizedAnswer: answer,
      mainWord: state.puzzle.mainWord.word,
      crosserCount: state.puzzle.crossers.length,
      crosserIds: state.puzzle.crossers.map(c => c.id),
    });

    console.log("[submitGuess] Comparison:", {
      guess,
      answer,
      areEqual: guess === answer,
      guessChars: guess.split('').map(c => c.charCodeAt(0)),
      answerChars: answer.split('').map(c => c.charCodeAt(0)),
    });

    // If the guess matches the answer, skip dictionary validation
    // (handles words not in dictionary but valid as puzzle answers)
    if (guess !== answer) {
      console.log("[submitGuess] Guess does not match answer, validating against dictionary...");
      // Validate word against dictionary
      const isValid = await validateWord(guess);
      console.log("[submitGuess] Dictionary validation result:", isValid);
      if (!isValid) {
        set({ isSubmitting: false, shakeTarget: state.selectedTarget, toastMessage: "Not in word list" });
        setTimeout(() => set({ shakeTarget: null }), 300);
        return;
      }
    } else {
      console.log("[submitGuess] Guess matches answer exactly, skipping dictionary validation");
    }
    const feedback = computeFeedback(guess, answer);
    const solved = guess === answer;

    const newGuess: Guess = {
      word: guess,
      targetId: state.selectedTarget,
      feedback,
    };

    const newGuesses = [...state.guesses, newGuess];
    const newSolvedWords = new Set(state.solvedWords);
    const newRevealedLetters = [...state.revealedLetters];
    let newHintsUsed = state.hintsUsed;
    let newMainGuessCount = state.mainGuessCount;

    // Track main-word guesses against the budget
    if (isMainGuess) {
      newMainGuessCount += 1;
    }

    if (solved) {
      newSolvedWords.add(state.selectedTarget);

      // If a crosser was solved, it counts as using a hint and reveals a letter
      if (!isMainGuess) {
        newHintsUsed += 1;

        const crosser = state.puzzle.crossers.find(
          (c) => c.id === state.selectedTarget,
        );
        if (crosser) {
          const mainRow = state.puzzle.mainWord.row;
          const col = crosser.startCol;
          const letter = crosser.word[crosser.intersectionIndex]!;
          newRevealedLetters.push({ row: mainRow, col, letter, source: crosser.id });
        }
      }
    }

    // Determine game status
    let newStatus: GameStatus = "playing";
    if (isMainGuess && solved) {
      newStatus = "won";
    } else if (isMainGuess && newMainGuessCount >= state.maxGuesses()) {
      // Used all main-word guesses without solving
      newStatus = "lost";
    }

    // Auto-advance target after solving a crosser
    let newSelectedTarget = state.selectedTarget;
    if (solved && !isMainGuess && newStatus === "playing") {
      // Go back to main word after solving a hint
      newSelectedTarget = "main";
    }

    // Compute pre-filled guess for the new target (with locked letters from revealed + correct feedback)
    let newCurrentGuess = "";
    if (newStatus === "playing") {
      const locked = new Map<number, string>();
      let targetLength = 5;

      if (newSelectedTarget === "main") {
        targetLength = state.puzzle.mainWord.word.length;
        const mainRow = state.puzzle.mainWord.row;
        const mainCol = state.puzzle.mainWord.col;
        for (const rl of newRevealedLetters) {
          if (rl.row === mainRow) {
            const position = rl.col - mainCol;
            if (position >= 0 && position < targetLength) {
              locked.set(position, rl.letter.toUpperCase());
            }
          }
        }
      } else {
        const crosser = state.puzzle.crossers.find((c) => c.id === newSelectedTarget);
        if (crosser) {
          targetLength = crosser.word.length;
          for (const rl of newRevealedLetters) {
            if (rl.col === crosser.startCol) {
              const position = rl.row - crosser.startRow;
              if (position >= 0 && position < targetLength) {
                locked.set(position, rl.letter.toUpperCase());
              }
            }
          }
        }
      }

      // Also lock positions from previous guesses (including the one just submitted) that got "correct" feedback
      const targetGuesses = newGuesses.filter((g) => g.targetId === newSelectedTarget);
      for (const g of targetGuesses) {
        for (let i = 0; i < g.feedback.length; i++) {
          const fb = g.feedback[i];
          if (fb && fb.status === "correct") {
            locked.set(i, fb.letter.toUpperCase());
          }
        }
      }

      // Build initial guess with locked letters pre-filled
      newCurrentGuess = Array.from({ length: targetLength }, (_, i) =>
        locked.has(i) ? locked.get(i)! : " "
      ).join("");
    }

    // Record stats if game is over (skip in preview mode; include archive games)
    let newStatsRecorded = state.statsRecorded;
    if ((newStatus === "won" || newStatus === "lost") && !state.statsRecorded && !state.isPreviewMode) {
      const statsStore = useStatsStore.getState();
      // Pass the archive date if in archive mode so stats use the correct date
      const puzzleDateForStats = state.isArchiveMode ? (state.archiveDate ?? undefined) : undefined;
      statsStore.recordGame(newStatus === "won", newMainGuessCount, puzzleDateForStats);

      // Check and award badges
      const gameResult: GameResult = {
        won: newStatus === "won",
        guessCount: newMainGuessCount,
        hintsUsed: newHintsUsed,
        totalCrossers: state.puzzle.crossers.length,
        starRating: calculateStars(newHintsUsed, state.puzzle.crossers.length),
      };
      statsStore.checkAndAwardBadges(gameResult);

      // Record to history store
      const historyStore = useHistoryStore.getState();
      historyStore.recordGame({
        puzzleId: state.puzzle.id,
        puzzleDate: state.puzzle.date,
        playedAt: new Date().toISOString(),
        status: newStatus as "won" | "lost",
        guessCount: newMainGuessCount,
        hintsUsed: newHintsUsed,
        starRating: gameResult.starRating,
        difficulty: state.difficulty,
        guessWords: newGuesses
          .filter((g) => g.targetId === "main")
          .map((g) => g.word),
      });

      newStatsRecorded = true;
    }

    set({
      isSubmitting: false,
      guesses: newGuesses,
      currentGuess: newCurrentGuess,
      solvedWords: newSolvedWords,
      revealedLetters: newRevealedLetters,
      status: newStatus,
      selectedTarget: newSelectedTarget,
      statsRecorded: newStatsRecorded,
      hintsUsed: newHintsUsed,
      mainGuessCount: newMainGuessCount,
    });

    // Save session to localStorage (skip in preview mode)
    if (!state.isPreviewMode) {
      saveSession(get());
    }

    // Show completion modal after a delay
    if (newStatus === "won" || newStatus === "lost") {
      setTimeout(() => set({ showCompletionModal: true }), 800);
    }
  },

  selectTarget: (targetId: "main" | string) => {
    const { status, solvedWords, isLoading, selectedTarget, puzzle, revealedLetters, guesses } = get();

    if (isLoading) return;
    if (status !== "playing") return;
    if (solvedWords.has(targetId)) return;
    if (targetId === selectedTarget) return;

    // Compute locked positions for the new target (revealed letters + correct feedback)
    const locked = new Map<number, string>();
    let targetLength = 5;

    if (targetId === "main") {
      targetLength = puzzle.mainWord.word.length;
      const mainRow = puzzle.mainWord.row;
      const mainCol = puzzle.mainWord.col;
      for (const rl of revealedLetters) {
        if (rl.row === mainRow) {
          const position = rl.col - mainCol;
          if (position >= 0 && position < targetLength) {
            locked.set(position, rl.letter.toUpperCase());
          }
        }
      }
    } else {
      const crosser = puzzle.crossers.find((c) => c.id === targetId);
      if (crosser) {
        targetLength = crosser.word.length;
        for (const rl of revealedLetters) {
          if (rl.col === crosser.startCol) {
            const position = rl.row - crosser.startRow;
            if (position >= 0 && position < targetLength) {
              locked.set(position, rl.letter.toUpperCase());
            }
          }
        }
      }
    }

    // Also lock positions from previous guesses that got "correct" feedback
    const targetGuesses = guesses.filter((g) => g.targetId === targetId);
    for (const guess of targetGuesses) {
      for (let i = 0; i < guess.feedback.length; i++) {
        const fb = guess.feedback[i];
        if (fb && fb.status === "correct") {
          locked.set(i, fb.letter.toUpperCase());
        }
      }
    }

    // Build initial guess with locked letters pre-filled
    // Use space for unfilled positions
    const initialGuess = Array.from({ length: targetLength }, (_, i) =>
      locked.has(i) ? locked.get(i)! : " "
    ).join("");

    console.log("[selectTarget] Pre-filling guess:", { targetId, locked: Object.fromEntries(locked), initialGuess });
    set({ selectedTarget: targetId, currentGuess: initialGuess });
  },

  clearToast: () => set({ toastMessage: null }),

  setShowCompletionModal: (show: boolean) => set({ showCompletionModal: show }),

  resetGame: () => {
    const puzzle = get().puzzle;
    // Clear session storage
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem(getSessionKey(puzzle.id));
      } catch {
        // Ignore storage errors
      }
    }
    set({
      guesses: [],
      currentGuess: "",
      selectedTarget: "main",
      solvedWords: new Set<string>(),
      revealedLetters: [],
      status: "playing",
      shakeTarget: null,
      toastMessage: null,
      showCompletionModal: false,
      statsRecorded: false,
      hintsUsed: 0,
      mainGuessCount: 0,
    });
  },
}));
