"use client";

import { useState, useEffect, useMemo } from "react";
import { ModalShell } from "@/components/ui/ModalShell";
import { ShareButton } from "@/components/ui/ShareButton";
import type { PuzzleData, Guess, LetterFeedback } from "@/types";
import type { GameHistoryEntry } from "@/stores/historyStore";

interface HistoryDetailModalProps {
  open: boolean;
  onClose: () => void;
  entry: GameHistoryEntry;
  puzzle: PuzzleData | null;
  isLoadingPuzzle: boolean;
}

function reconstructGuesses(
  entry: GameHistoryEntry,
  puzzle: PuzzleData,
): Guess[] {
  const mainAnswer = puzzle.mainWord.word.toUpperCase();

  return entry.guessWords.map((word) => {
    const upper = word.toUpperCase();
    const feedback = computeFeedback(upper, mainAnswer);
    return {
      word: upper,
      targetId: "main" as const,
      feedback,
    };
  });
}

function computeFeedback(guess: string, answer: string): LetterFeedback[] {
  const result: LetterFeedback[] = Array.from(guess, (letter) => ({
    letter,
    status: "absent" as const,
  }));
  const remaining: (string | null)[] = answer.split("");

  for (let i = 0; i < guess.length; i++) {
    if (guess[i] === remaining[i]) {
      result[i] = { letter: guess[i]!, status: "correct" };
      remaining[i] = null;
    }
  }

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

export function HistoryDetailModal({
  open,
  onClose,
  entry,
  puzzle,
  isLoadingPuzzle,
}: HistoryDetailModalProps) {
  const [hasAnimated, setHasAnimated] = useState(false);

  const won = entry.status === "won";

  const guesses = useMemo(() => {
    if (!puzzle) return [];
    return reconstructGuesses(entry, puzzle);
  }, [entry, puzzle]);

  const solvedWords = useMemo(() => {
    const set = new Set<string>();
    if (won) set.add("main");
    if (puzzle) {
      for (let i = 0; i < entry.hintsUsed && i < puzzle.crossers.length; i++) {
        set.add(puzzle.crossers[i]!.id);
      }
    }
    return set;
  }, [won, puzzle, entry.hintsUsed]);

  const displayDate = useMemo(() => {
    const date = new Date(entry.puzzleDate + "T12:00:00");
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }, [entry.puzzleDate]);

  useEffect(() => {
    if (open && !hasAnimated) {
      const timer = setTimeout(() => setHasAnimated(true), 100);
      return () => clearTimeout(timer);
    }
    if (!open) {
      setHasAnimated(false);
    }
  }, [open, hasAnimated]);

  const title = won ? "Solved!" : "Not solved";

  const footer = (
    <div
      className={`flex gap-3 justify-center transition-all duration-500 ${hasAnimated ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
    >
      {puzzle && guesses.length > 0 && (
        <ShareButton
          puzzle={puzzle}
          guesses={guesses}
          solvedWords={solvedWords}
          won={won}
          size="large"
          className={`flex-1 max-w-[160px] justify-center rounded-xl shadow-md ${
            won ? "!bg-correct dark:!bg-correct-dark hover:!brightness-110" : ""
          }`}
        />
      )}
      <button
        type="button"
        className="flex-1 max-w-[160px] px-6 py-3 bg-surface-raised/80 dark:bg-surface-raised-dark/80 backdrop-blur-sm text-ink dark:text-ink-dark border border-border dark:border-border-dark rounded-xl font-semibold text-body hover:bg-surface-raised dark:hover:bg-surface-raised-dark transition-all active:scale-[0.97]"
        onClick={onClose}
      >
        Close
      </button>
    </div>
  );

  return (
    <ModalShell open={open} onClose={onClose} title={title} footer={footer} centerContent>
      <div className="text-center">
        {/* Date header */}
        <div
          className={`transition-all duration-500 ${hasAnimated ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
        >
          <p className="text-caption text-ink-tertiary dark:text-ink-tertiary-dark uppercase tracking-wider mb-2">
            {displayDate}
          </p>

          {!won && (
            <>
              <p className="text-heading-2 text-ink dark:text-ink-dark mb-1">
                Not quite
              </p>
              {puzzle && (
                <p className="text-body text-ink-secondary dark:text-ink-secondary-dark">
                  The word was{" "}
                  <span className="font-mono font-bold text-ink dark:text-ink-dark tracking-wider">
                    {puzzle.mainWord.word}
                  </span>
                </p>
              )}
            </>
          )}
        </div>

        {/* Theme reveal */}
        {puzzle?.theme && (
          <div
            className={`mt-4 px-4 py-3 rounded-xl bg-gradient-to-br from-surface-raised to-surface dark:from-surface-raised-dark dark:to-surface-dark border border-border/50 dark:border-border-dark/50 inline-block transition-all duration-500 delay-100 ${hasAnimated ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
          >
            <p className="text-caption text-ink-tertiary dark:text-ink-tertiary-dark uppercase tracking-wider mb-1">
              Theme
            </p>
            <p className="text-heading-3 text-ink dark:text-ink-dark">
              {puzzle.theme}
            </p>
          </div>
        )}

        {/* Stats row */}
        <div
          className={`mt-6 flex items-center justify-center gap-6 transition-all duration-500 delay-200 ${hasAnimated ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
        >
          <div className="text-center">
            <p className="text-stat text-ink dark:text-ink-dark">
              {entry.guessCount}
            </p>
            <p className="text-caption text-ink-tertiary dark:text-ink-tertiary-dark uppercase tracking-wider">
              {entry.guessCount === 1 ? "Guess" : "Guesses"}
            </p>
          </div>

          <div className="w-px h-12 bg-border dark:bg-border-dark" />

          <div className="text-center">
            <p className="text-stat text-ink dark:text-ink-dark">
              {entry.hintsUsed}
            </p>
            <p className="text-caption text-ink-tertiary dark:text-ink-tertiary-dark uppercase tracking-wider">
              Hints
            </p>
          </div>

          <div className="w-px h-12 bg-border dark:bg-border-dark" />

          <div className="text-center">
            <p className="text-stat text-ink dark:text-ink-dark capitalize">
              {entry.difficulty}
            </p>
            <p className="text-caption text-ink-tertiary dark:text-ink-tertiary-dark uppercase tracking-wider">
              Mode
            </p>
          </div>
        </div>

        {/* Visual results */}
        {won && puzzle ? (
          <div
            className={`mt-6 transition-all duration-500 delay-300 ${hasAnimated ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
          >
            <p className="text-caption text-ink-tertiary dark:text-ink-tertiary-dark mb-3 uppercase tracking-wider">
              Your solve
            </p>
            <div className="flex gap-1.5 justify-center">
              {puzzle.mainWord.word.split("").map((letter, i) => (
                <div
                  key={i}
                  className="w-10 h-10 rounded-lg bg-correct dark:bg-correct-dark flex items-center justify-center text-white font-mono text-lg font-bold"
                >
                  {letter}
                </div>
              ))}
            </div>
          </div>
        ) : guesses.length > 0 ? (
          <div
            className={`mt-6 transition-all duration-500 delay-300 ${hasAnimated ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
          >
            <p className="text-caption text-ink-tertiary dark:text-ink-tertiary-dark mb-3 uppercase tracking-wider">
              Your attempts
            </p>
            <div className="inline-flex flex-col gap-1">
              {guesses.map((guess, i) => (
                <div key={i} className="flex gap-1 justify-center">
                  {guess.feedback.map((fb, j) => (
                    <div
                      key={j}
                      className={`w-7 h-7 rounded-md ${
                        fb.status === "correct"
                          ? "bg-correct dark:bg-correct-dark"
                          : fb.status === "present"
                            ? "bg-present dark:bg-present-dark"
                            : "bg-absent dark:bg-absent-dark"
                      }`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {/* Loading state */}
        {isLoadingPuzzle && (
          <div className="mt-6">
            <p className="text-body-small text-ink-tertiary dark:text-ink-tertiary-dark animate-pulse">
              Loading puzzle details...
            </p>
          </div>
        )}
      </div>
    </ModalShell>
  );
}
