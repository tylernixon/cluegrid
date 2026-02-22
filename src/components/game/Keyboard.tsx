"use client";

import { useCallback, useRef } from "react";
import type { KeyStatus } from "@/types";

interface KeyboardProps {
  keyStatuses: Record<string, KeyStatus>;
  onKey: (key: string) => void;
  onEnter: () => void;
  onBackspace: () => void;
  disabled: boolean;
}

const ROWS = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["ENTER", "Z", "X", "C", "V", "B", "N", "M", "BACK"],
];

// Flat list of all keys for navigation
const ALL_KEYS = ROWS.flat();

const keyStatusClasses: Record<KeyStatus, string> = {
  unused:
    "bg-surface-raised dark:bg-surface-raised-dark text-ink dark:text-ink-dark",
  correct: "bg-correct dark:bg-correct-dark text-white",
  present: "bg-present dark:bg-present-dark text-white",
  absent: "bg-absent dark:bg-absent-dark text-white dark:text-ink-tertiary-dark",
};

// Get descriptive status for screen readers
const getKeyStatusDescription = (status: KeyStatus): string => {
  switch (status) {
    case "correct":
      return ", correct position";
    case "present":
      return ", in word but wrong position";
    case "absent":
      return ", not in word";
    default:
      return "";
  }
};

export function Keyboard({
  keyStatuses,
  onKey,
  onEnter,
  onBackspace,
  disabled,
}: KeyboardProps) {
  const keyboardRef = useRef<HTMLDivElement>(null);

  function handleKey(key: string) {
    if (disabled) return;
    if (key === "ENTER") {
      onEnter();
    } else if (key === "BACK") {
      onBackspace();
    } else {
      onKey(key);
    }
  }

  // Handle keyboard navigation within the virtual keyboard
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, key: string, rowIndex: number, keyIndex: number) => {
      let nextKey: string | null = null;

      switch (e.key) {
        case "ArrowRight":
          e.preventDefault();
          // Next key in same row, or wrap to next row
          if (keyIndex < ROWS[rowIndex]!.length - 1) {
            nextKey = ROWS[rowIndex]![keyIndex + 1]!;
          } else if (rowIndex < ROWS.length - 1) {
            nextKey = ROWS[rowIndex + 1]![0]!;
          }
          break;
        case "ArrowLeft":
          e.preventDefault();
          // Previous key in same row, or wrap to previous row
          if (keyIndex > 0) {
            nextKey = ROWS[rowIndex]![keyIndex - 1]!;
          } else if (rowIndex > 0) {
            const prevRow = ROWS[rowIndex - 1]!;
            nextKey = prevRow[prevRow.length - 1]!;
          }
          break;
        case "ArrowDown":
          e.preventDefault();
          // Move to key below (approximate position)
          if (rowIndex < ROWS.length - 1) {
            const nextRow = ROWS[rowIndex + 1]!;
            // Try to find a key at similar horizontal position
            const targetIndex = Math.min(keyIndex, nextRow.length - 1);
            nextKey = nextRow[targetIndex]!;
          }
          break;
        case "ArrowUp":
          e.preventDefault();
          // Move to key above (approximate position)
          if (rowIndex > 0) {
            const prevRow = ROWS[rowIndex - 1]!;
            const targetIndex = Math.min(keyIndex, prevRow.length - 1);
            nextKey = prevRow[targetIndex]!;
          }
          break;
        case "Home":
          e.preventDefault();
          nextKey = ALL_KEYS[0]!;
          break;
        case "End":
          e.preventDefault();
          nextKey = ALL_KEYS[ALL_KEYS.length - 1]!;
          break;
      }

      if (nextKey) {
        const button = keyboardRef.current?.querySelector(
          `[data-key="${nextKey}"]`,
        ) as HTMLButtonElement | null;
        button?.focus();
      }
    },
    [],
  );

  const focusClass =
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink dark:focus-visible:ring-ink-dark focus-visible:ring-offset-2 focus-visible:ring-offset-canvas dark:focus-visible:ring-offset-canvas-dark";

  return (
    <div
      ref={keyboardRef}
      className="w-full max-w-[500px] mx-auto px-1 select-none"
      role="group"
      aria-label="On-screen keyboard"
    >
      {ROWS.map((row, rowIndex) => (
        <div
          key={rowIndex}
          className="flex justify-center gap-[6px] mb-[6px]"
          role="group"
          aria-label={`Keyboard row ${rowIndex + 1}`}
        >
          {row.map((key, keyIndex) => {
            const isSpecial = key === "ENTER" || key === "BACK";
            const status = keyStatuses[key] ?? "unused";
            const statusClass = isSpecial
              ? "bg-accent dark:bg-accent-dark text-white"
              : keyStatusClasses[status];

            const statusDescription = isSpecial
              ? ""
              : getKeyStatusDescription(status);

            // First key of first row gets tabIndex 0
            const isFirstKey = rowIndex === 0 && keyIndex === 0;

            return (
              <button
                key={key}
                type="button"
                data-key={key}
                className={`${statusClass} ${focusClass} flex items-center justify-center h-[44px] rounded-md text-body-small font-semibold shadow-sm transition-transform active:scale-[0.96]
                  ${isSpecial ? "px-3 min-w-[56px]" : "min-w-[32px] flex-1 max-w-[44px]"}
                `}
                onClick={() => handleKey(key)}
                onKeyDown={(e) => handleKeyDown(e, key, rowIndex, keyIndex)}
                aria-label={
                  key === "BACK"
                    ? "Backspace, delete last letter"
                    : key === "ENTER"
                      ? "Submit guess"
                      : `${key}${statusDescription}`
                }
                aria-disabled={disabled}
                tabIndex={isFirstKey ? 0 : -1}
              >
                {key === "BACK" ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" />
                    <line x1="18" y1="9" x2="12" y2="15" />
                    <line x1="12" y1="9" x2="18" y2="15" />
                  </svg>
                ) : key === "ENTER" ? (
                  "enter"
                ) : (
                  key
                )}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
