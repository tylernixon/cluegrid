'use client';

import { useCallback, useRef, useEffect } from 'react';
import { analytics } from '@/lib/analytics';
import type { Guess, GameStatus } from '@/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface GameAnalyticsState {
  puzzleId: string;
  puzzleDate: string;
  startTime: number;
  guessCount: number;
  crossersSolved: number;
  hasTrackedStart: boolean;
  hasTrackedCompletion: boolean;
}

interface UseGameAnalyticsOptions {
  puzzleId: string;
  puzzleDate: string;
  autoTrackStart?: boolean;
}

interface UseGameAnalyticsReturn {
  /** Call when game starts (auto-called if autoTrackStart is true) */
  trackGameStarted: () => void;
  /** Call when a guess is submitted */
  trackGuessSubmitted: (guess: Guess) => void;
  /** Call when a crosser is solved */
  trackCrosserSolved: (crosserId: string) => void;
  /** Call when game ends (won or lost) */
  trackGameCompleted: (status: GameStatus, crossersSolved: number) => void;
  /** Call when share button is clicked */
  trackShareClicked: (method: 'clipboard' | 'native') => void;
  /** Get time spent in seconds since game started */
  getTimeSpent: () => number;
  /** Reset tracking state (e.g., for new puzzle) */
  resetTracking: () => void;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useGameAnalytics({
  puzzleId,
  puzzleDate,
  autoTrackStart = false,
}: UseGameAnalyticsOptions): UseGameAnalyticsReturn {
  const stateRef = useRef<GameAnalyticsState>({
    puzzleId,
    puzzleDate,
    startTime: Date.now(),
    guessCount: 0,
    crossersSolved: 0,
    hasTrackedStart: false,
    hasTrackedCompletion: false,
  });

  // Update ref when puzzle changes
  useEffect(() => {
    if (stateRef.current.puzzleId !== puzzleId) {
      stateRef.current = {
        puzzleId,
        puzzleDate,
        startTime: Date.now(),
        guessCount: 0,
        crossersSolved: 0,
        hasTrackedStart: false,
        hasTrackedCompletion: false,
      };
    }
  }, [puzzleId, puzzleDate]);

  // Auto-track game start if enabled
  useEffect(() => {
    if (autoTrackStart && !stateRef.current.hasTrackedStart) {
      analytics.trackGameStarted({
        puzzleId: stateRef.current.puzzleId,
        date: stateRef.current.puzzleDate,
      });
      stateRef.current.hasTrackedStart = true;
      stateRef.current.startTime = Date.now();
    }
  }, [autoTrackStart, puzzleId]);

  const trackGameStarted = useCallback(() => {
    if (stateRef.current.hasTrackedStart) return;

    analytics.trackGameStarted({
      puzzleId: stateRef.current.puzzleId,
      date: stateRef.current.puzzleDate,
    });
    stateRef.current.hasTrackedStart = true;
    stateRef.current.startTime = Date.now();
  }, []);

  const trackGuessSubmitted = useCallback((guess: Guess) => {
    stateRef.current.guessCount++;

    const isCorrect = guess.feedback.every((f) => f.status === 'correct');
    const targetType = guess.targetId === 'main' ? 'main' : 'crosser';

    analytics.trackGuessSubmitted({
      puzzleId: stateRef.current.puzzleId,
      guessNumber: stateRef.current.guessCount,
      targetType,
      correct: isCorrect,
    });
  }, []);

  const trackCrosserSolved = useCallback((crosserId: string) => {
    stateRef.current.crossersSolved++;

    analytics.trackCrosserSolved({
      puzzleId: stateRef.current.puzzleId,
      crosserId,
    });
  }, []);

  const trackGameCompleted = useCallback(
    (status: GameStatus, crossersSolved: number) => {
      if (stateRef.current.hasTrackedCompletion) return;
      if (status === 'playing') return;

      const timeSpent = Math.round(
        (Date.now() - stateRef.current.startTime) / 1000
      );

      analytics.trackGameCompleted({
        puzzleId: stateRef.current.puzzleId,
        won: status === 'won',
        totalGuesses: stateRef.current.guessCount,
        crossersSolved,
        timeSpent,
      });

      stateRef.current.hasTrackedCompletion = true;
    },
    []
  );

  const trackShareClicked = useCallback((method: 'clipboard' | 'native') => {
    analytics.trackShareClicked({
      puzzleId: stateRef.current.puzzleId,
      method,
    });
  }, []);

  const getTimeSpent = useCallback(() => {
    return Math.round((Date.now() - stateRef.current.startTime) / 1000);
  }, []);

  const resetTracking = useCallback(() => {
    stateRef.current = {
      puzzleId: stateRef.current.puzzleId,
      puzzleDate: stateRef.current.puzzleDate,
      startTime: Date.now(),
      guessCount: 0,
      crossersSolved: 0,
      hasTrackedStart: false,
      hasTrackedCompletion: false,
    };
  }, []);

  return {
    trackGameStarted,
    trackGuessSubmitted,
    trackCrosserSolved,
    trackGameCompleted,
    trackShareClicked,
    getTimeSpent,
    resetTracking,
  };
}
