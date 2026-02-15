"use client";

interface CellProps {
  letter: string;
  status: "empty" | "filled" | "correct" | "present" | "absent" | "revealed";
  isSelected: boolean;
  isMainWordRow: boolean;
  animate?: "pop" | "shake" | null;
  onClick?: () => void;
}

const statusClasses: Record<string, string> = {
  empty:
    "bg-surface-raised dark:bg-surface-raised-dark border-border dark:border-border-dark",
  filled:
    "bg-surface-raised dark:bg-surface-raised-dark border-border-active dark:border-border-active-dark",
  correct: "bg-correct dark:bg-correct-dark border-correct dark:border-correct-dark text-white",
  present: "bg-present dark:bg-present-dark border-present dark:border-present-dark text-white",
  absent: "bg-absent dark:bg-absent-dark border-absent dark:border-absent-dark text-white",
  revealed:
    "bg-surface dark:bg-surface-dark border-accent dark:border-accent-dark",
};

export function Cell({
  letter,
  status,
  isSelected,
  isMainWordRow,
  animate,
  onClick,
}: CellProps) {
  const base =
    "flex items-center justify-center w-[52px] h-[52px] sm:w-[56px] sm:h-[56px] md:w-[60px] md:h-[60px] rounded-sm border-2 font-mono text-grid select-none transition-colors duration-150";

  const statusClass = statusClasses[status] ?? statusClasses.empty;

  const selectedClass = isSelected
    ? "ring-2 ring-accent dark:ring-accent-dark ring-offset-1 ring-offset-canvas dark:ring-offset-canvas-dark"
    : "";

  const mainRowClass = isMainWordRow ? "font-bold" : "";

  const animClass =
    animate === "pop"
      ? "animate-cell-pop"
      : animate === "shake"
        ? "animate-row-shake"
        : "";

  return (
    <button
      type="button"
      className={`${base} ${statusClass} ${selectedClass} ${mainRowClass} ${animClass}`}
      onClick={onClick}
      aria-label={
        letter
          ? `${letter}, ${status}`
          : `empty cell${isMainWordRow ? ", main word" : ""}`
      }
      tabIndex={-1}
    >
      {letter}
    </button>
  );
}
