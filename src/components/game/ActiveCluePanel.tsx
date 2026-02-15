"use client";

import { useCallback, useState } from "react";
import { motion, useReducedMotion, AnimatePresence, type PanInfo } from "framer-motion";
import type { CrosserData } from "@/types";
import { TIMING, EASE } from "@/lib/motion";

interface ActiveCluePanelProps {
  selectedTarget: "main" | string;
  crossers: CrosserData[];
  solvedWords: Set<string>;
  onSelectTarget: (targetId: "main" | string) => void;
}

export function ActiveCluePanel({
  selectedTarget,
  crossers,
  solvedWords,
  onSelectTarget,
}: ActiveCluePanelProps) {
  const isSolved = solvedWords.has(selectedTarget);
  const prefersReducedMotion = useReducedMotion();
  const [swipeDirection, setSwipeDirection] = useState<"left" | "right" | null>(null);

  // Build list of all navigable targets (crossers + main)
  const allTargets: ("main" | string)[] = [...crossers.map((c) => c.id), "main"];
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

  // Get the active clue info
  const getClueInfo = () => {
    if (selectedTarget === "main") {
      return {
        label: "Main Word",
        clue: "Deduce from crossing hints",
        hintNote: null as string | null,
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

  const hasPrev = findNextTarget("prev") !== null;
  const hasNext = findNextTarget("next") !== null;

  const buttonClass =
    "w-10 h-10 flex items-center justify-center rounded-full text-ink-secondary dark:text-ink-secondary-dark hover:text-ink dark:hover:text-ink-dark hover:bg-surface dark:hover:bg-surface-dark transition-colors disabled:opacity-30 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent dark:focus-visible:ring-accent-dark";

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
      className="w-full max-w-[480px] mx-auto px-4 py-3 bg-surface-raised dark:bg-surface-raised-dark rounded-xl border border-border dark:border-border-dark relative overflow-hidden touch-pan-y"
      drag={prefersReducedMotion ? false : "x"}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.2}
      onDragEnd={handleDragEnd}
    >
      {/* Navigation arrows */}
      <div className="absolute left-1 top-1/2 -translate-y-1/2 z-10">
        <button
          type="button"
          onClick={goToPrev}
          disabled={!hasPrev}
          className={buttonClass}
          aria-label="Previous clue"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
      </div>
      <div className="absolute right-1 top-1/2 -translate-y-1/2 z-10">
        <button
          type="button"
          onClick={goToNext}
          disabled={!hasNext}
          className={buttonClass}
          aria-label="Next clue"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      {/* Card content with animation */}
      <AnimatePresence mode="wait" custom={swipeDirection}>
        <motion.div
          key={selectedTarget}
          className="px-8"
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

          {/* Clue text */}
          <p className="text-body font-serif text-ink dark:text-ink-dark text-center italic">
            {clueInfo.clue}
          </p>

          {/* Hint note */}
          {clueInfo.hintNote && (
            <p className="text-caption text-present dark:text-present-dark text-center mt-1 italic">
              {clueInfo.hintNote}
            </p>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Dot indicators */}
      <div className="flex items-center justify-center gap-1.5 mt-3">
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
    </motion.div>
  );
}
