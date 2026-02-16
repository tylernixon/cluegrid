"use client";

import { motion } from "framer-motion";
import type { PuzzleStatus } from "./HistoryCalendar";

interface HistoryPuzzleCardProps {
  date: string; // YYYY-MM-DD
  status: PuzzleStatus;
  starRating?: number;
  onClick: () => void;
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y!, m! - 1, d);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function StatusBadge({ status }: { status: PuzzleStatus }) {
  switch (status) {
    case "won":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-caption font-medium bg-correct/15 dark:bg-correct-dark/15 text-correct dark:text-correct-dark">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Won
        </span>
      );
    case "lost":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-caption font-medium bg-error/15 text-error">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
          Lost
        </span>
      );
    case "missed":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-caption font-medium bg-border dark:bg-border-dark text-ink-tertiary dark:text-ink-tertiary-dark">
          Missed
        </span>
      );
  }
}

function StarDisplay({ rating }: { rating: number }) {
  const stars = Array.from({ length: 3 }, (_, i) => i < rating);
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} out of 3 stars`}>
      {stars.map((filled, i) => (
        <span key={i} className="text-sm" aria-hidden="true">
          {filled ? "\u2B50" : "\u2606"}
        </span>
      ))}
    </div>
  );
}

export function HistoryPuzzleCard({ date, status, starRating, onClick }: HistoryPuzzleCardProps) {
  const isMissed = status === "missed";

  return (
    <motion.button
      type="button"
      onClick={onClick}
      className={`
        w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4A8B8D]
        ${isMissed
          ? "bg-surface-raised/50 dark:bg-surface-raised-dark/50 border border-border/30 dark:border-border-dark/30"
          : "bg-surface-raised dark:bg-surface-raised-dark border border-border/50 dark:border-border-dark/50 hover:border-border-active dark:hover:border-border-active-dark"
        }
      `}
      whileTap={{ scale: 0.98 }}
      aria-label={`${formatDate(date)}, ${status}${starRating !== undefined ? `, ${starRating} stars` : ""}`}
    >
      {/* Date */}
      <div className="flex-1 min-w-0">
        <p className={`text-body font-medium ${isMissed ? "text-ink-tertiary dark:text-ink-tertiary-dark" : "text-ink dark:text-ink-dark"}`}>
          {formatDate(date)}
        </p>
        <p className="text-caption text-ink-tertiary dark:text-ink-tertiary-dark mt-0.5">
          {isMissed ? "Tap to play" : "Tap to view"}
        </p>
      </div>

      {/* Star rating (only for won) */}
      {status === "won" && starRating !== undefined && (
        <StarDisplay rating={starRating} />
      )}

      {/* Status badge */}
      <StatusBadge status={status} />

      {/* Chevron */}
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-ink-tertiary dark:text-ink-tertiary-dark shrink-0"
        aria-hidden="true"
      >
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </motion.button>
  );
}
