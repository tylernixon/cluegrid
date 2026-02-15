"use client";

import type { Badge, BadgeId } from "@/types";
import { BADGE_DEFINITIONS } from "@/types";

interface BadgeDisplayProps {
  earnedBadges: Badge[];
}

const ALL_BADGE_IDS: BadgeId[] = [
  "first_win",
  "genius",
  "quick_thinker",
  "hint_master",
  "streak_3",
  "streak_7",
  "streak_30",
  "century",
  "perfectionist",
];

export function BadgeDisplay({ earnedBadges }: BadgeDisplayProps) {
  const earnedMap = new Map(earnedBadges.map((b) => [b.id, b]));

  return (
    <div className="grid grid-cols-3 gap-3">
      {ALL_BADGE_IDS.map((id) => {
        const def = BADGE_DEFINITIONS[id];
        const earned = earnedMap.get(id);
        const isEarned = !!earned;

        return (
          <div
            key={id}
            className={`relative flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all ${
              isEarned
                ? "bg-correct/10 dark:bg-correct-dark/10 border-correct/30 dark:border-correct-dark/30 shadow-[0_0_12px_rgba(var(--color-correct-rgb,104,159,56),0.2)]"
                : "bg-surface-raised/50 dark:bg-surface-raised-dark/50 border-border/50 dark:border-border-dark/50 opacity-40"
            }`}
            title={isEarned ? `${def.name} - Earned!` : `${def.name} - ${def.description}`}
          >
            <span
              className={`text-2xl ${isEarned ? "" : "grayscale"}`}
              aria-hidden="true"
            >
              {def.icon}
            </span>
            <span
              className={`text-caption font-semibold text-center leading-tight ${
                isEarned
                  ? "text-ink dark:text-ink-dark"
                  : "text-ink-tertiary dark:text-ink-tertiary-dark"
              }`}
            >
              {def.name}
            </span>
            <span
              className={`text-[10px] text-center leading-tight ${
                isEarned
                  ? "text-ink-secondary dark:text-ink-secondary-dark"
                  : "text-ink-tertiary dark:text-ink-tertiary-dark"
              }`}
            >
              {def.description}
            </span>
          </div>
        );
      })}
    </div>
  );
}
