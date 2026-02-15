"use client";

interface GuessInputProps {
  currentGuess: string;
  targetLength: number;
  shake: boolean;
}

export function GuessInput({
  currentGuess,
  targetLength,
  shake,
}: GuessInputProps) {
  const cells = Array.from({ length: targetLength }, (_, i) => {
    const letter = currentGuess[i] ?? "";
    const isFilled = letter !== "";
    return (
      <div
        key={i}
        className={`flex items-center justify-center w-[52px] h-[52px] sm:w-[56px] sm:h-[56px] rounded-sm border-2 font-mono text-grid select-none transition-all duration-75
          ${
            isFilled
              ? "border-border-active dark:border-border-active-dark bg-surface-raised dark:bg-surface-raised-dark text-ink dark:text-ink-dark animate-cell-pop"
              : "border-border dark:border-border-dark bg-surface-raised/50 dark:bg-surface-raised-dark/50 text-ink-tertiary dark:text-ink-tertiary-dark"
          }
        `}
      >
        {letter}
      </div>
    );
  });

  return (
    <div
      className={`flex gap-1.5 justify-center ${shake ? "animate-row-shake" : ""}`}
      role="group"
      aria-label="Current guess"
    >
      {cells}
    </div>
  );
}
