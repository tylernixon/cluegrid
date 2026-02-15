"use client";

import { useState, useCallback } from "react";
import { Modal } from "@/components/ui/Modal";
import { WIN_MESSAGES } from "@/types";
import { shareResult } from "@/lib/shareResult";
import { useStatsStore } from "@/stores/statsStore";
import type { PuzzleData, Guess } from "@/types";

interface CompletionModalProps {
  open: boolean;
  onClose: () => void;
  status: "won" | "lost";
  puzzle: PuzzleData;
  guesses: Guess[];
  solvedWords: Set<string>;
}

export function CompletionModal({
  open,
  onClose,
  status,
  puzzle,
  guesses,
  solvedWords,
}: CompletionModalProps) {
  const [shareStatus, setShareStatus] = useState<
    "idle" | "copied" | "shared" | "error"
  >("idle");

  const currentStreak = useStatsStore((s) => s.currentStreak);
  const guessCount = guesses.length;
  const crossersSolved = puzzle.crossers.filter((c) =>
    solvedWords.has(c.id)
  ).length;
  const totalCrossers = puzzle.crossers.length;
  const mainGuesses = guesses.filter((g) => g.targetId === "main");

  const winMessage =
    status === "won" ? (WIN_MESSAGES[guessCount] ?? "Well done!") : "So close!";

  const handleShare = useCallback(async () => {
    try {
      const result = await shareResult(
        puzzle,
        guesses,
        solvedWords,
        status === "won"
      );
      setShareStatus(result);
      // Reset after 2 seconds
      setTimeout(() => setShareStatus("idle"), 2000);
    } catch (err) {
      // User cancelled share, don't show error
      if (err instanceof Error && err.name === "AbortError") {
        return;
      }
      setShareStatus("error");
      setTimeout(() => setShareStatus("idle"), 2000);
    }
  }, [puzzle, guesses, solvedWords, status]);

  const shareButtonText = () => {
    switch (shareStatus) {
      case "copied":
        return "Copied!";
      case "shared":
        return "Shared!";
      case "error":
        return "Error";
      default:
        return "Share";
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={winMessage}>
      <div className="text-center">
        {/* Result headline */}
        <p className="text-display text-ink dark:text-ink-dark mb-2">
          {winMessage}
        </p>

        {/* Result details */}
        {status === "won" ? (
          <div className="space-y-1 mb-4">
            <p className="text-body text-ink-secondary dark:text-ink-secondary-dark">
              Solved in {guessCount} {guessCount === 1 ? "guess" : "guesses"}
            </p>
            <p className="text-body-small text-ink-tertiary dark:text-ink-tertiary-dark">
              {crossersSolved}/{totalCrossers} crossers solved
            </p>
          </div>
        ) : (
          <div className="space-y-1 mb-4">
            <p className="text-body text-ink-secondary dark:text-ink-secondary-dark">
              The word was:{" "}
              <span className="font-mono font-bold text-ink dark:text-ink-dark">
                {puzzle.mainWord.word}
              </span>
            </p>
            <p className="text-body-small text-ink-tertiary dark:text-ink-tertiary-dark">
              You got {crossersSolved}/{totalCrossers} crossers
            </p>
          </div>
        )}

        {/* Streak display */}
        {currentStreak > 0 && (
          <div className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-raised dark:bg-surface-raised-dark">
            <svg
              className="w-5 h-5 text-present dark:text-present-dark"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M12 2C9.24 2 7 4.24 7 7c0 1.33.53 2.53 1.39 3.42C7.53 11.31 7 12.58 7 14c0 3.31 2.69 6 6 6s6-2.69 6-6c0-1.42-.53-2.69-1.39-3.58C18.47 9.53 19 8.33 19 7c0-2.76-2.24-5-5-5z" />
            </svg>
            <span className="text-body font-semibold text-ink dark:text-ink-dark">
              {currentStreak} day streak!
            </span>
          </div>
        )}

        {/* Results Summary */}
        <div className="mb-6 space-y-4">
          {/* Main word guesses emoji grid */}
          <div>
            <p className="text-caption text-ink-tertiary dark:text-ink-tertiary-dark mb-2 uppercase tracking-wide">
              Main Word
            </p>
            <div className="inline-flex flex-col gap-1">
              {mainGuesses.map((guess, i) => (
                <div key={i} className="flex gap-1 justify-center">
                  {guess.feedback.map((fb, j) => (
                    <div
                      key={j}
                      className={`w-6 h-6 rounded-[3px] ${
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

          {/* Crossers summary */}
          <div>
            <p className="text-caption text-ink-tertiary dark:text-ink-tertiary-dark mb-2 uppercase tracking-wide">
              Crossers ({crossersSolved}/{totalCrossers})
            </p>
            <div className="flex gap-2 justify-center flex-wrap">
              {puzzle.crossers.map((crosser, i) => {
                const isSolved = solvedWords.has(crosser.id);
                const crosserGuesses = guesses.filter(
                  (g) => g.targetId === crosser.id
                );
                return (
                  <div
                    key={crosser.id}
                    className={`flex items-center gap-1 px-2 py-1 rounded-md text-body-small ${
                      isSolved
                        ? "bg-correct/20 dark:bg-correct-dark/20 text-correct dark:text-correct-dark"
                        : "bg-border dark:bg-border-dark text-ink-tertiary dark:text-ink-tertiary-dark"
                    }`}
                  >
                    <span className="font-mono">{i + 1}</span>
                    {isSolved && (
                      <span className="text-caption">
                        ({crosserGuesses.length})
                      </span>
                    )}
                    {isSolved ? (
                      <svg
                        className="w-3.5 h-3.5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : (
                      <svg
                        className="w-3.5 h-3.5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-center">
          <button
            type="button"
            className="px-6 py-3 bg-accent dark:bg-accent-dark text-white rounded-lg font-semibold text-body hover:bg-accent-hover dark:hover:bg-accent-hover-dark transition-colors active:scale-[0.97] flex items-center gap-2"
            onClick={handleShare}
            disabled={shareStatus !== "idle"}
          >
            {shareStatus === "idle" && (
              <svg
                className="w-5 h-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                <polyline points="16 6 12 2 8 6" />
                <line x1="12" y1="2" x2="12" y2="15" />
              </svg>
            )}
            {shareStatus === "copied" && (
              <svg
                className="w-5 h-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
            {shareButtonText()}
          </button>
          <button
            type="button"
            className="px-6 py-3 bg-surface-elevated dark:bg-surface-elevated-dark text-ink dark:text-ink-dark rounded-lg font-semibold text-body hover:bg-border dark:hover:bg-border-dark transition-colors active:scale-[0.97]"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}
