import { useCallback, useRef } from 'react';
import { analytics } from '@/lib/analytics';
import type { Guess } from '@/types';

interface CompletionStats {
  gamesPlayed: number;
  gamesWon: number;
  currentStreak: number;
  maxStreak: number;
}

export function useAnalytics() {
  return {
    track: analytics.track.bind(analytics),
  };
}

export function usePuzzleAnalytics(puzzleId: string, puzzleDate: string) {
  const startTime = useRef(Date.now());
  const guessCount = useRef(0);
  const crossersSolved = useRef(0);

  const trackPuzzleStart = useCallback(
    (opts: { isFirstPuzzle: boolean; crosserCount: number }) => {
      startTime.current = Date.now();
      guessCount.current = 0;
      crossersSolved.current = 0;

      analytics.track('puzzle_started', {
        puzzle_id: puzzleId,
        puzzle_date: puzzleDate,
        is_first_puzzle: opts.isFirstPuzzle,
        crosser_count: opts.crosserCount,
      });
    },
    [puzzleId, puzzleDate],
  );

  const trackGuess = useCallback(
    (guess: Guess) => {
      guessCount.current++;
      const correct = guess.feedback.filter((f) => f.status === 'correct').length;
      const present = guess.feedback.filter((f) => f.status === 'present').length;

      analytics.track('guess_submitted', {
        puzzle_id: puzzleId,
        guess_number: guessCount.current,
        target_word: guess.targetId === 'main' ? 'main' : 'crosser',
        word_length: guess.word.length,
        result: 'valid',
        letters_correct: correct,
        letters_present: present,
        solved_word: guess.feedback.every((f) => f.status === 'correct'),
      });
    },
    [puzzleId],
  );

  const trackCrosserSolved = useCallback(
    (crosserIndex: number, onGuess: number, lettersRevealed: number) => {
      crossersSolved.current++;
      analytics.track('crosser_solved', {
        puzzle_id: puzzleId,
        crosser_index: crosserIndex,
        guess_number: onGuess,
        letters_revealed: lettersRevealed,
      });
    },
    [puzzleId],
  );

  const trackCompletion = useCallback(
    (result: 'won' | 'lost', stats: CompletionStats, totalCrossers: number) => {
      const duration = Math.round((Date.now() - startTime.current) / 1000);

      analytics.track('puzzle_completed', {
        puzzle_id: puzzleId,
        puzzle_date: puzzleDate,
        result,
        guess_count: guessCount.current,
        crossers_solved: crossersSolved.current,
        total_crossers: totalCrossers,
        duration_seconds: duration,
        streak_current: stats.currentStreak,
        streak_extended: result === 'won',
      });

      analytics.setUserProperty('total_games_played', stats.gamesPlayed);
      analytics.setUserProperty('total_games_won', stats.gamesWon);
      analytics.setUserProperty('longest_streak', stats.maxStreak);
      analytics.setUserProperty('last_active', new Date().toISOString());
    },
    [puzzleId, puzzleDate],
  );

  const trackShare = useCallback(
    (result: 'won' | 'lost', method: 'button_click' | 'keyboard_shortcut' = 'button_click') => {
      analytics.track('share_copied', {
        puzzle_id: puzzleId,
        result,
        guess_count: guessCount.current,
        method,
      });
    },
    [puzzleId],
  );

  return {
    trackPuzzleStart,
    trackGuess,
    trackCrosserSolved,
    trackCompletion,
    trackShare,
  };
}
