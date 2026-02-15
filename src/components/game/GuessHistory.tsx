"use client";

import type { Guess } from "@/types";

interface GuessHistoryProps {
  guesses: Guess[];
  targetId: "main" | string;
}

export function GuessHistory({ guesses, targetId }: GuessHistoryProps) {
  const targetGuesses = guesses.filter((g) => g.targetId === targetId);
  if (targetGuesses.length === 0) return null;

  return (
    <div className="flex flex-col gap-1 items-center">
      {targetGuesses.map((guess, i) => (
        <div key={i} className="flex gap-[6px]">
          {guess.feedback.map((fb, j) => (
            <div
              key={j}
              className={`flex items-center justify-center w-[52px] h-[52px] sm:w-[56px] sm:h-[56px] rounded-sm border-2 font-mono text-grid text-white
                ${
                  fb.status === "correct"
                    ? "bg-correct dark:bg-correct-dark border-correct dark:border-correct-dark"
                    : fb.status === "present"
                      ? "bg-present dark:bg-present-dark border-present dark:border-present-dark"
                      : "bg-absent dark:bg-absent-dark border-absent dark:border-absent-dark"
                }
              `}
            >
              {fb.letter}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
