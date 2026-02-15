"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Badge, BadgeId, GameResult } from "@/types";
import { BADGE_DEFINITIONS } from "@/types";

// Get today's date in YYYY-MM-DD format (UTC)
function getTodayUTC(): string {
  return new Date().toISOString().split("T")[0]!;
}

// Parse date string to Date object (treating as UTC)
function parseDate(dateStr: string): Date {
  return new Date(dateStr + "T00:00:00Z");
}

// Calculate days between two date strings
function daysBetween(date1: string, date2: string): number {
  const d1 = parseDate(date1);
  const d2 = parseDate(date2);
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

export interface GameStats {
  gamesPlayed: number;
  gamesWon: number;
  currentStreak: number;
  maxStreak: number;
  guessDistribution: Record<1 | 2 | 3 | 4 | 5 | 6, number>;
  // Streak tracking
  lastPlayedDate: string | null;
  lastWinDate: string | null;
  // Grace save: 1 free "save" every 30 days to preserve streak
  graceSavesAvailable: number;
  lastGraceSaveRefresh: string | null;
  streakSavedByGrace: boolean; // Was the current streak saved by grace?
  // Badges
  badges: Badge[];
  newBadges: Badge[]; // Badges earned in the current session (for notifications)
  consecutivePerfectSolves: number; // Track consecutive 3-star solves
}

interface StatsStore extends GameStats {
  // Actions
  recordGame: (won: boolean, guessCount: number, puzzleDate?: string) => void;
  checkAndAwardBadges: (result: GameResult) => void;
  clearNewBadges: () => void;
  useGraceSave: () => boolean;
  resetStats: () => void;
  // Computed
  isStreakPaused: () => boolean;
  canUseGraceSave: () => boolean;
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
  lastPlayedDate: null,
  lastWinDate: null,
  graceSavesAvailable: 1,
  lastGraceSaveRefresh: null,
  streakSavedByGrace: false,
  badges: [],
  newBadges: [],
  consecutivePerfectSolves: 0,
};

export const useStatsStore = create<StatsStore>()(
  persist(
    (set, get) => ({
      ...initialStats,

      recordGame: (won: boolean, guessCount: number, puzzleDate?: string) => {
        const state = get();
        const today = puzzleDate ?? getTodayUTC();

        // Check if grace saves should be refreshed (every 30 days)
        let newGraceSaves = state.graceSavesAvailable;
        let newGraceRefresh = state.lastGraceSaveRefresh;
        if (!state.lastGraceSaveRefresh || daysBetween(state.lastGraceSaveRefresh, today) >= 30) {
          newGraceSaves = 1;
          newGraceRefresh = today;
        }

        const newGamesPlayed = state.gamesPlayed + 1;
        const newGamesWon = won ? state.gamesWon + 1 : state.gamesWon;

        // Calculate streak
        let newCurrentStreak = state.currentStreak;
        let newStreakSavedByGrace = state.streakSavedByGrace;

        if (won) {
          // Check if this continues a streak
          if (state.lastWinDate) {
            const daysSinceLastWin = daysBetween(state.lastWinDate, today);
            if (daysSinceLastWin === 1) {
              // Consecutive day - continue streak
              newCurrentStreak = state.currentStreak + 1;
              newStreakSavedByGrace = false;
            } else if (daysSinceLastWin === 0) {
              // Same day - don't increment (shouldn't happen, but handle it)
              newCurrentStreak = state.currentStreak;
            } else {
              // Streak broken - start fresh
              newCurrentStreak = 1;
              newStreakSavedByGrace = false;
            }
          } else {
            // First win ever
            newCurrentStreak = 1;
            newStreakSavedByGrace = false;
          }
        } else {
          // Lost - streak pauses (we say "paused" not "broken")
          // Streak value stays, but won't grow until next win
          // If they miss a day after this, streak resets
          newCurrentStreak = state.currentStreak;
        }

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
          lastPlayedDate: today,
          lastWinDate: won ? today : state.lastWinDate,
          graceSavesAvailable: newGraceSaves,
          lastGraceSaveRefresh: newGraceRefresh,
          streakSavedByGrace: newStreakSavedByGrace,
        });
      },

      checkAndAwardBadges: (result: GameResult) => {
        const state = get();
        const earnedIds = new Set(state.badges.map((b) => b.id));
        const newlyEarned: Badge[] = [];
        const now = new Date().toISOString();

        function award(id: BadgeId) {
          if (earnedIds.has(id)) return;
          const def = BADGE_DEFINITIONS[id];
          newlyEarned.push({ ...def, earnedAt: now });
        }

        if (result.won) {
          // First Win
          award("first_win");

          // Genius - solved with 0 hints
          if (result.hintsUsed === 0) {
            award("genius");
          }

          // Quick Thinker - solved in 2 or fewer guesses
          if (result.guessCount <= 2) {
            award("quick_thinker");
          }

          // Hint Master - solved after using all hints
          if (result.hintsUsed === result.totalCrossers && result.totalCrossers > 0) {
            award("hint_master");
          }

          // Streak badges (use the already-updated streak from recordGame)
          if (state.currentStreak >= 3) award("streak_3");
          if (state.currentStreak >= 7) award("streak_7");
          if (state.currentStreak >= 30) award("streak_30");

          // Century - 100 wins
          if (state.gamesWon >= 100) {
            award("century");
          }

          // Perfectionist - 5 consecutive 3-star solves
          const newConsecutive = result.starRating === 3
            ? state.consecutivePerfectSolves + 1
            : 0;

          if (newConsecutive >= 5) {
            award("perfectionist");
          }

          set({ consecutivePerfectSolves: newConsecutive });
        } else {
          // Lost - reset consecutive perfect streak
          set({ consecutivePerfectSolves: 0 });
        }

        if (newlyEarned.length > 0) {
          set({
            badges: [...state.badges, ...newlyEarned],
            newBadges: newlyEarned,
          });
        }
      },

      clearNewBadges: () => {
        set({ newBadges: [] });
      },

      useGraceSave: () => {
        const state = get();
        if (state.graceSavesAvailable <= 0 || state.currentStreak === 0) {
          return false;
        }

        // Grace save preserves the streak when you'd otherwise lose it
        set({
          graceSavesAvailable: state.graceSavesAvailable - 1,
          streakSavedByGrace: true,
          // Update lastWinDate to today so streak can continue tomorrow
          lastWinDate: getTodayUTC(),
        });

        return true;
      },

      isStreakPaused: () => {
        const state = get();
        if (!state.lastWinDate || state.currentStreak === 0) return false;
        const today = getTodayUTC();
        const daysSinceWin = daysBetween(state.lastWinDate, today);
        // Streak is paused if more than 1 day has passed since last win
        return daysSinceWin > 1;
      },

      canUseGraceSave: () => {
        const state = get();
        return state.graceSavesAvailable > 0 && state.currentStreak > 0 && state.isStreakPaused();
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
