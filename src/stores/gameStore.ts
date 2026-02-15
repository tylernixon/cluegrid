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

  // Check cache first
  if (validatedWords.has(normalized)) {
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
  validatedWords.add(mainWord.trim().toUpperCase());
  for (const c of crossers) {
    validatedWords.add(c.word.trim().toUpperCase());
  }
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

  // Derived
  maxGuesses: () => number;
  guessesRemaining: () => number;
  targetWordLength: () => number;
  targetWord: () => string;
  keyStatuses: () => Record<string, KeyStatus>;
  guessesForTarget: (targetId: "main" | string) => Guess[];
  starRating: () => StarRating;

  // Actions
  fetchPuzzle: () => Promise<void>;
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

function getTodayDate(): string {
  return new Date().toISOString().split("T")[0]!;
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

  // -----------------------------------------------------------------------
  // Actions
  // -----------------------------------------------------------------------

  setDifficulty: (difficulty: Difficulty) => {
    saveDifficulty(difficulty);
    set({ difficulty });
  },

  fetchPuzzle: async () => {
    if (get().puzzleLoaded) return;

    set({ isLoading: true, error: null });

    try {
      const today = getTodayDate();

      // Check if URL has cache-bust param (e.g., ?t=123)
      const urlParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
      const shouldBustCache = urlParams?.has("t") || urlParams?.has("bust");
      const bustParam = shouldBustCache ? "?bust" : "";

      const response = await fetch(`/api/puzzle/${today}${bustParam}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch puzzle: ${response.status}`);
      }

      const data = await response.json();
      const puzzle: PuzzleData = data.puzzle;

      addPuzzleWordsToCache(puzzle.mainWord.word, puzzle.crossers);

      const session = loadSession(puzzle.id);

      if (session) {
        set({
          puzzle,
          guesses: session.guesses ?? [],
          currentGuess: "",
          selectedTarget: session.selectedTarget ?? "main",
          solvedWords: new Set(session.solvedWords ?? []),
          revealedLetters: session.revealedLetters ?? [],
          status: session.status ?? "playing",
          statsRecorded: session.statsRecorded ?? false,
          difficulty: session.difficulty ?? loadDifficulty(),
          hintsUsed: session.hintsUsed ?? 0,
          mainGuessCount: session.mainGuessCount ?? 0,
          isLoading: false,
          puzzleLoaded: true,
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
        });
      }
    } catch (err) {
      console.error("Failed to fetch puzzle:", err);
      addPuzzleWordsToCache(MOCK_PUZZLE.mainWord.word, MOCK_PUZZLE.crossers);

      const session = loadSession(MOCK_PUZZLE.id);

      if (session) {
        set({
          puzzle: MOCK_PUZZLE,
          guesses: session.guesses ?? [],
          currentGuess: "",
          selectedTarget: session.selectedTarget ?? "main",
          solvedWords: new Set(session.solvedWords ?? []),
          revealedLetters: session.revealedLetters ?? [],
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

  addLetter: (letter: string) => {
    const { status, currentGuess, isLoading, isSubmitting } = get();
    if (isLoading || isSubmitting) return;
    const maxLen = get().targetWordLength();
    if (status !== "playing") return;
    if (currentGuess.length >= maxLen) return;
    set({ currentGuess: currentGuess + letter.toUpperCase() });
  },

  removeLetter: () => {
    const { status, currentGuess, isLoading } = get();
    if (isLoading) return;
    if (status !== "playing") return;
    if (currentGuess.length === 0) return;
    set({ currentGuess: currentGuess.slice(0, -1) });
  },

  submitGuess: async () => {
    const state = get();
    if (state.isLoading || state.isSubmitting) return;
    if (state.status !== "playing") return;

    // Lock to prevent race conditions with typing
    set({ isSubmitting: true });

    const isMainGuess = state.selectedTarget === "main";

    // For main-word guesses, check the guess budget
    if (isMainGuess && state.guessesRemaining() <= 0) {
      set({ isSubmitting: false, toastMessage: "No guesses remaining" });
      return;
    }

    const requiredLength = state.targetWordLength();
    // Trim and uppercase guess immediately - use this clean value throughout
    const guess = state.currentGuess.trim().toUpperCase();

    // Check length
    if (guess.length < requiredLength) {
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
    const answer = (
      state.selectedTarget === "main"
        ? state.puzzle.mainWord.word
        : state.puzzle.crossers.find((c) => c.id === state.selectedTarget)?.word ?? ""
    ).trim().toUpperCase();

    // Debug: log comparison (remove after fixing)
    console.log("Guess comparison:", { guess, answer, match: guess === answer });

    // If the guess matches the answer, skip dictionary validation
    // (handles words not in dictionary but valid as puzzle answers)
    if (guess !== answer) {
      // Validate word against dictionary
      const isValid = await validateWord(guess);
      if (!isValid) {
        set({ isSubmitting: false, shakeTarget: state.selectedTarget, toastMessage: "Not in word list" });
        setTimeout(() => set({ shakeTarget: null }), 300);
        return;
      }
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

    // Record stats if game is over
    let newStatsRecorded = state.statsRecorded;
    if ((newStatus === "won" || newStatus === "lost") && !state.statsRecorded) {
      const statsStore = useStatsStore.getState();
      statsStore.recordGame(newStatus === "won", newMainGuessCount);

      // Check and award badges
      const gameResult: GameResult = {
        won: newStatus === "won",
        guessCount: newMainGuessCount,
        hintsUsed: newHintsUsed,
        totalCrossers: state.puzzle.crossers.length,
        starRating: calculateStars(newHintsUsed, state.puzzle.crossers.length),
      };
      statsStore.checkAndAwardBadges(gameResult);

      newStatsRecorded = true;
    }

    set({
      isSubmitting: false,
      guesses: newGuesses,
      currentGuess: "",
      solvedWords: newSolvedWords,
      revealedLetters: newRevealedLetters,
      status: newStatus,
      selectedTarget: newSelectedTarget,
      statsRecorded: newStatsRecorded,
      hintsUsed: newHintsUsed,
      mainGuessCount: newMainGuessCount,
    });

    // Save session to localStorage
    saveSession(get());

    // Show completion modal after a delay
    if (newStatus === "won" || newStatus === "lost") {
      setTimeout(() => set({ showCompletionModal: true }), 800);
    }
  },

  selectTarget: (targetId: "main" | string) => {
    const { status, solvedWords, isLoading } = get();
    if (isLoading) return;
    if (status !== "playing") return;
    if (solvedWords.has(targetId)) return;
    set({ selectedTarget: targetId, currentGuess: "" });
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
