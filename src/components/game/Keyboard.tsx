"use client";

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

const keyStatusClasses: Record<KeyStatus, string> = {
  unused:
    "bg-surface-raised dark:bg-surface-raised-dark text-ink dark:text-ink-dark",
  correct: "bg-correct dark:bg-correct-dark text-white",
  present: "bg-present dark:bg-present-dark text-white",
  absent: "bg-absent dark:bg-absent-dark text-white dark:text-ink-tertiary-dark",
};

export function Keyboard({
  keyStatuses,
  onKey,
  onEnter,
  onBackspace,
  disabled,
}: KeyboardProps) {
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

  return (
    <div
      className="w-full max-w-[500px] mx-auto px-1 select-none"
      role="group"
      aria-label="Keyboard"
    >
      {ROWS.map((row, rowIndex) => (
        <div key={rowIndex} className="flex justify-center gap-[6px] mb-[6px]">
          {row.map((key) => {
            const isSpecial = key === "ENTER" || key === "BACK";
            const status = keyStatuses[key] ?? "unused";
            const statusClass = isSpecial
              ? "bg-accent dark:bg-accent-dark text-white"
              : keyStatusClasses[status];

            return (
              <button
                key={key}
                type="button"
                className={`${statusClass} flex items-center justify-center h-[52px] rounded-md text-body-small font-semibold shadow-sm transition-transform active:scale-[0.96]
                  ${isSpecial ? "px-3 min-w-[56px]" : "min-w-[32px] flex-1 max-w-[44px]"}
                `}
                onClick={() => handleKey(key)}
                aria-label={
                  key === "BACK"
                    ? "Backspace"
                    : key === "ENTER"
                      ? "Submit guess"
                      : key
                }
                disabled={disabled}
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
