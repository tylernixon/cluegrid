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

const MOCK_PUZZLE: PuzzleData = {
  id: "mock-1",
  date: "2024-01-15",
  mainWord: { word: "CRANE", row: 2, col: 0, length: 5 },
  crossers: [
    {
      id: "c1",
      word: "CRISP",
      clue: "The satisfying snap of a fresh apple",
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

  // Derived
  guessesRemaining: () => number;
  targetWordLength: () => number;
  targetWord: () => string;
  keyStatuses: () => Record<string, KeyStatus>;
  guessesForTarget: (targetId: "main" | string) => Guess[];

  // Actions
  addLetter: (letter: string) => void;
  removeLetter: () => void;
  submitGuess: () => void;
  selectTarget: (targetId: "main" | string) => void;
  clearToast: () => void;
  setShowCompletionModal: (show: boolean) => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
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

  addLetter: (letter: string) => {
    const { status, currentGuess } = get();
    const maxLen = get().targetWordLength();
    if (status !== "playing") return;
    if (currentGuess.length >= maxLen) return;
    set({ currentGuess: currentGuess + letter.toUpperCase() });
  },

  removeLetter: () => {
    const { status, currentGuess } = get();
    if (status !== "playing") return;
    if (currentGuess.length === 0) return;
    set({ currentGuess: currentGuess.slice(0, -1) });
  },

  submitGuess: () => {
    const state = get();
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

    // For MVP (mock mode), skip dictionary validation and compute feedback locally
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

    set({
      guesses: newGuesses,
      currentGuess: "",
      solvedWords: newSolvedWords,
      revealedLetters: newRevealedLetters,
      status: newStatus,
    });

    // Auto-advance target if crosser was solved and game continues
    if (solved && state.selectedTarget !== "main" && newStatus === "playing") {
      // Find next unsolved crosser, then fall back to main
      const nextCrosser = state.puzzle.crossers.find(
        (c) => !newSolvedWords.has(c.id),
      );
      set({ selectedTarget: nextCrosser ? nextCrosser.id : "main" });
    }

    // Show completion modal after a delay
    if (newStatus === "won" || newStatus === "lost") {
      setTimeout(() => set({ showCompletionModal: true }), 800);
    }
  },

  selectTarget: (targetId: "main" | string) => {
    const { status, solvedWords } = get();
    if (status !== "playing") return;
    if (solvedWords.has(targetId)) return;
    set({ selectedTarget: targetId, currentGuess: "" });
  },

  clearToast: () => set({ toastMessage: null }),

  setShowCompletionModal: (show: boolean) => set({ showCompletionModal: show }),
}));
