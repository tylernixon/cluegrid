"use client";

import { motion, useReducedMotion, type Transition } from "framer-motion";

interface CellProps {
  letter: string;
  status: "empty" | "filled" | "correct" | "present" | "absent" | "revealed";
  isSelected: boolean;
  isMainWordRow: boolean;
  animate?: "pop" | "shake" | "bounce" | null;
  animationDelay?: number;
  onClick?: () => void;
  tabIndex?: number;
  onKeyDown?: (e: React.KeyboardEvent) => void;
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
  animationDelay = 0,
  onClick,
  tabIndex = -1,
  onKeyDown,
}: CellProps) {
  const prefersReducedMotion = useReducedMotion();

  const base =
    "flex items-center justify-center w-[52px] h-[52px] sm:w-[56px] sm:h-[56px] md:w-[60px] md:h-[60px] rounded-sm border-2 font-mono text-grid select-none transition-colors duration-150";

  const statusClass = statusClasses[status] ?? statusClasses.empty;

  const selectedClass = isSelected
    ? "ring-2 ring-accent dark:ring-accent-dark ring-offset-1 ring-offset-canvas dark:ring-offset-canvas-dark"
    : "";

  const mainRowClass = isMainWordRow ? "font-bold" : "";

  // Focus visible class for keyboard navigation
  const focusClass = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent dark:focus-visible:ring-accent-dark focus-visible:ring-offset-2";

  // Determine animation values based on prefersReducedMotion and animate prop
  let animateValue: Record<string, number[]> | undefined;
  let transitionValue: Transition | undefined;

  if (!prefersReducedMotion && animate) {
    switch (animate) {
      case "pop":
        animateValue = { scale: [1, 0.96, 1] };
        transitionValue = { duration: 0.08, ease: "easeOut" };
        break;
      case "shake":
        animateValue = { x: [0, -4, 4, -3, 3, 0] };
        transitionValue = { duration: 0.2, ease: "linear" };
        break;
      case "bounce":
        animateValue = { y: [0, -12, 0], scale: [1, 1.05, 1] };
        transitionValue = { duration: 0.4, ease: "easeOut", delay: animationDelay };
        break;
    }
  }

  return (
    <motion.button
      type="button"
      className={`${base} ${statusClass} ${selectedClass} ${mainRowClass} ${focusClass}`}
      onClick={onClick}
      onKeyDown={onKeyDown}
      tabIndex={tabIndex}
      aria-label={
        letter
          ? `${letter}, ${status}`
          : `empty cell${isMainWordRow ? ", main word" : ""}`
      }
      animate={animateValue}
      transition={transitionValue}
    >
      {letter}
    </motion.button>
  );
}
