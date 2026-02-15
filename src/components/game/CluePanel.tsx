"use client";

import { useCallback, useRef, useState, useEffect, useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { CrosserData } from "@/types";
import { TIMING, EASE } from "@/lib/motion";

interface CluePanelProps {
  crossers: CrosserData[];
  selectedTarget: "main" | string;
  solvedWords: Set<string>;
  mainWordLength: number;
  onSelectTarget: (targetId: string) => void;
}

export function CluePanel({
  crossers,
  selectedTarget,
  solvedWords,
  mainWordLength,
  onSelectTarget,
}: CluePanelProps) {
  const listRef = useRef<HTMLOListElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check for mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Get all selectable items (crossers + main)
  const allItems = useMemo(() => [...crossers.map((c) => c.id), "main"], [crossers]);

  // Find next/prev navigable item
  const findNavigableItem = useCallback(
    (currentId: string, direction: "next" | "prev"): string | null => {
      const currentIndex = allItems.indexOf(currentId);
      if (currentIndex === -1) return null;

      if (direction === "next") {
        // Find next unsolved item
        for (let i = currentIndex + 1; i < allItems.length; i++) {
          const itemId = allItems[i]!;
          if (itemId === "main" || !solvedWords.has(itemId)) {
            return itemId;
          }
        }
      } else {
        // Find previous unsolved item
        for (let i = currentIndex - 1; i >= 0; i--) {
          const itemId = allItems[i]!;
          if (itemId === "main" || !solvedWords.has(itemId)) {
            return itemId;
          }
        }
      }
      return null;
    },
    [allItems, solvedWords],
  );

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, itemId: string) => {
      let nextId: string | null = null;

      switch (e.key) {
        case "ArrowDown":
        case "ArrowRight":
          e.preventDefault();
          nextId = findNavigableItem(itemId, "next");
          break;
        case "ArrowUp":
        case "ArrowLeft":
          e.preventDefault();
          nextId = findNavigableItem(itemId, "prev");
          break;
        case "Home":
          e.preventDefault();
          // Find first unsolved
          nextId =
            allItems.find((id) => id === "main" || !solvedWords.has(id)) ?? null;
          break;
        case "End":
          e.preventDefault();
          // Find last unsolved (always main or last unsolved crosser)
          for (let i = allItems.length - 1; i >= 0; i--) {
            const id = allItems[i]!;
            if (id === "main" || !solvedWords.has(id)) {
              nextId = id;
              break;
            }
          }
          break;
      }

      if (nextId) {
        // Focus and select the item
        const button = listRef.current?.querySelector(
          `[data-clue-id="${nextId}"]`,
        ) as HTMLButtonElement | null;
        if (button) {
          button.focus();
          onSelectTarget(nextId);
        }
      }
    },
    [findNavigableItem, allItems, solvedWords, onSelectTarget],
  );

  const focusClass =
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent dark:focus-visible:ring-accent-dark focus-visible:ring-offset-2 focus-visible:ring-offset-canvas dark:focus-visible:ring-offset-canvas-dark";

  const prefersReducedMotion = useReducedMotion();

  // Render a single clue item with smooth selection animation
  const renderClueItem = (crosser: CrosserData, i: number) => {
    const isSolved = solvedWords.has(crosser.id);
    const isActive = selectedTarget === crosser.id;

    // Smooth background/border animation for selection (150-200ms)
    const selectionAnimation = !prefersReducedMotion ? {
      backgroundColor: isActive ? "rgba(var(--accent-rgb, 59, 130, 246), 0.1)" : "rgba(0, 0, 0, 0)",
      borderLeftColor: isActive ? "rgb(var(--accent-rgb, 59, 130, 246))" : "transparent",
    } : {};

    const selectionTransition = !prefersReducedMotion ? {
      duration: TIMING.fast,
      ease: EASE.out,
    } : {};

    return (
      <li key={crosser.id} role="presentation">
        <motion.button
          type="button"
          id={`clue-${crosser.id}`}
          data-clue-id={crosser.id}
          role="option"
          aria-selected={isActive}
          aria-disabled={isSolved}
          className={`w-full text-left flex gap-3 items-start px-3 py-2 rounded-lg border-l-2 ${focusClass}
            ${isSolved ? "opacity-60 cursor-not-allowed" : "hover:bg-surface-raised dark:hover:bg-surface-raised-dark cursor-pointer"}
          `}
          style={{
            borderLeftColor: isActive ? undefined : "transparent",
          }}
          onClick={() => !isSolved && onSelectTarget(crosser.id)}
          onKeyDown={(e) => handleKeyDown(e, crosser.id)}
          tabIndex={isActive ? 0 : -1}
          animate={selectionAnimation}
          transition={selectionTransition}
        >
          <span
            className="font-mono text-caption text-accent dark:text-accent-dark w-5 shrink-0 pt-0.5"
            aria-hidden="true"
          >
            {i + 1}
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[10px] uppercase tracking-wider text-ink-tertiary dark:text-ink-tertiary-dark font-medium">
                Down
              </span>
              <span className="text-[10px] text-ink-tertiary dark:text-ink-tertiary-dark">
                ({crosser.word.length})
              </span>
            </div>
            <span
              className={`text-body-small ${
                isSolved
                  ? "line-through text-ink-secondary dark:text-ink-secondary-dark"
                  : isActive
                    ? "text-ink dark:text-ink-dark font-medium"
                    : "text-ink dark:text-ink-dark"
              }`}
            >
              <span className="sr-only">Clue {i + 1}: </span>
              {crosser.clue}
              {isSolved && (
                <>
                  <span className="sr-only">. Solved: </span>
                  <span className="ml-2 font-mono font-bold no-underline text-correct dark:text-correct-dark">
                    {crosser.word}
                  </span>
                </>
              )}
            </span>
          </div>
        </motion.button>
      </li>
    );
  };

  const renderMainClue = () => {
    const isActive = selectedTarget === "main";

    // Smooth selection animation for main clue
    const selectionAnimation = !prefersReducedMotion ? {
      backgroundColor: isActive ? "rgba(var(--accent-rgb, 59, 130, 246), 0.1)" : "rgba(0, 0, 0, 0)",
      borderLeftColor: isActive ? "rgb(var(--accent-rgb, 59, 130, 246))" : "transparent",
    } : {};

    const selectionTransition = !prefersReducedMotion ? {
      duration: TIMING.fast,
      ease: EASE.out,
    } : {};

    return (
      <li role="presentation">
        <motion.button
          type="button"
          id="clue-main"
          data-clue-id="main"
          role="option"
          aria-selected={isActive}
          className={`w-full text-left flex gap-3 items-start px-3 py-2 rounded-lg border-l-2 ${focusClass}
            ${!isActive ? "hover:bg-surface-raised dark:hover:bg-surface-raised-dark" : ""}
          `}
          style={{
            borderLeftColor: isActive ? undefined : "transparent",
          }}
          onClick={() => onSelectTarget("main")}
          onKeyDown={(e) => handleKeyDown(e, "main")}
          tabIndex={isActive ? 0 : -1}
          animate={selectionAnimation}
          transition={selectionTransition}
        >
          <span
            className="font-mono text-caption text-accent dark:text-accent-dark w-5 shrink-0 pt-0.5"
            aria-hidden="true"
          >
            *
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[10px] uppercase tracking-wider text-ink-tertiary dark:text-ink-tertiary-dark font-medium">
                Across
              </span>
              <span className="text-[10px] text-ink-tertiary dark:text-ink-tertiary-dark">
                ({mainWordLength})
              </span>
            </div>
            <span className="text-body-small italic text-ink-secondary dark:text-ink-secondary-dark">
              <span className="sr-only">Main word: </span>
              Main word - deduce from crossing clues
            </span>
          </div>
        </motion.button>
      </li>
    );
  };

  return (
    <nav
      className="w-full max-w-[480px] mx-auto px-4 py-3"
      aria-label="Clue navigation"
    >
      {/* Onboarding hint */}
      <p className="text-caption text-ink-tertiary dark:text-ink-tertiary-dark text-center mb-3">
        Solve the clues to reveal the main word.
      </p>

      {/* Mobile: Show expand toggle only (active clue is shown in ActiveCluePanel) */}
      {isMobile && !isExpanded && (
        <button
          type="button"
          onClick={() => setIsExpanded(true)}
          className={`w-full text-center text-caption text-accent dark:text-accent-dark py-2 hover:bg-surface-raised dark:hover:bg-surface-raised-dark rounded-lg transition-colors ${focusClass}`}
        >
          Show all clues
        </button>
      )}

      {/* Desktop or expanded mobile: Show all clues */}
      {(!isMobile || isExpanded) && (
        <>
          <div className="flex items-center justify-between mb-2">
            <h2
              id="clues-heading"
              className="text-caption text-ink-secondary dark:text-ink-secondary-dark uppercase tracking-wider"
            >
              Clues
            </h2>
            {isMobile && isExpanded && (
              <button
                type="button"
                onClick={() => setIsExpanded(false)}
                className={`text-caption text-accent dark:text-accent-dark hover:underline ${focusClass}`}
              >
                Hide clues
              </button>
            )}
          </div>
          <ol
            ref={listRef}
            className="space-y-1"
            role="listbox"
            aria-labelledby="clues-heading"
            aria-activedescendant={`clue-${selectedTarget}`}
          >
            {crossers.map((crosser, i) => renderClueItem(crosser, i))}
            {renderMainClue()}
          </ol>
        </>
      )}
    </nav>
  );
}
