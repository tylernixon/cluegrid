"use client";

import { motion, useReducedMotion } from "framer-motion";

interface PuzzleLoadingStateProps {
  message?: string;
}

export function PuzzleLoadingState({
  message = "Loading puzzle...",
}: PuzzleLoadingStateProps) {
  const prefersReducedMotion = useReducedMotion();
  const letters = "LOADING".split("");

  return (
    <div
      className="flex flex-col items-center justify-center min-h-[300px]"
      role="status"
      aria-label={message}
      aria-busy="true"
    >
      {/* LOADING word in faint tiles */}
      <div className="flex gap-1.5 justify-center">
        {letters.map((letter, i) => (
          <motion.div
            key={i}
            className="flex items-center justify-center w-[44px] h-[52px] sm:w-[48px] sm:h-[56px] rounded-sm border-2 border-border/50 dark:border-border-dark/50 bg-surface-raised/30 dark:bg-surface-raised-dark/30 font-mono text-xl font-medium text-ink-tertiary/60 dark:text-ink-tertiary-dark/60 select-none"
            initial={prefersReducedMotion ? {} : { opacity: 0.3 }}
            animate={
              prefersReducedMotion
                ? {}
                : {
                    opacity: [0.3, 0.6, 0.3],
                  }
            }
            transition={
              prefersReducedMotion
                ? undefined
                : {
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: i * 0.1,
                  }
            }
          >
            {letter}
          </motion.div>
        ))}
      </div>

      {/* Loading message for screen readers */}
      <span className="sr-only">{message}</span>
    </div>
  );
}
