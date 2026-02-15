"use client";

import type { CrosserData } from "@/types";

interface ActiveCluePanelProps {
  selectedTarget: "main" | string;
  crossers: CrosserData[];
  currentGuess: string;
  targetLength: number;
  solvedWords: Set<string>;
  revealedLetters: Array<{ row: number; col: number; letter: string }>;
  mainWordRow: number;
  mainWordCol: number;
}

export function ActiveCluePanel({
  selectedTarget,
  crossers,
  currentGuess,
  targetLength,
  solvedWords,
  revealedLetters,
  mainWordRow,
  mainWordCol,
}: ActiveCluePanelProps) {
  const isSolved = solvedWords.has(selectedTarget);

  // Get the active clue info
  const getClueInfo = () => {
    if (selectedTarget === "main") {
      return {
        number: "*",
        clue: "Main word - deduce from crossing clues",
        direction: "Across",
        length: targetLength,
        word: null as string | null,
      };
    }
    const crosser = crossers.find((c) => c.id === selectedTarget);
    if (!crosser) return null;
    const index = crossers.findIndex((c) => c.id === selectedTarget) + 1;
    return {
      number: index.toString(),
      clue: crosser.clue,
      direction: "Down",
      length: crosser.word.length,
      word: isSolved ? crosser.word : null,
    };
  };

  const clueInfo = getClueInfo();
  if (!clueInfo) return null;

  // Build the slot pattern with revealed letters and current guess
  const buildSlotPattern = () => {
    const slots: { letter: string; isRevealed: boolean; isFilled: boolean }[] = [];

    if (selectedTarget === "main") {
      // For main word, check revealed letters at main word positions
      for (let i = 0; i < targetLength; i++) {
        const col = mainWordCol + i;
        const revealed = revealedLetters.find(
          (r) => r.row === mainWordRow && r.col === col
        );
        const guessLetter = currentGuess[i]?.toUpperCase() ?? "";

        if (revealed) {
          slots.push({ letter: revealed.letter, isRevealed: true, isFilled: true });
        } else if (guessLetter) {
          slots.push({ letter: guessLetter, isRevealed: false, isFilled: true });
        } else {
          slots.push({ letter: "_", isRevealed: false, isFilled: false });
        }
      }
    } else {
      // For crossers, just show current guess progress
      for (let i = 0; i < clueInfo.length; i++) {
        const guessLetter = currentGuess[i]?.toUpperCase() ?? "";
        if (guessLetter) {
          slots.push({ letter: guessLetter, isRevealed: false, isFilled: true });
        } else {
          slots.push({ letter: "_", isRevealed: false, isFilled: false });
        }
      }
    }

    return slots;
  };

  const slots = buildSlotPattern();

  return (
    <div className="w-full max-w-[480px] mx-auto px-4 py-4 bg-surface-raised dark:bg-surface-raised-dark rounded-xl border border-border dark:border-border-dark">
      {/* Header row with number, direction, length */}
      <div className="flex items-center gap-3 mb-2">
        <span className="font-mono text-heading-3 text-accent dark:text-accent-dark font-bold">
          {clueInfo.number}
        </span>
        <span className="text-caption text-ink-secondary dark:text-ink-secondary-dark uppercase tracking-wider">
          {clueInfo.direction}
        </span>
        <span className="text-caption text-ink-tertiary dark:text-ink-tertiary-dark">
          ({clueInfo.length} letters)
        </span>
      </div>

      {/* Clue text */}
      <p className="text-body text-ink dark:text-ink-dark mb-4">
        {clueInfo.clue}
      </p>

      {/* Slot pattern display */}
      <div className="flex items-center justify-center gap-2" role="group" aria-label="Letter slots">
        {slots.map((slot, i) => (
          <div
            key={i}
            className={`flex items-center justify-center w-10 h-12 rounded-md border-2 font-mono text-xl font-bold transition-all duration-100
              ${
                isSolved
                  ? "bg-correct/10 dark:bg-correct-dark/10 border-correct dark:border-correct-dark text-correct dark:text-correct-dark"
                  : slot.isRevealed
                    ? "bg-accent/10 dark:bg-accent-dark/10 border-accent dark:border-accent-dark text-accent dark:text-accent-dark"
                    : slot.isFilled
                      ? "bg-surface dark:bg-surface-dark border-border-active dark:border-border-active-dark text-ink dark:text-ink-dark"
                      : "bg-surface dark:bg-surface-dark border-border dark:border-border-dark text-ink-tertiary dark:text-ink-tertiary-dark"
              }
            `}
          >
            {isSolved && clueInfo.word ? clueInfo.word[i] : slot.letter}
          </div>
        ))}
      </div>

      {/* Solved indicator */}
      {isSolved && (
        <div className="mt-3 flex items-center justify-center gap-2 text-correct dark:text-correct-dark">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span className="text-caption font-medium uppercase tracking-wider">Solved</span>
        </div>
      )}
    </div>
  );
}
