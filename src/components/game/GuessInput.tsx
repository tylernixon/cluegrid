"use client";

import { useRef, useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { TIMING, EASE } from "@/lib/motion";

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
  const prefersReducedMotion = useReducedMotion();
  const prevGuessLengthRef = useRef(0);

  // Track which cell just got filled for animation
  const justFilledIndex = currentGuess.length > prevGuessLengthRef.current
    ? currentGuess.length - 1
    : -1;

  useEffect(() => {
    prevGuessLengthRef.current = currentGuess.length;
  }, [currentGuess.length]);

  // The active cell is the next empty cell (where the user will type next)
  const activeIndex = currentGuess.length;

  const cells = Array.from({ length: targetLength }, (_, i) => {
    const letter = currentGuess[i] ?? "";
    const isFilled = letter !== "";
    const isActive = i === activeIndex && activeIndex < targetLength;
    const isJustFilled = i === justFilledIndex && !prefersReducedMotion;

    // Settle animation for newly filled cells (180ms)
    const settleAnimation = isJustFilled ? {
      scale: [0.92, 1.03, 1],
    } : {};

    const settleTransition = isJustFilled ? {
      duration: TIMING.settle,
      ease: EASE.settle,
    } : {};

    // Determine cell styling based on state
    let cellClass = "";
    if (isFilled) {
      cellClass = "border-border-active dark:border-border-active-dark bg-surface-raised dark:bg-surface-raised-dark text-ink dark:text-ink-dark";
    } else if (isActive) {
      // Active cell (cursor position) - accent border with brighter background
      cellClass = "border-accent dark:border-accent-dark bg-surface dark:bg-surface-dark text-ink-tertiary dark:text-ink-tertiary-dark";
    } else {
      cellClass = "border-border dark:border-border-dark bg-surface-raised/50 dark:bg-surface-raised-dark/50 text-ink-tertiary dark:text-ink-tertiary-dark";
    }

    return (
      <motion.div
        key={i}
        className={`flex items-center justify-center w-[52px] h-[52px] sm:w-[56px] sm:h-[56px] rounded-sm border-2 font-mono text-grid select-none relative ${cellClass}`}
        animate={settleAnimation}
        transition={settleTransition}
      >
        {/* Subtle pulsing ring for active cell */}
        {isActive && !prefersReducedMotion && (
          <motion.span
            className="absolute inset-[-2px] rounded-md border-2 border-accent/40 dark:border-accent-dark/40 pointer-events-none"
            animate={{ opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
          />
        )}
        {letter}
      </motion.div>
    );
  });

  // Shake animation using Framer Motion
  const shakeAnimation = shake && !prefersReducedMotion ? {
    x: [0, -4, 4, -3, 3, 0],
  } : {};

  const shakeTransition = shake ? {
    duration: 0.2,
    ease: "linear" as const,
  } : {};

  return (
    <motion.div
      className="flex gap-1.5 justify-center"
      role="group"
      aria-label="Current guess"
      animate={shakeAnimation}
      transition={shakeTransition}
    >
      {cells}
    </motion.div>
  );
}
