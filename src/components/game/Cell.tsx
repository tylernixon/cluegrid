"use client";

import { motion, useReducedMotion, AnimatePresence, type Transition } from "framer-motion";
import { TIMING, EASE } from "@/lib/motion";

interface CellProps {
  letter: string;
  status: "empty" | "filled" | "correct" | "present" | "absent" | "revealed" | "lockedCorrect" | "typing";
  isSelected: boolean;
  isMainWordRow: boolean;
  animate?: "pop" | "shake" | "bounce" | "settle" | "glow" | "reveal" | "solvedLock" | null;
  animationDelay?: number;
  onClick?: () => void;
  tabIndex?: number;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  row?: number;
  col?: number;
}

const statusClasses: Record<string, string> = {
  empty:
    "bg-surface-raised dark:bg-surface-raised-dark border-border dark:border-border-dark",
  filled:
    "bg-surface-raised dark:bg-surface-raised-dark border-border-active dark:border-border-active-dark",
  correct: "bg-correct dark:bg-correct-dark border-correct dark:border-correct-dark text-white",
  present: "bg-present dark:bg-present-dark border-present dark:border-present-dark text-white",
  absent: "bg-absent dark:bg-absent-dark border-absent dark:border-absent-dark text-white",
  // Revealed letters from intersections - teal shade to indicate "given as hint"
  revealed:
    "bg-revealed dark:bg-revealed-dark border-revealed dark:border-revealed-dark text-white",
  // Locked correct - letters you got right from your own guesses (same as correct, they earned it)
  lockedCorrect:
    "bg-correct dark:bg-correct-dark border-correct dark:border-correct-dark text-white",
  typing:
    "bg-surface dark:bg-surface-dark border-accent dark:border-accent-dark text-ink dark:text-ink-dark",
  // Crosser solved - for solved crosser cells not on main word row
  crosserSolved:
    "bg-crosser-solved dark:bg-crosser-solved-dark border-crosser-solved dark:border-crosser-solved-dark text-white",
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
  row,
  col,
}: CellProps) {
  const prefersReducedMotion = useReducedMotion();

  const base =
    "flex items-center justify-center w-[52px] h-[52px] sm:w-[56px] sm:h-[56px] md:w-[60px] md:h-[60px] rounded-sm border-2 font-mono text-grid select-none transition-colors duration-150";

  // For crosser cells (not main word row) that are solved, use the lighter grey style
  // Green is reserved only for the main word row
  const effectiveStatus =
    !isMainWordRow && (status === "correct" || status === "lockedCorrect")
      ? "crosserSolved"
      : status;

  const statusClass = statusClasses[effectiveStatus] ?? statusClasses.empty;

  const mainRowClass = isMainWordRow ? "font-bold" : "";

  // Focus visible class for keyboard navigation
  const focusClass = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent dark:focus-visible:ring-accent-dark focus-visible:ring-offset-2";

  // Determine animation values based on prefersReducedMotion and animate prop
  let animateValue: Record<string, number[] | string[]> | undefined;
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
        // Replaced with gentler glow-style animation
        animateValue = { scale: [1, 1.02, 1] };
        transitionValue = { duration: 0.25, ease: EASE.out, delay: animationDelay };
        break;
      case "settle":
        // Subtle scale settle when letter fills slot (180ms)
        animateValue = { scale: [0.95, 1.02, 1] };
        transitionValue = { duration: TIMING.settle, ease: EASE.settle };
        break;
      case "glow":
        // Gentle glow pulse for victory (no bounce)
        animateValue = { scale: [1, 1.02, 1] };
        transitionValue = { duration: 0.3, ease: EASE.out, delay: animationDelay };
        break;
      case "reveal":
        // Soft fade-in for revealed intersection letters (200ms)
        animateValue = { scale: [0.95, 1], opacity: [0, 1] };
        transitionValue = { duration: TIMING.medium, ease: EASE.out };
        break;
      case "solvedLock":
        // Slot locks with subtle pulse when crosser is solved (200ms)
        animateValue = { scale: [1, 1.015, 1] };
        transitionValue = { duration: TIMING.medium, ease: EASE.out, delay: animationDelay };
        break;
    }
  }

  // Selection ring animation - separate from cell animation
  const ringMotionProps = !prefersReducedMotion ? {
    initial: { opacity: 0, scale: 0.98 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.98 },
    transition: { duration: TIMING.fast, ease: EASE.out },
  } : {};

  return (
    <motion.button
      type="button"
      className={`${base} ${statusClass} ${mainRowClass} ${focusClass} relative`}
      onClick={onClick}
      onKeyDown={onKeyDown}
      tabIndex={tabIndex}
      data-row={row}
      data-col={col}
      aria-label={
        letter
          ? `${letter}, ${status}`
          : `empty cell${isMainWordRow ? ", main word" : ""}`
      }
      animate={animateValue}
      transition={transitionValue}
    >
      {/* Selection ring with smooth fade animation */}
      <AnimatePresence>
        {isSelected && (
          <motion.span
            className="absolute inset-[-3px] rounded-md ring-2 ring-accent dark:ring-accent-dark pointer-events-none"
            {...ringMotionProps}
          />
        )}
      </AnimatePresence>
      {letter}
    </motion.button>
  );
}
