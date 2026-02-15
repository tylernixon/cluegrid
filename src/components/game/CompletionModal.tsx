"use client";

import { Modal } from "@/components/ui/Modal";
import { WIN_MESSAGES } from "@/types";
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
  const guessCount = guesses.length;
  const crossersSolved = puzzle.crossers.filter((c) =>
    solvedWords.has(c.id),
  ).length;
  const totalCrossers = puzzle.crossers.length;

  const winMessage =
    status === "won" ? (WIN_MESSAGES[guessCount] ?? "Well done!") : "So close!";

  return (
    <Modal open={open} onClose={onClose} title={winMessage}>
      <div className="text-center">
        {/* Result headline */}
        <p className="text-display text-ink dark:text-ink-dark mb-2">
          {winMessage}
        </p>

        {/* Result details */}
        {status === "won" ? (
          <div className="space-y-1 mb-6">
            <p className="text-body text-ink-secondary dark:text-ink-secondary-dark">
              Solved in {guessCount} {guessCount === 1 ? "guess" : "guesses"}
            </p>
            <p className="text-body-small text-ink-tertiary dark:text-ink-tertiary-dark">
              {crossersSolved}/{totalCrossers} crossers solved
            </p>
          </div>
        ) : (
          <div className="space-y-1 mb-6">
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

        {/* Guess summary -- emoji grid for main word guesses */}
        <div className="mb-6">
          <div className="inline-flex flex-col gap-1">
            {guesses
              .filter((g) => g.targetId === "main")
              .map((guess, i) => (
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

        {/* Actions */}
        <div className="flex gap-3 justify-center">
          <button
            type="button"
            className="px-6 py-3 bg-accent dark:bg-accent-dark text-white rounded-lg font-semibold text-body hover:bg-accent-hover dark:hover:bg-accent-hover-dark transition-colors active:scale-[0.97]"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}
