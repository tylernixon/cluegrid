"use client";

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
  return (
    <div className="w-full max-w-[480px] mx-auto px-4 py-3">
      <h2 className="text-caption text-ink-secondary dark:text-ink-secondary-dark uppercase tracking-wider mb-2">
        Clues
      </h2>
      <ol className="space-y-1">
        {crossers.map((crosser, i) => {
          const isSolved = solvedWords.has(crosser.id);
          const isActive = selectedTarget === crosser.id;
          return (
            <li key={crosser.id}>
              <button
                type="button"
                className={`w-full text-left flex gap-3 items-start px-3 py-2 rounded-lg transition-colors
                  ${isActive ? "bg-accent/10 dark:bg-accent-dark/10 border-l-2 border-accent dark:border-accent-dark" : "border-l-2 border-transparent"}
                  ${isSolved ? "opacity-60" : "hover:bg-surface-raised dark:hover:bg-surface-raised-dark"}
                `}
                onClick={() => !isSolved && onSelectTarget(crosser.id)}
                disabled={isSolved}
              >
                <span className="font-mono text-caption text-accent dark:text-accent-dark w-5 shrink-0 pt-0.5">
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
                  {crosser.clue}
                  {isSolved && (
                    <span className="ml-2 font-mono font-bold no-underline text-correct dark:text-correct-dark">
                      {crosser.word}
                    </span>
                  )}
                </span>
              </button>
            </li>
          );
        })}
        <li>
          <button
            type="button"
            className={`w-full text-left flex gap-3 items-start px-3 py-2 rounded-lg transition-colors
              ${selectedTarget === "main" ? "bg-accent/10 dark:bg-accent-dark/10 border-l-2 border-accent dark:border-accent-dark" : "border-l-2 border-transparent hover:bg-surface-raised dark:hover:bg-surface-raised-dark"}
            `}
            onClick={() => onSelectTarget("main")}
          >
            <span className="font-mono text-caption text-accent dark:text-accent-dark w-5 shrink-0 pt-0.5">
              *
            </span>
            <span className="text-body-small italic text-ink-secondary dark:text-ink-secondary-dark">
              Main word -- deduce from crossing clues
            </span>
          </button>
        </li>
      </ol>
    </div>
  );
}
