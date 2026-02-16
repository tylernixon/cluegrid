"use client";

import { useCallback, useState, useMemo } from "react";
import { motion, useReducedMotion, AnimatePresence, type PanInfo } from "framer-motion";
import type { CrosserData } from "@/types";
import { TIMING, EASE } from "@/lib/motion";

interface ActiveCluePanelProps {
  selectedTarget: "main" | string;
  crossers: CrosserData[];
  solvedWords: Set<string>;
  onSelectTarget: (targetId: "main" | string) => void;
  theme?: string;
  themeHint?: string;
  presentLetters?: string[];
  guessesRemaining?: number;
  maxGuesses?: number;
  hintsUsed?: number;
}

export function ActiveCluePanel({
  selectedTarget,
  crossers,
  solvedWords,
  onSelectTarget,
  theme,
  themeHint,
  presentLetters = [],
  guessesRemaining,
  hintsUsed,
}: ActiveCluePanelProps) {
  const isSolved = solvedWords.has(selectedTarget);
  const prefersReducedMotion = useReducedMotion();
  const [swipeDirection, setSwipeDirection] = useState<"left" | "right" | null>(null);

  // Build list of all navigable targets (crossers + main)
  const allTargets = useMemo(
    () => [...crossers.map((c) => c.id), "main"] as ("main" | string)[],
    [crossers]
  );
  const currentIndex = allTargets.indexOf(selectedTarget);

  // Find next/prev unsolved target
  const findNextTarget = useCallback(
    (direction: "next" | "prev"): "main" | string | null => {
      const step = direction === "next" ? 1 : -1;
      let index = currentIndex + step;

      // Wrap around
      while (index !== currentIndex) {
        if (index < 0) index = allTargets.length - 1;
        if (index >= allTargets.length) index = 0;

        const targetId = allTargets[index];
        if (!targetId) {
          index += step;
          continue;
        }
        // Skip solved crossers, but always allow main
        if (targetId === "main" || !solvedWords.has(targetId)) {
          return targetId;
        }
        index += step;
      }
      return null;
    },
    [allTargets, currentIndex, solvedWords]
  );

  const goToNext = useCallback(() => {
    const next = findNextTarget("next");
    if (next) {
      setSwipeDirection("left");
      onSelectTarget(next);
    }
  }, [findNextTarget, onSelectTarget]);

  const goToPrev = useCallback(() => {
    const prev = findNextTarget("prev");
    if (prev) {
      setSwipeDirection("right");
      onSelectTarget(prev);
    }
  }, [findNextTarget, onSelectTarget]);

  // Handle swipe gestures
  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const threshold = 50;
      if (info.offset.x < -threshold) {
        goToNext();
      } else if (info.offset.x > threshold) {
        goToPrev();
      }
    },
    [goToNext, goToPrev]
  );

  // Count how many hints have been solved
  const solvedHintCount = crossers.filter((c) => solvedWords.has(c.id)).length;
  const unsolvedHintCount = crossers.length - solvedHintCount;

  // Get the active clue info
  const getClueInfo = () => {
    if (selectedTarget === "main") {
      // Use theme as the main word clue, with themeHint as additional context
      const mainClue = themeHint || theme || "Solve the hints to reveal letters";

      // Add a hint note based on game state
      let hintNote: string | null = null;
      if (solvedHintCount === 0 && unsolvedHintCount > 0) {
        hintNote = "Swipe for hints that reveal letters";
      } else if (solvedHintCount > 0 && unsolvedHintCount > 0) {
        hintNote = "Swipe for more hints";
      }

      return {
        label: theme ? `Theme: ${theme}` : "Main Word",
        clue: mainClue,
        hintNote,
      };
    }
    const crosser = crossers.find((c) => c.id === selectedTarget);
    if (!crosser) return null;
    const index = crossers.findIndex((c) => c.id === selectedTarget) + 1;
    return {
      label: `Hint ${index}`,
      clue: crosser.clue,
      hintNote: isSolved ? null : "Solves a letter in the main word",
    };
  };

  const clueInfo = getClueInfo();
  if (!clueInfo) return null;

  // Animation variants for card content
  const contentVariants = {
    initial: (direction: "left" | "right" | null) =>
      prefersReducedMotion
        ? { opacity: 1, x: 0 }
        : { opacity: 0, x: direction === "left" ? 30 : direction === "right" ? -30 : 0 },
    animate: { opacity: 1, x: 0 },
    exit: (direction: "left" | "right" | null) =>
      prefersReducedMotion
        ? { opacity: 1, x: 0 }
        : { opacity: 0, x: direction === "left" ? -30 : direction === "right" ? 30 : 0 },
  };

  return (
    <motion.div
      className="w-full max-w-[480px] mx-auto px-4 py-2 bg-surface-raised/90 dark:bg-surface-raised-dark/90 backdrop-blur-sm rounded-xl border border-border/50 dark:border-border-dark/50 relative overflow-hidden touch-pan-y"
      drag={prefersReducedMotion ? false : "x"}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.2}
      onDragEnd={handleDragEnd}
    >
      {/* Card content with animation */}
      <AnimatePresence mode="wait" custom={swipeDirection}>
        <motion.div
          key={selectedTarget}
          className="px-2"
          custom={swipeDirection}
          variants={contentVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: TIMING.fast, ease: EASE.out }}
        >
          {/* Label badge */}
          <div className="flex items-center justify-center mb-2">
            <span className={`text-caption font-semibold uppercase tracking-wider px-2 py-0.5 rounded ${
              selectedTarget !== "main"
                ? "bg-present/15 dark:bg-present-dark/15 text-present dark:text-present-dark"
                : "bg-accent/15 dark:bg-accent-dark/15 text-accent dark:text-accent-dark"
            }`}>
              {clueInfo.label}
            </span>
            {isSolved && (
              <span className="ml-2 text-correct dark:text-correct-dark">
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
              </span>
            )}
          </div>

          {/* Clue text - responsive: 12px small phone (<375), 14px phone (375+), 16px tablet (640+) */}
          <p className="text-xs min-[375px]:text-sm sm:text-base leading-snug font-serif text-ink dark:text-ink-dark text-center">
            {clueInfo.clue}
          </p>

          {/* Hint note */}
          {clueInfo.hintNote && (
            <p className="text-xs text-present dark:text-present-dark text-center mt-1">
              {clueInfo.hintNote}
            </p>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Bottom row: dots, status, and present letters */}
      <div className="flex items-center justify-between mt-2 gap-2">
        {/* Compact status (left) */}
        <div
          className="flex items-center gap-2 text-xs text-ink-tertiary dark:text-ink-tertiary-dark"
          role="status"
          aria-label={`${guessesRemaining} guesses remaining. ${hintsUsed} of ${crossers.length} hints used.`}
        >
          {guessesRemaining !== undefined && (
            <span className="flex items-center gap-1" title={`${guessesRemaining} guesses left`}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
              </svg>
              <span className="font-medium">{guessesRemaining}</span>
            </span>
          )}
          {hintsUsed !== undefined && (
            <span className="flex items-center gap-1" title={`${hintsUsed}/${crossers.length} hints`}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><circle cx="12" cy="12" r="10" /><path d="M12 17h.01" />
              </svg>
              <span className="font-medium">{hintsUsed}/{crossers.length}</span>
            </span>
          )}
        </div>

        {/* Dot indicators (center) */}
        <div className="flex items-center justify-center gap-1.5">
          {allTargets.map((targetId, i) => {
            const isActive = targetId === selectedTarget;
            const targetSolved = solvedWords.has(targetId);
            return (
              <button
                key={targetId}
                type="button"
                onClick={() => onSelectTarget(targetId)}
                className={`w-2 h-2 rounded-full transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2
                  ${
                    isActive
                      ? "bg-accent dark:bg-accent-dark w-4"
                      : targetSolved
                        ? "bg-correct/50 dark:bg-correct-dark/50"
                        : "bg-border-active dark:bg-border-active-dark hover:bg-ink-tertiary dark:hover:bg-ink-tertiary-dark"
                  }
                `}
                aria-label={`Go to clue ${i + 1}${targetId === "main" ? " (main word)" : ""}${targetSolved ? " (solved)" : ""}`}
              />
            );
          })}
        </div>

        {/* Present letters (right) */}
        <div className="flex items-center gap-1">
          {presentLetters.length > 0 ? (
            presentLetters.map((letter) => (
              <span
                key={letter}
                className="w-6 h-6 flex items-center justify-center rounded-sm bg-present dark:bg-present-dark text-white text-xs font-mono font-semibold"
                title={`${letter} is in the word`}
              >
                {letter}
              </span>
            ))
          ) : (
            <span className="w-6" /> /* Spacer for balance */
          )}
        </div>
      </div>
    </motion.div>
  );
}
