"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface GameStats {
  gamesPlayed: number;
  gamesWon: number;
  currentStreak: number;
  maxStreak: number;
  guessDistribution: Record<1 | 2 | 3 | 4 | 5 | 6, number>;
}

interface StatsStore extends GameStats {
  // Actions
  recordGame: (won: boolean, guessCount: number) => void;
  resetStats: () => void;
}

const initialStats: GameStats = {
  gamesPlayed: 0,
  gamesWon: 0,
  currentStreak: 0,
  maxStreak: 0,
  guessDistribution: {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
    6: 0,
  },
};

export const useStatsStore = create<StatsStore>()(
  persist(
    (set, get) => ({
      ...initialStats,

      recordGame: (won: boolean, guessCount: number) => {
        const state = get();
        const newGamesPlayed = state.gamesPlayed + 1;
        const newGamesWon = won ? state.gamesWon + 1 : state.gamesWon;
        const newCurrentStreak = won ? state.currentStreak + 1 : 0;
        const newMaxStreak = Math.max(state.maxStreak, newCurrentStreak);

        // Update guess distribution (only for wins, guessCount must be 1-6)
        const newGuessDistribution = { ...state.guessDistribution };
        if (won && guessCount >= 1 && guessCount <= 6) {
          const key = guessCount as 1 | 2 | 3 | 4 | 5 | 6;
          newGuessDistribution[key] = (newGuessDistribution[key] ?? 0) + 1;
        }

        set({
          gamesPlayed: newGamesPlayed,
          gamesWon: newGamesWon,
          currentStreak: newCurrentStreak,
          maxStreak: newMaxStreak,
          guessDistribution: newGuessDistribution,
        });
      },

      resetStats: () => {
        set(initialStats);
      },
    }),
    {
      name: "cluegrid:stats",
    }
  )
);
