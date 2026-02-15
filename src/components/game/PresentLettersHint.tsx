"use client";

import { motion, AnimatePresence } from "framer-motion";

interface PresentLettersHintProps {
  letters: string[];
}

/**
 * Shows letters that are in the word but in wrong position (yellow/present).
 * Displayed as a compact hint bar above the keyboard.
 */
export function PresentLettersHint({ letters }: PresentLettersHintProps) {
  if (letters.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ duration: 0.2 }}
        className="flex items-center justify-center gap-2 py-1.5 px-3"
        role="status"
        aria-label={`Letters in word but wrong position: ${letters.join(", ")}`}
      >
        <span className="text-caption text-ink-tertiary dark:text-ink-tertiary-dark">
          Also in word:
        </span>
        <div className="flex gap-1">
          {letters.map((letter) => (
            <span
              key={letter}
              className="w-7 h-7 flex items-center justify-center rounded-sm bg-present dark:bg-present-dark text-white text-sm font-mono font-semibold"
            >
              {letter}
            </span>
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
