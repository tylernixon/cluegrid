"use client";

import { useCallback, useRef } from "react";
import type { CrosserData } from "@/types";

interface CluePanelProps {
  crossers: CrosserData[];
  selectedTarget: "main" | string;
  solvedWords: Set<string>;
  onSelectTarget: (targetId: string) => void;
}

export function CluePanel({
  crossers,
  selectedTarget,
  solvedWords,
  onSelectTarget,
}: CluePanelProps) {
  const listRef = useRef<HTMLOListElement>(null);

  // Get all selectable items (crossers + main)
  const allItems = [...crossers.map((c) => c.id), "main"];

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

  return (
    <nav
      className="w-full max-w-[480px] mx-auto px-4 py-3"
      aria-label="Clue navigation"
    >
      <h2
        id="clues-heading"
        className="text-caption text-ink-secondary dark:text-ink-secondary-dark uppercase tracking-wider mb-2"
      >
        Clues
      </h2>
      <ol
        ref={listRef}
        className="space-y-1"
        role="listbox"
        aria-labelledby="clues-heading"
        aria-activedescendant={`clue-${selectedTarget}`}
      >
        {crossers.map((crosser, i) => {
          const isSolved = solvedWords.has(crosser.id);
          const isActive = selectedTarget === crosser.id;
          return (
            <li key={crosser.id} role="presentation">
              <button
                type="button"
                id={`clue-${crosser.id}`}
                data-clue-id={crosser.id}
                role="option"
                aria-selected={isActive}
                aria-disabled={isSolved}
                className={`w-full text-left flex gap-3 items-start px-3 py-2 rounded-lg transition-colors ${focusClass}
                  ${isActive ? "bg-accent/10 dark:bg-accent-dark/10 border-l-2 border-accent dark:border-accent-dark" : "border-l-2 border-transparent"}
                  ${isSolved ? "opacity-60 cursor-not-allowed" : "hover:bg-surface-raised dark:hover:bg-surface-raised-dark cursor-pointer"}
                `}
                onClick={() => !isSolved && onSelectTarget(crosser.id)}
                onKeyDown={(e) => handleKeyDown(e, crosser.id)}
                tabIndex={isActive ? 0 : -1}
              >
                <span
                  className="font-mono text-caption text-accent dark:text-accent-dark w-5 shrink-0 pt-0.5"
                  aria-hidden="true"
                >
                  {i + 1}
                </span>
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
              </button>
            </li>
          );
        })}
        <li role="presentation">
          <button
            type="button"
            id="clue-main"
            data-clue-id="main"
            role="option"
            aria-selected={selectedTarget === "main"}
            className={`w-full text-left flex gap-3 items-start px-3 py-2 rounded-lg transition-colors ${focusClass}
              ${selectedTarget === "main" ? "bg-accent/10 dark:bg-accent-dark/10 border-l-2 border-accent dark:border-accent-dark" : "border-l-2 border-transparent hover:bg-surface-raised dark:hover:bg-surface-raised-dark"}
            `}
            onClick={() => onSelectTarget("main")}
            onKeyDown={(e) => handleKeyDown(e, "main")}
            tabIndex={selectedTarget === "main" ? 0 : -1}
          >
            <span
              className="font-mono text-caption text-accent dark:text-accent-dark w-5 shrink-0 pt-0.5"
              aria-hidden="true"
            >
              *
            </span>
            <span className="text-body-small italic text-ink-secondary dark:text-ink-secondary-dark">
              <span className="sr-only">Main word: </span>
              Main word -- deduce from crossing clues
            </span>
          </button>
        </li>
      </ol>
    </nav>
  );
}
