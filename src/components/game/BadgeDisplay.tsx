"use client";

import type { Badge, BadgeId } from "@/types";
import { BADGE_DEFINITIONS } from "@/types";

interface BadgeDisplayProps {
  earnedBadges: Badge[];
}

// SVG icons for badges (consistent visual language)
const BadgeIcons: Record<BadgeId, React.ReactNode> = {
  first_win: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  ),
  genius: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" />
      <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z" />
      <path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4" />
      <path d="M12 18v4" />
    </svg>
  ),
  quick_thinker: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  ),
  hint_master: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
      <path d="M11 8v6" />
      <path d="M8 11h6" />
    </svg>
  ),
  streak_3: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
    </svg>
  ),
  streak_7: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
      <line x1="12" y1="2" x2="12" y2="12" />
    </svg>
  ),
  streak_30: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14" />
    </svg>
  ),
  century: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 8V4H8" />
      <rect width="16" height="12" x="4" y="8" rx="2" />
      <path d="M2 14h2" />
      <path d="M20 14h2" />
      <path d="M15 13v2" />
      <path d="M9 13v2" />
    </svg>
  ),
  perfectionist: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  ),
};

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
    <div className="grid grid-cols-3 gap-2">
      {ALL_BADGE_IDS.map((id) => {
        const def = BADGE_DEFINITIONS[id];
        const earned = earnedMap.get(id);
        const isEarned = !!earned;

        return (
          <div
            key={id}
            className={`relative flex flex-col items-center gap-1.5 p-2.5 rounded-xl border transition-all ${
              isEarned
                ? "bg-present/10 dark:bg-present-dark/10 border-present/40 dark:border-present-dark/40"
                : "bg-surface dark:bg-surface-dark border-border dark:border-border-dark"
            }`}
            title={`${def.name} - ${def.description}`}
          >
            {/* Earned checkmark */}
            {isEarned && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-present dark:bg-present-dark rounded-full flex items-center justify-center">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </span>
            )}

            {/* Icon */}
            <span className={isEarned ? "text-present dark:text-present-dark" : "text-ink-tertiary dark:text-ink-tertiary-dark"}>
              {BadgeIcons[id]}
            </span>

            {/* Name */}
            <span className={`text-[10px] font-semibold text-center leading-tight ${
              isEarned ? "text-ink dark:text-ink-dark" : "text-ink-secondary dark:text-ink-secondary-dark"
            }`}>
              {def.name}
            </span>
          </div>
        );
      })}
    </div>
  );
}
