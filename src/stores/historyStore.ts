"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Difficulty, StarRating } from "@/types";

// ---------------------------------------------------------------------------
// Data model
// ---------------------------------------------------------------------------

export interface GameHistoryEntry {
  puzzleId: string;
  puzzleDate: string;       // YYYY-MM-DD
  playedAt: string;         // ISO timestamp
  status: "won" | "lost";
  guessCount: number;
  hintsUsed: number;
  starRating: StarRating;
  difficulty: Difficulty;
  guessWords: string[];     // Just the words guessed, not full feedback
}

// ---------------------------------------------------------------------------
// Store interface
// ---------------------------------------------------------------------------

interface HistoryStore {
  history: GameHistoryEntry[];

  // Actions
  recordGame: (entry: GameHistoryEntry) => void;
  getEntryForDate: (date: string) => GameHistoryEntry | undefined;
  getPlayedDates: () => string[];
  clearHistory: () => void;
}

// ---------------------------------------------------------------------------
// localStorage quota helper
// ---------------------------------------------------------------------------

/**
 * Safely write to localStorage, pruning oldest history entries if quota is
 * exceeded.  The Zustand persist middleware serialises the entire store into
 * a single key.  If that write fails with a QuotaExceededError we trim the
 * oldest entries and retry.
 */
function safeSetItem(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch (e: unknown) {
    if (
      e instanceof DOMException &&
      (e.name === "QuotaExceededError" || e.code === 22)
    ) {
      // Parse, trim oldest 20% of history, then retry
      try {
        const parsed = JSON.parse(value);
        if (parsed?.state?.history && Array.isArray(parsed.state.history)) {
          const trimCount = Math.max(
            1,
            Math.floor(parsed.state.history.length * 0.2),
          );
          parsed.state.history = parsed.state.history.slice(trimCount);
          localStorage.setItem(key, JSON.stringify(parsed));
          return;
        }
      } catch {
        // If parsing fails, remove the key entirely to avoid a stuck state
      }
      localStorage.removeItem(key);
    }
  }
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

const STORAGE_KEY = "gist:history";

export const useHistoryStore = create<HistoryStore>()(
  persist(
    (set, get) => ({
      history: [],

      recordGame: (entry: GameHistoryEntry) => {
        const state = get();
        // Avoid duplicate entries for the same puzzle
        if (state.history.some((h) => h.puzzleId === entry.puzzleId)) {
          return;
        }
        set({ history: [...state.history, entry] });
      },

      getEntryForDate: (date: string) => {
        return get().history.find((h) => h.puzzleDate === date);
      },

      getPlayedDates: () => {
        return get().history.map((h) => h.puzzleDate);
      },

      clearHistory: () => {
        set({ history: [] });
      },
    }),
    {
      name: STORAGE_KEY,
      storage: {
        getItem: (name) => {
          if (typeof window === "undefined") return null;
          try {
            const raw = localStorage.getItem(name);
            return raw ? JSON.parse(raw) : null;
          } catch {
            return null;
          }
        },
        setItem: (name, value) => {
          if (typeof window === "undefined") return;
          safeSetItem(name, JSON.stringify(value));
        },
        removeItem: (name) => {
          if (typeof window === "undefined") return;
          localStorage.removeItem(name);
        },
      },
    },
  ),
);
