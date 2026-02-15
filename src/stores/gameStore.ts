"use client";

import { create } from "zustand";
import type {
  PuzzleData,
  Guess,
  LetterFeedback,
  GameStatus,
  RevealedLetter,
  KeyStatus,
} from "@/types";
import { useStatsStore } from "./statsStore";

// Fallback mock puzzle used while loading or if fetch fails
const MOCK_PUZZLE: PuzzleData = {
  id: "mock-1",
  date: "2024-01-15",
  mainWord: { word: "CRANE", row: 2, col: 0, length: 5 },
  crossers: [
    {
      id: "c1",
      word: "OCCUR",
      clue: "To happen or take place",
      direction: "down",
      startRow: 0,
      startCol: 0,
      intersectionIndex: 2,
    },
    {
      id: "c2",
      word: "GRAPE",
      clue: "A small fruit that grows in bunches",
      direction: "down",
      startRow: 0,
      startCol: 2,
      intersectionIndex: 2,
    },
    {
      id: "c3",
      word: "DANCE",
      clue: "What couples do on a ballroom floor",
      direction: "down",
      startRow: 0,
      startCol: 3,
      intersectionIndex: 2,
    },
  ],
  gridSize: { rows: 5, cols: 5 },
};

// Compute Wordle-style feedback for a guess against an answer
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

  // Loading state
  isLoading: boolean;
  error: string | null;
  puzzleLoaded: boolean;

  // Derived
  guessesRemaining: () => number;
  targetWordLength: () => number;
  targetWord: () => string;
  keyStatuses: () => Record<string, KeyStatus>;
  guessesForTarget: (targetId: "main" | string) => Guess[];

  // Actions
  fetchPuzzle: () => Promise<void>;
  addLetter: (letter: string) => void;
  removeLetter: () => void;
  submitGuess: () => void;
  selectTarget: (targetId: "main" | string) => void;
  clearToast: () => void;
  setShowCompletionModal: (show: boolean) => void;
  resetGame: () => void;
}

// Helper to get current puzzle ID for session storage
function getSessionKey(puzzleId: string): string {
  return `cluegrid:session:${puzzleId}`;
}

// Session data structure for localStorage
interface SessionData {
  puzzleId: string;
  guesses: Guess[];
  solvedWords: string[];
  revealedLetters: RevealedLetter[];
  status: GameStatus;
  selectedTarget: string;
  statsRecorded: boolean;
}

// Load session from localStorage
function loadSession(puzzleId: string): Partial<SessionData> | null {
  if (typeof window === "undefined") return null;
  try {
    const key = getSessionKey(puzzleId);
    const data = localStorage.getItem(key);
    if (!data) return null;
    const parsed = JSON.parse(data) as SessionData;
    // Validate it's for the same puzzle
    if (parsed.puzzleId !== puzzleId) return null;
    return parsed;
  } catch {
    return null;
  }
}

// Save session to localStorage
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
    };
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // Ignore storage errors
  }
}

// Get today's date in YYYY-MM-DD format
function getTodayDate(): string {
  return new Date().toISOString().split("T")[0]!;
}

export const useGameStore = create<GameStore>((set, get) => ({
  // Initial state with mock puzzle
  puzzle: MOCK_PUZZLE,
  guesses: [],
  currentGuess: "",
  selectedTarget: "c1",
  solvedWords: new Set<string>(),
  revealedLetters: [],
  status: "playing",
  shakeTarget: null,
  toastMessage: null,
  showCompletionModal: false,
  statsRecorded: false,
  isLoading: true,
  error: null,
  puzzleLoaded: false,

  guessesRemaining: () => 6 - get().guesses.length,

  targetWordLength: () => {
    const { puzzle, selectedTarget } = get();
    if (selectedTarget === "main") return puzzle.mainWord.length;
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
    const { guesses } = get();
    for (const guess of guesses) {
      for (const fb of guess.feedback) {
        const key = fb.letter;
        const current = statuses[key] ?? "unused";
        // Priority: correct > present > absent > unused
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

  fetchPuzzle: async () => {
    // Don't fetch again if already loaded
    if (get().puzzleLoaded) return;

    set({ isLoading: true, error: null });

    try {
      const today = getTodayDate();
      const response = await fetch(`/api/puzzle/${today}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch puzzle: ${response.status}`);
      }

      const data = await response.json();
      const puzzle: PuzzleData = data.puzzle;

      // Load any saved session for this puzzle
      const session = loadSession(puzzle.id);
      const firstCrosserId = puzzle.crossers[0]?.id ?? "c1";

      if (session) {
        set({
          puzzle,
          guesses: session.guesses ?? [],
          currentGuess: "",
          selectedTarget: session.selectedTarget ?? firstCrosserId,
          solvedWords: new Set(session.solvedWords ?? []),
          revealedLetters: session.revealedLetters ?? [],
          status: session.status ?? "playing",
          statsRecorded: session.statsRecorded ?? false,
          isLoading: false,
          puzzleLoaded: true,
        });
      } else {
        set({
          puzzle,
          guesses: [],
          currentGuess: "",
          selectedTarget: firstCrosserId,
          solvedWords: new Set<string>(),
          revealedLetters: [],
          status: "playing",
          statsRecorded: false,
          isLoading: false,
          puzzleLoaded: true,
        });
      }
    } catch (err) {
      console.error("Failed to fetch puzzle:", err);
      // Fall back to mock puzzle
      const session = loadSession(MOCK_PUZZLE.id);
      const firstCrosserId = MOCK_PUZZLE.crossers[0]?.id ?? "c1";

      if (session) {
        set({
          puzzle: MOCK_PUZZLE,
          guesses: session.guesses ?? [],
          currentGuess: "",
          selectedTarget: session.selectedTarget ?? firstCrosserId,
          solvedWords: new Set(session.solvedWords ?? []),
          revealedLetters: session.revealedLetters ?? [],
          status: session.status ?? "playing",
          statsRecorded: session.statsRecorded ?? false,
          isLoading: false,
          error: err instanceof Error ? err.message : "Failed to load puzzle",
          puzzleLoaded: true,
        });
      } else {
        set({
          puzzle: MOCK_PUZZLE,
          guesses: [],
          currentGuess: "",
          selectedTarget: firstCrosserId,
          solvedWords: new Set<string>(),
          revealedLetters: [],
          status: "playing",
          statsRecorded: false,
          isLoading: false,
          error: err instanceof Error ? err.message : "Failed to load puzzle",
          puzzleLoaded: true,
        });
      }
    }
  },

  addLetter: (letter: string) => {
    const { status, currentGuess, isLoading } = get();
    if (isLoading) return;
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

  submitGuess: () => {
    const state = get();
    if (state.isLoading) return;
    if (state.status !== "playing") return;
    if (state.guessesRemaining() <= 0) return;

    const requiredLength = state.targetWordLength();
    const guess = state.currentGuess.toUpperCase();

    // Check length
    if (guess.length < requiredLength) {
      set({ shakeTarget: state.selectedTarget, toastMessage: "Not enough letters" });
      setTimeout(() => set({ shakeTarget: null }), 300);
      return;
    }

    // Check if target is already solved
    if (state.solvedWords.has(state.selectedTarget)) {
      set({ toastMessage: "Already solved" });
      return;
    }

    // For MVP, compute feedback locally (client has answers)
    const answer = state.targetWord();
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

    if (solved) {
      newSolvedWords.add(state.selectedTarget);

      // If a crosser was solved, reveal the intersection letter in the main word
      if (state.selectedTarget !== "main") {
        const crosser = state.puzzle.crossers.find(
          (c) => c.id === state.selectedTarget,
        );
        if (crosser) {
          const mainRow = state.puzzle.mainWord.row;
          const col = crosser.startCol;
          const letter = crosser.word[crosser.intersectionIndex]!;
          newRevealedLetters.push({ row: mainRow, col, letter });
        }
      }
    }

    // Determine game status
    let newStatus: GameStatus = "playing";
    if (state.selectedTarget === "main" && solved) {
      newStatus = "won";
    } else if (newGuesses.length >= 6) {
      newStatus = "lost";
    }

    // Determine new target for auto-advance
    let newSelectedTarget = state.selectedTarget;
    if (solved && state.selectedTarget !== "main" && newStatus === "playing") {
      // Find next unsolved crosser, then fall back to main
      const nextCrosser = state.puzzle.crossers.find(
        (c) => !newSolvedWords.has(c.id),
      );
      newSelectedTarget = nextCrosser ? nextCrosser.id : "main";
    }

    // Record stats if game is over
    let newStatsRecorded = state.statsRecorded;
    if ((newStatus === "won" || newStatus === "lost") && !state.statsRecorded) {
      useStatsStore.getState().recordGame(newStatus === "won", newGuesses.length);
      newStatsRecorded = true;
    }

    set({
      guesses: newGuesses,
      currentGuess: "",
      solvedWords: newSolvedWords,
      revealedLetters: newRevealedLetters,
      status: newStatus,
      selectedTarget: newSelectedTarget,
      statsRecorded: newStatsRecorded,
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
    const firstCrosserId = puzzle.crossers[0]?.id ?? "c1";
    set({
      guesses: [],
      currentGuess: "",
      selectedTarget: firstCrosserId,
      solvedWords: new Set<string>(),
      revealedLetters: [],
      status: "playing",
      shakeTarget: null,
      toastMessage: null,
      showCompletionModal: false,
      statsRecorded: false,
    });
  },
}));
