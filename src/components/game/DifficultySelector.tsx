"use client";

import type { Difficulty } from "@/types";
import { DIFFICULTY_GUESS_LIMITS } from "@/types";

interface DifficultySelectorProps {
  selected: Difficulty;
  onChange: (difficulty: Difficulty) => void;
}

// SVG icons for each difficulty
const DifficultyIcons: Record<Difficulty, React.ReactNode> = {
  easy: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M8 14s1.5 2 4 2 4-2 4-2" />
      <line x1="9" y1="9" x2="9.01" y2="9" />
      <line x1="15" y1="9" x2="15.01" y2="9" />
    </svg>
  ),
  medium: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v4" />
      <path d="m6.8 14-3.5 2" />
      <path d="m20.7 16-3.5-2" />
      <path d="M6.8 10 3.3 8" />
      <path d="m20.7 8-3.5 2" />
      <circle cx="12" cy="12" r="4" />
    </svg>
  ),
  hard: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
    </svg>
  ),
  expert: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  ),
};

const DIFFICULTY_OPTIONS: {
  value: Difficulty;
  label: string;
  subtitle: string;
}[] = [
  { value: "easy", label: "Easy", subtitle: "Beginner-friendly" },
  { value: "medium", label: "Medium", subtitle: "Standard challenge" },
  { value: "hard", label: "Hard", subtitle: "For seasoned solvers" },
  { value: "expert", label: "Expert", subtitle: "Ultimate test" },
];

export function DifficultySelector({ selected, onChange }: DifficultySelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Difficulty level">
      {DIFFICULTY_OPTIONS.map((option) => {
        const isSelected = selected === option.value;
        const guesses = DIFFICULTY_GUESS_LIMITS[option.value];

        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => onChange(option.value)}
            className={`relative flex items-start gap-3 px-4 py-3 rounded-lg border-2 transition-all duration-150 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-correct dark:focus-visible:ring-correct-dark focus-visible:ring-offset-2 ${
              isSelected
                ? "bg-correct/10 dark:bg-correct-dark/10 border-correct dark:border-correct-dark"
                : "border-border dark:border-border-dark hover:border-border-active dark:hover:border-border-active-dark bg-surface-raised dark:bg-surface-raised-dark"
            }`}
          >
            {/* Icon */}
            <span className={`mt-0.5 ${isSelected ? "text-correct dark:text-correct-dark" : "text-ink-tertiary dark:text-ink-tertiary-dark"}`}>
              {DifficultyIcons[option.value]}
            </span>

            {/* Text content */}
            <div className="flex-1 min-w-0">
              <span className={`text-body font-semibold block ${isSelected ? "text-correct dark:text-correct-dark" : "text-ink dark:text-ink-dark"}`}>
                {option.label}
              </span>
              <span className="text-caption text-ink-secondary dark:text-ink-secondary-dark block">
                {guesses} guesses
              </span>
            </div>

            {/* Check mark for selected */}
            {isSelected && (
              <span className="absolute top-2 right-2 text-correct dark:text-correct-dark">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
