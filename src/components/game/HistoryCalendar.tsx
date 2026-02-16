"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";

export type PuzzleStatus = "won" | "lost" | "missed";

export interface DayEntry {
  date: string; // YYYY-MM-DD
  status: PuzzleStatus;
  starRating?: number;
}

interface HistoryCalendarProps {
  year: number;
  month: number; // 0-indexed (0 = January)
  entries: DayEntry[];
  today: string; // YYYY-MM-DD
  firstPuzzleDate: string; // YYYY-MM-DD
  onPrevMonth: () => void;
  onNextMonth: () => void;
  canGoNext: boolean;
  canGoPrev: boolean;
  onSelectDay: (date: string) => void;
  selectedDate: string | null;
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function ChevronLeftIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function getStatusColor(status: PuzzleStatus): string {
  switch (status) {
    case "won":
      return "bg-correct dark:bg-correct-dark";
    case "lost":
      return "bg-error";
    case "missed":
      return "bg-ink-tertiary dark:bg-ink-tertiary-dark";
  }
}

export function HistoryCalendar({
  year,
  month,
  entries,
  today,
  firstPuzzleDate,
  onPrevMonth,
  onNextMonth,
  canGoNext,
  canGoPrev,
  onSelectDay,
  selectedDate,
}: HistoryCalendarProps) {
  // Build the calendar grid
  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const startDow = firstDay.getDay(); // 0 = Sun
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Build lookup from entries
    const entryMap = new Map<string, DayEntry>();
    for (const entry of entries) {
      entryMap.set(entry.date, entry);
    }

    const days: Array<{
      day: number | null;
      date: string | null;
      entry: DayEntry | null;
      isToday: boolean;
      isFuture: boolean;
      isBeforeFirstPuzzle: boolean;
    }> = [];

    // Leading empty cells
    for (let i = 0; i < startDow; i++) {
      days.push({ day: null, date: null, entry: null, isToday: false, isFuture: false, isBeforeFirstPuzzle: false });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const entry = entryMap.get(dateStr) ?? null;
      const isToday = dateStr === today;
      const isFuture = dateStr > today;
      const isBeforeFirstPuzzle = dateStr < firstPuzzleDate;

      days.push({ day: d, date: dateStr, entry, isToday, isFuture, isBeforeFirstPuzzle });
    }

    return days;
  }, [year, month, entries, today, firstPuzzleDate]);

  return (
    <div className="w-full">
      {/* Month/Year header with navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={onPrevMonth}
          disabled={!canGoPrev}
          className="w-11 h-11 flex items-center justify-center rounded-lg text-ink-secondary dark:text-ink-secondary-dark hover:text-ink dark:hover:text-ink-dark hover:bg-surface-raised dark:hover:bg-surface-raised-dark transition-colors disabled:opacity-30 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4A8B8D]"
          aria-label="Previous month"
        >
          <ChevronLeftIcon />
        </button>

        <h3 className="text-heading-3 font-serif text-ink dark:text-ink-dark">
          {MONTH_NAMES[month]} {year}
        </h3>

        <button
          type="button"
          onClick={onNextMonth}
          disabled={!canGoNext}
          className="w-11 h-11 flex items-center justify-center rounded-lg text-ink-secondary dark:text-ink-secondary-dark hover:text-ink dark:hover:text-ink-dark hover:bg-surface-raised dark:hover:bg-surface-raised-dark transition-colors disabled:opacity-30 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4A8B8D]"
          aria-label="Next month"
        >
          <ChevronRightIcon />
        </button>
      </div>

      {/* Day-of-week labels */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {DAY_LABELS.map((label) => (
          <div
            key={label}
            className="text-center text-caption text-ink-tertiary dark:text-ink-tertiary-dark py-1"
          >
            {label}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1" role="grid" aria-label={`${MONTH_NAMES[month]} ${year} puzzle history`}>
        {calendarDays.map((cell, i) => {
          if (cell.day === null) {
            return <div key={`empty-${i}`} className="aspect-square" />;
          }

          const isInteractive = !cell.isFuture && !cell.isBeforeFirstPuzzle && (cell.entry !== null || cell.isToday);
          const isSelected = cell.date === selectedDate;

          return (
            <motion.button
              key={cell.date}
              type="button"
              disabled={!isInteractive}
              onClick={() => {
                if (isInteractive && cell.date) {
                  onSelectDay(cell.date);
                }
              }}
              className={`
                aspect-square rounded-lg flex flex-col items-center justify-center relative min-h-[44px]
                transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4A8B8D]
                ${isInteractive ? "cursor-pointer hover:bg-surface-raised dark:hover:bg-surface-raised-dark" : "cursor-default"}
                ${isSelected ? "bg-surface-raised dark:bg-surface-raised-dark ring-2 ring-[#4A8B8D]" : ""}
                ${cell.isToday ? "border border-[#4A8B8D]/50" : ""}
                ${cell.isFuture || cell.isBeforeFirstPuzzle ? "opacity-30" : ""}
              `}
              whileTap={isInteractive ? { scale: 0.95 } : undefined}
              aria-label={`${MONTH_NAMES[month]} ${cell.day}${cell.isToday ? ", today" : ""}${cell.entry ? `, ${cell.entry.status}` : ""}`}
            >
              <span className={`text-body-small font-medium ${cell.isToday ? "text-[#4A8B8D]" : "text-ink dark:text-ink-dark"}`}>
                {cell.day}
              </span>

              {/* Status dot */}
              {cell.entry && (
                <span className={`w-1.5 h-1.5 rounded-full mt-0.5 ${getStatusColor(cell.entry.status)}`} />
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-4 pt-3 border-t border-border/50 dark:border-border-dark/50">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-correct dark:bg-correct-dark" />
          <span className="text-caption text-ink-tertiary dark:text-ink-tertiary-dark">Won</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-error" />
          <span className="text-caption text-ink-tertiary dark:text-ink-tertiary-dark">Lost</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-ink-tertiary dark:bg-ink-tertiary-dark" />
          <span className="text-caption text-ink-tertiary dark:text-ink-tertiary-dark">Missed</span>
        </div>
      </div>
    </div>
  );
}
