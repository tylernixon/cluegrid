"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { HistoryCalendar } from "./HistoryCalendar";
import { HistoryPuzzleCard } from "./HistoryPuzzleCard";
import { HistoryDetailModal } from "./HistoryDetailModal";
import { useHistoryStore, type GameHistoryEntry } from "@/stores/historyStore";
import { useGameStore } from "@/stores/gameStore";
import type { DayEntry } from "./HistoryCalendar";
import type { PuzzleData } from "@/types";

interface HistoryViewProps {
  onClose: () => void;
}

const FIRST_PUZZLE_DATE = "2026-01-01";

function getTodayDate(): string {
  const now = new Date();
  const pacificDate = now.toLocaleDateString("en-CA", {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return pacificDate;
}

function ChevronLeftIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

export function HistoryView({ onClose }: HistoryViewProps) {
  const today = getTodayDate();
  const todayDate = useMemo(() => new Date(today + "T00:00:00"), [today]);

  const [currentYear, setCurrentYear] = useState(() => todayDate.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(() => todayDate.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [detailEntry, setDetailEntry] = useState<GameHistoryEntry | null>(null);
  const [detailPuzzle, setDetailPuzzle] = useState<PuzzleData | null>(null);
  const [isLoadingDetailPuzzle, setIsLoadingDetailPuzzle] = useState(false);

  const history = useHistoryStore((s) => s.history);
  const loadArchivePuzzle = useGameStore((s) => s.loadArchivePuzzle);

  // Convert history entries to DayEntry format for the calendar
  const entries: DayEntry[] = useMemo(() => {
    return history.map((h) => ({
      date: h.puzzleDate,
      status: h.status as "won" | "lost",
      starRating: h.starRating,
    }));
  }, [history]);

  // Build a lookup from date to history entry
  const entryByDate = useMemo(() => {
    const map = new Map<string, GameHistoryEntry>();
    for (const h of history) {
      map.set(h.puzzleDate, h);
    }
    return map;
  }, [history]);

  // Filter entries for the selected month to show in the list
  const monthEntries = useMemo(() => {
    const prefix = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}`;
    return entries
      .filter((e) => e.date.startsWith(prefix))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [entries, currentYear, currentMonth]);

  // Month navigation handlers
  const canGoNext = useMemo(() => {
    const todayYear = todayDate.getFullYear();
    const todayMonth = todayDate.getMonth();
    return currentYear < todayYear || (currentYear === todayYear && currentMonth < todayMonth);
  }, [currentYear, currentMonth, todayDate]);

  const canGoPrev = useMemo(() => {
    const firstDate = new Date(FIRST_PUZZLE_DATE + "T00:00:00");
    const firstYear = firstDate.getFullYear();
    const firstMonth = firstDate.getMonth();
    return currentYear > firstYear || (currentYear === firstYear && currentMonth > firstMonth);
  }, [currentYear, currentMonth]);

  const handlePrevMonth = useCallback(() => {
    if (!canGoPrev) return;
    if (currentMonth === 0) {
      setCurrentYear((y) => y - 1);
      setCurrentMonth(11);
    } else {
      setCurrentMonth((m) => m - 1);
    }
    setSelectedDate(null);
  }, [canGoPrev, currentMonth]);

  const handleNextMonth = useCallback(() => {
    if (!canGoNext) return;
    if (currentMonth === 11) {
      setCurrentYear((y) => y + 1);
      setCurrentMonth(0);
    } else {
      setCurrentMonth((m) => m + 1);
    }
    setSelectedDate(null);
  }, [canGoNext, currentMonth]);

  const handleSelectDay = useCallback((date: string) => {
    setSelectedDate((prev) => (prev === date ? null : date));
  }, []);

  const handlePuzzleCardClick = useCallback((date: string) => {
    const entry = entryByDate.get(date);
    if (entry) {
      // Played puzzle -> show detail modal and fetch puzzle data for it
      setDetailEntry(entry);
      setDetailPuzzle(null);
      setIsLoadingDetailPuzzle(true);
      fetch(`/api/puzzle/${date}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.puzzle) setDetailPuzzle(data.puzzle);
        })
        .catch(() => {})
        .finally(() => setIsLoadingDetailPuzzle(false));
    } else {
      // Missed puzzle -> load as playable archive game
      loadArchivePuzzle(date);
      onClose();
    }
  }, [entryByDate, loadArchivePuzzle, onClose]);

  // Get the entry for the selected date (if any)
  const selectedEntry = selectedDate
    ? entries.find((e) => e.date === selectedDate) ?? null
    : null;

  // Lock body scroll when history view is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const historyContent = (
    <div
      className="fixed inset-0 z-40"
      role="dialog"
      aria-modal="true"
      aria-label="Puzzle History"
    >
      {/* LAYER 1: Blurred backdrop - absolute full-bleed, NO safe area padding */}
      <motion.div
        className="absolute inset-0 bg-canvas/80 dark:bg-canvas-dark/80 backdrop-blur-xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      />

      {/* Edge gradients to blend any safe-area seams */}
      <div
        className="absolute inset-x-0 top-0 h-8 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.4), transparent)' }}
      />
      <div
        className="absolute inset-x-0 bottom-0 h-8 pointer-events-none"
        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.4), transparent)' }}
      />

      {/* LAYER 2: Content wrapper - absolute full-bleed with safe area padding */}
      <motion.div
        className="absolute inset-0 flex flex-col"
        style={{
          paddingTop: 'env(safe-area-inset-top)',
          paddingBottom: 'env(safe-area-inset-bottom)',
          paddingLeft: 'env(safe-area-inset-left)',
          paddingRight: 'env(safe-area-inset-right)',
        }}
        initial={{ opacity: 0, x: "-100%" }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: "-100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
      >
        {/* Header */}
        <header className="relative flex items-center justify-center h-14 px-4 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="absolute left-4 w-10 h-10 flex items-center justify-center text-ink-secondary dark:text-ink-secondary-dark hover:text-ink dark:hover:text-ink-dark transition-colors focus:outline-none"
            aria-label="Back to game"
          >
            <ChevronLeftIcon />
          </button>
          <h1 className="text-heading-3 font-serif text-ink dark:text-ink-dark">
            Puzzle History
          </h1>
        </header>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-lg mx-auto px-4 py-6">
            {/* Calendar */}
            <HistoryCalendar
              year={currentYear}
              month={currentMonth}
              entries={entries}
              today={today}
              firstPuzzleDate={FIRST_PUZZLE_DATE}
              onPrevMonth={handlePrevMonth}
              onNextMonth={handleNextMonth}
              canGoNext={canGoNext}
              canGoPrev={canGoPrev}
              onSelectDay={handleSelectDay}
              selectedDate={selectedDate}
            />

            {/* Selected day detail */}
            <AnimatePresence mode="wait">
              {selectedDate && (
                <motion.div
                  key={selectedDate}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="mt-4"
                >
                  {selectedEntry ? (
                    <HistoryPuzzleCard
                      date={selectedEntry.date}
                      status={selectedEntry.status}
                      starRating={selectedEntry.starRating}
                      onClick={() => handlePuzzleCardClick(selectedEntry.date)}
                    />
                  ) : (
                    <HistoryPuzzleCard
                      date={selectedDate}
                      status="missed"
                      onClick={() => handlePuzzleCardClick(selectedDate)}
                    />
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Puzzle list for the month */}
            {monthEntries.length > 0 && (
              <div className="mt-6">
                <h3 className="text-caption text-ink-tertiary dark:text-ink-tertiary-dark uppercase tracking-wider mb-3">
                  This month
                </h3>
                <div className="flex flex-col gap-2">
                  {monthEntries.map((entry) => (
                    <HistoryPuzzleCard
                      key={entry.date}
                      date={entry.date}
                      status={entry.status}
                      starRating={entry.starRating}
                      onClick={() => handlePuzzleCardClick(entry.date)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Empty state */}
            {monthEntries.length === 0 && !selectedDate && (
              <div className="mt-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-surface-raised dark:bg-surface-raised-dark flex items-center justify-center">
                  <svg
                    width="28"
                    height="28"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-ink-tertiary dark:text-ink-tertiary-dark"
                    aria-hidden="true"
                  >
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                </div>
                <p className="text-body text-ink-secondary dark:text-ink-secondary-dark">
                  No puzzle history yet
                </p>
                <p className="text-body-small text-ink-tertiary dark:text-ink-tertiary-dark mt-1">
                  Play puzzles to build your history
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Detail modal */}
        {detailEntry && (
          <HistoryDetailModal
            open={!!detailEntry}
            onClose={() => {
              setDetailEntry(null);
              setDetailPuzzle(null);
            }}
            entry={detailEntry}
            puzzle={detailPuzzle}
            isLoadingPuzzle={isLoadingDetailPuzzle}
          />
        )}
      </motion.div>
    </div>
  );

  // Portal to body to escape any parent transforms/constraints
  return createPortal(historyContent, document.body);
}
