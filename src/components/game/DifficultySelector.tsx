"use client";

import type { Difficulty } from "@/types";
import { DIFFICULTY_GUESS_LIMITS } from "@/types";

interface DifficultySelectorProps {
  selected: Difficulty;
  onChange: (difficulty: Difficulty) => void;
}

const DIFFICULTY_OPTIONS: {
  value: Difficulty;
  label: string;
  subtitle: string;
  colorClass: string;
  selectedBg: string;
  selectedBorder: string;
}[] = [
  {
    value: "easy",
    label: "Easy",
    subtitle: "Beginner-friendly",
    colorClass: "text-emerald-600 dark:text-emerald-400",
    selectedBg: "bg-emerald-50 dark:bg-emerald-950/40",
    selectedBorder: "border-emerald-500 dark:border-emerald-400",
  },
  {
    value: "medium",
    label: "Medium",
    subtitle: "Standard challenge",
    colorClass: "text-amber-600 dark:text-amber-400",
    selectedBg: "bg-amber-50 dark:bg-amber-950/40",
    selectedBorder: "border-amber-500 dark:border-amber-400",
  },
  {
    value: "hard",
    label: "Hard",
    subtitle: "For seasoned solvers",
    colorClass: "text-orange-600 dark:text-orange-400",
    selectedBg: "bg-orange-50 dark:bg-orange-950/40",
    selectedBorder: "border-orange-500 dark:border-orange-400",
  },
  {
    value: "expert",
    label: "Expert",
    subtitle: "Only 2 guesses!",
    colorClass: "text-red-600 dark:text-red-400",
    selectedBg: "bg-red-50 dark:bg-red-950/40",
    selectedBorder: "border-red-500 dark:border-red-400",
  },
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
            className={`flex flex-col items-start gap-0.5 px-4 py-3 rounded-lg border-2 transition-all duration-150 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent dark:focus-visible:ring-accent-dark focus-visible:ring-offset-2 ${
              isSelected
                ? `${option.selectedBg} ${option.selectedBorder}`
                : "border-border dark:border-border-dark hover:border-border-active dark:hover:border-border-active bg-surface dark:bg-surface-dark"
            }`}
          >
            <span className={`text-body font-semibold ${isSelected ? option.colorClass : "text-ink dark:text-ink-dark"}`}>
              {option.label}
            </span>
            <span className="text-caption text-ink-secondary dark:text-ink-secondary-dark">
              {option.subtitle}
            </span>
            <span className={`text-caption font-semibold mt-1 ${isSelected ? option.colorClass : "text-ink-tertiary dark:text-ink-tertiary-dark"}`}>
              {guesses} guesses
            </span>
          </button>
        );
      })}
    </div>
  );
}
