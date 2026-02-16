"use client";

import { useState, useEffect, useMemo } from "react";
import { Modal } from "@/components/ui/Modal";
import { ShareButton } from "@/components/ui/ShareButton";
import { WIN_MESSAGES, calculateStars } from "@/types";
import type { StarRating } from "@/types";
import { useStatsStore } from "@/stores/statsStore";
import type { PuzzleData, Guess } from "@/types";

interface CompletionModalProps {
  open: boolean;
  onClose: () => void;
  status: "won" | "lost";
  puzzle: PuzzleData;
  guesses: Guess[];
  solvedWords: Set<string>;
  hintsUsed: number;
  isArchiveMode?: boolean;
  archiveDate?: string | null;
  onReturnToDaily?: () => void;
}

// Countdown timer hook - counts down to midnight UTC
function useCountdown() {
  const [timeLeft, setTimeLeft] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);

  useEffect(() => {
    function calculateTimeLeft() {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
      tomorrow.setUTCHours(0, 0, 0, 0);

      const diff = tomorrow.getTime() - now.getTime();
      if (diff <= 0) return { hours: 0, minutes: 0, seconds: 0 };

      return {
        hours: Math.floor(diff / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      };
    }

    setTimeLeft(calculateTimeLeft());
    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return timeLeft;
}

// Fire icon SVG component
function FireIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 2C9.24 2 7 4.24 7 7c0 1.33.53 2.53 1.39 3.42C7.53 11.31 7 12.58 7 14c0 3.31 2.69 6 6 6s6-2.69 6-6c0-1.42-.53-2.69-1.39-3.58C18.47 9.53 19 8.33 19 7c0-2.76-2.24-5-5-5z" />
    </svg>
  );
}

// Checkmark icon
function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

// Clock icon
function ClockIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

// Star display component
function StarDisplay({ rating, className }: { rating: StarRating; className?: string }) {
  const stars = Array.from({ length: 3 }, (_, i) => i < rating);
  return (
    <div className={`flex items-center gap-1 ${className ?? ""}`} aria-label={`${rating} out of 3 stars`}>
      {stars.map((filled, i) => (
        <span key={i} className="text-2xl" aria-hidden="true">
          {filled ? "\u2B50" : "\u2606"}
        </span>
      ))}
    </div>
  );
}

export function CompletionModal({
  open,
  onClose,
  status,
  puzzle,
  guesses,
  solvedWords,
  hintsUsed,
  isArchiveMode = false,
  archiveDate: _archiveDate,
  onReturnToDaily,
}: CompletionModalProps) {
  // archiveDate reserved for future "Playing: Feb 10" banner display
  void _archiveDate;
  const [hasAnimated, setHasAnimated] = useState(false);

  const currentStreak = useStatsStore((s) => s.currentStreak);
  const streakSavedByGrace = useStatsStore((s) => s.streakSavedByGrace);
  const countdown = useCountdown();

  const totalCrossers = puzzle.crossers.length;
  const mainGuesses = guesses.filter((g) => g.targetId === "main");

  // Star rating based on hints used
  const starRating = calculateStars(hintsUsed, totalCrossers);

  // Calculate perfect game - no hints used and solved quickly
  const isPerfectGame =
    status === "won" && hintsUsed === 0 && mainGuesses.length <= 3;

  const winMessage = useMemo(() => {
    if (status === "lost") return null;
    if (isPerfectGame) return "Perfect!";
    if (starRating === 3) return "Brilliant!";
    if (starRating === 2) return "Great job!";
    return WIN_MESSAGES[mainGuesses.length] ?? "Well done!";
  }, [status, isPerfectGame, starRating, mainGuesses.length]);

  // Trigger staggered animation when modal opens
  useEffect(() => {
    if (open && !hasAnimated) {
      const timer = setTimeout(() => setHasAnimated(true), 100);
      return () => clearTimeout(timer);
    }
    if (!open) {
      setHasAnimated(false);
    }
  }, [open, hasAnimated]);

  // ============================================
  // SUCCESS STATE - Calm triumph
  // ============================================
  if (status === "won") {
    return (
      <Modal open={open} onClose={onClose} title={winMessage ?? "Solved!"}>
        <div className="text-center">
          {/* Success headline with star rating */}
          <div
            className={`transition-all duration-500 ${hasAnimated ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
          >
            <StarDisplay rating={starRating} className="justify-center mb-2" />
            <p className="text-heading-1 text-correct dark:text-correct-dark mb-1">
              {winMessage}
            </p>
            {isPerfectGame && (
              <p className="text-body-small text-present dark:text-present-dark animate-gentle-pulse">
                Flawless victory
              </p>
            )}
          </div>

          {/* Theme reveal */}
          {puzzle.theme && (
            <div
              className={`mt-4 px-4 py-3 rounded-xl bg-gradient-to-br from-surface-raised to-surface dark:from-surface-raised-dark dark:to-surface-dark border border-border/50 dark:border-border-dark/50 transition-all duration-500 delay-100 ${hasAnimated ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
            >
              <p className="text-caption text-ink-tertiary dark:text-ink-tertiary-dark uppercase tracking-wider mb-1">
                {isArchiveMode ? "Theme" : "Today\u0027s theme"}
              </p>
              <p className="text-heading-3 text-ink dark:text-ink-dark">
                {puzzle.theme}
              </p>
            </div>
          )}

          {/* Stats row - guesses, clues, streak */}
          <div
            className={`mt-6 flex items-center justify-center gap-6 transition-all duration-500 delay-200 ${hasAnimated ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
          >
            {/* Guess count */}
            <div className="text-center">
              <p className="text-stat text-ink dark:text-ink-dark">{guesses.length}</p>
              <p className="text-caption text-ink-tertiary dark:text-ink-tertiary-dark uppercase tracking-wider">
                {guesses.length === 1 ? "Guess" : "Guesses"}
              </p>
            </div>

            {/* Divider */}
            <div className="w-px h-12 bg-border dark:bg-border-dark" />

            {/* Hints used */}
            <div className="text-center">
              <p className="text-stat text-ink dark:text-ink-dark">
                {hintsUsed}/{totalCrossers}
              </p>
              <p className="text-caption text-ink-tertiary dark:text-ink-tertiary-dark uppercase tracking-wider">
                Hints
              </p>
            </div>

            {/* Streak (if active) */}
            {currentStreak > 0 && (
              <>
                <div className="w-px h-12 bg-border dark:bg-border-dark" />
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <FireIcon className="w-6 h-6 text-present dark:text-present-dark animate-streak-glow" />
                    <p className="text-stat text-present dark:text-present-dark">
                      {currentStreak}
                    </p>
                  </div>
                  <p className="text-caption text-ink-tertiary dark:text-ink-tertiary-dark uppercase tracking-wider">
                    Streak
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Streak milestone celebration */}
          {currentStreak > 0 && currentStreak % 7 === 0 && (
            <div
              className={`mt-4 px-4 py-2 rounded-lg bg-present/10 dark:bg-present-dark/10 border border-present/30 dark:border-present-dark/30 inline-block transition-all duration-500 delay-300 ${hasAnimated ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}
            >
              <p className="text-body-small text-present dark:text-present-dark font-medium">
                {currentStreak === 7
                  ? "One week strong!"
                  : `${Math.floor(currentStreak / 7)} weeks strong!`}
              </p>
            </div>
          )}

          {/* Grace save indicator */}
          {streakSavedByGrace && (
            <div className="mt-3 px-3 py-1.5 rounded-lg bg-accent/10 dark:bg-accent-dark/10 inline-block">
              <p className="text-caption text-accent dark:text-accent-dark">
                Streak saved by grace
              </p>
            </div>
          )}

          {/* Visual results grid - main word guesses */}
          <div
            className={`mt-6 transition-all duration-500 delay-300 ${hasAnimated ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
          >
            <p className="text-caption text-ink-tertiary dark:text-ink-tertiary-dark mb-3 uppercase tracking-wider">
              Your solve
            </p>
            <div className="inline-flex flex-col gap-1">
              {mainGuesses.map((guess, i) => (
                <div
                  key={i}
                  className="flex gap-1 justify-center"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  {guess.feedback.map((fb, j) => (
                    <div
                      key={j}
                      className={`w-7 h-7 rounded-md transition-all duration-300 ${
                        fb.status === "correct"
                          ? "bg-correct dark:bg-correct-dark"
                          : fb.status === "present"
                            ? "bg-present dark:bg-present-dark"
                            : "bg-absent dark:bg-absent-dark"
                      }`}
                      style={{ animationDelay: `${i * 80 + j * 40}ms` }}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Crosser summary pills */}
          <div
            className={`mt-4 transition-all duration-500 delay-[400ms] ${hasAnimated ? "opacity-100" : "opacity-0"}`}
          >
            <div className="flex gap-2 justify-center flex-wrap">
              {puzzle.crossers.map((crosser, i) => {
                const isSolved = solvedWords.has(crosser.id);
                return (
                  <div
                    key={crosser.id}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-body-small transition-all ${
                      isSolved
                        ? "bg-correct/15 dark:bg-correct-dark/15 text-correct dark:text-correct-dark"
                        : "bg-border/50 dark:bg-border-dark/50 text-ink-tertiary dark:text-ink-tertiary-dark"
                    }`}
                    style={{ animationDelay: `${400 + i * 50}ms` }}
                  >
                    <span className="font-mono text-caption">{i + 1}</span>
                    {isSolved ? (
                      <CheckIcon className="w-3.5 h-3.5" />
                    ) : (
                      <span className="w-3.5 h-3.5 flex items-center justify-center text-caption">
                        -
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Next puzzle countdown (daily mode only) */}
          {!isArchiveMode && countdown && (
            <div
              className={`mt-6 pt-6 border-t border-border/50 dark:border-border-dark/50 transition-all duration-500 delay-500 ${hasAnimated ? "opacity-100" : "opacity-0"}`}
            >
              <div className="flex items-center justify-center gap-2 text-ink-secondary dark:text-ink-secondary-dark">
                <ClockIcon className="w-4 h-4" />
                <p className="text-body-small">Next puzzle in</p>
              </div>
              <p className="text-heading-2 text-ink dark:text-ink-dark font-mono mt-1 tabular-nums">
                {String(countdown.hours).padStart(2, "0")}:
                {String(countdown.minutes).padStart(2, "0")}:
                {String(countdown.seconds).padStart(2, "0")}
              </p>
            </div>
          )}

          {/* Actions - Share is primary */}
          <div
            className={`mt-6 flex gap-3 justify-center transition-all duration-500 delay-[600ms] ${hasAnimated ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
          >
            <ShareButton
              puzzle={puzzle}
              guesses={guesses}
              solvedWords={solvedWords}
              won={true}
              size="large"
              className="flex-1 max-w-[160px] justify-center rounded-xl shadow-md !bg-correct dark:!bg-correct-dark hover:!brightness-110"
            />
            {isArchiveMode && onReturnToDaily ? (
              <button
                type="button"
                className="px-6 py-3 bg-accent dark:bg-accent-dark text-white rounded-xl font-semibold text-body hover:brightness-110 transition-all active:scale-[0.97]"
                onClick={onReturnToDaily}
              >
                Back to today
              </button>
            ) : (
              <button
                type="button"
                className="px-6 py-3 bg-surface-raised dark:bg-surface-raised-dark text-ink dark:text-ink-dark rounded-xl font-semibold text-body hover:bg-border/50 dark:hover:bg-border-dark/50 transition-all active:scale-[0.97] border border-border dark:border-border-dark"
                onClick={onClose}
              >
                Done
              </button>
            )}
          </div>
        </div>
      </Modal>
    );
  }

  // ============================================
  // FAILURE STATE - Gentle, not punishing
  // ============================================
  return (
    <Modal open={open} onClose={onClose} title="So close!">
      <div className="text-center">
        {/* Gentle loss message */}
        <div
          className={`transition-all duration-500 ${hasAnimated ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
        >
          <p className="text-heading-2 text-ink dark:text-ink-dark mb-2">
            Not quite this time
          </p>
          <p className="text-body text-ink-secondary dark:text-ink-secondary-dark">
            The word was
          </p>
          <p className="text-heading-1 font-mono text-ink dark:text-ink-dark mt-1 tracking-wider">
            {puzzle.mainWord.word}
          </p>
        </div>

        {/* Theme reveal */}
        {puzzle.theme && (
          <div
            className={`mt-5 px-4 py-3 rounded-xl bg-surface-raised dark:bg-surface-raised-dark border border-border/50 dark:border-border-dark/50 transition-all duration-500 delay-100 ${hasAnimated ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
          >
            <p className="text-caption text-ink-tertiary dark:text-ink-tertiary-dark uppercase tracking-wider mb-1">
              Today&apos;s theme
            </p>
            <p className="text-body font-medium text-ink dark:text-ink-dark">
              {puzzle.theme}
            </p>
          </div>
        )}

        {/* Progress made */}
        <div
          className={`mt-6 transition-all duration-500 delay-200 ${hasAnimated ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
        >
          <div className="inline-flex items-center gap-4 px-5 py-3 rounded-xl bg-surface-raised dark:bg-surface-raised-dark">
            <div className="text-center">
              <p className="text-heading-3 text-ink dark:text-ink-dark">
                {hintsUsed}/{totalCrossers}
              </p>
              <p className="text-caption text-ink-tertiary dark:text-ink-tertiary-dark uppercase tracking-wider">
                Hints used
              </p>
            </div>
          </div>
        </div>

        {/* Streak status - gentle "paused" messaging, never "broken" */}
        {currentStreak > 0 && (
          <div
            className={`mt-4 px-4 py-2.5 rounded-xl bg-present/10 dark:bg-present-dark/10 border border-present/20 dark:border-present-dark/20 inline-block transition-all duration-500 delay-300 ${hasAnimated ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}
          >
            <div className="flex items-center gap-2">
              <FireIcon className="w-5 h-5 text-present/60 dark:text-present-dark/60" />
              <p className="text-body-small text-present dark:text-present-dark">
                Streak paused at {currentStreak}
              </p>
            </div>
          </div>
        )}

        {/* Visual results grid */}
        <div
          className={`mt-6 transition-all duration-500 delay-300 ${hasAnimated ? "opacity-100" : "opacity-0"}`}
        >
          <p className="text-caption text-ink-tertiary dark:text-ink-tertiary-dark mb-3 uppercase tracking-wider">
            Your attempts
          </p>
          <div className="inline-flex flex-col gap-1">
            {mainGuesses.map((guess, i) => (
              <div key={i} className="flex gap-1 justify-center">
                {guess.feedback.map((fb, j) => (
                  <div
                    key={j}
                    className={`w-6 h-6 rounded-md ${
                      fb.status === "correct"
                        ? "bg-correct dark:bg-correct-dark"
                        : fb.status === "present"
                          ? "bg-present dark:bg-present-dark"
                          : "bg-absent dark:bg-absent-dark"
                    }`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Encouragement */}
        {!isArchiveMode && (
          <p
            className={`mt-6 text-body text-ink-secondary dark:text-ink-secondary-dark transition-all duration-500 delay-[400ms] ${hasAnimated ? "opacity-100" : "opacity-0"}`}
          >
            Come back tomorrow for a fresh puzzle
          </p>
        )}

        {/* Next puzzle countdown (daily mode only) */}
        {!isArchiveMode && countdown && (
          <div
            className={`mt-4 transition-all duration-500 delay-500 ${hasAnimated ? "opacity-100" : "opacity-0"}`}
          >
            <div className="flex items-center justify-center gap-2 text-ink-tertiary dark:text-ink-tertiary-dark">
              <ClockIcon className="w-4 h-4" />
              <p className="text-body-small">Next puzzle in</p>
            </div>
            <p className="text-heading-3 text-ink dark:text-ink-dark font-mono mt-1 tabular-nums">
              {String(countdown.hours).padStart(2, "0")}:
              {String(countdown.minutes).padStart(2, "0")}:
              {String(countdown.seconds).padStart(2, "0")}
            </p>
          </div>
        )}

        {/* Actions */}
        <div
          className={`mt-6 flex gap-3 justify-center transition-all duration-500 delay-[600ms] ${hasAnimated ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
        >
          <ShareButton
            puzzle={puzzle}
            guesses={guesses}
            solvedWords={solvedWords}
            won={false}
            size="large"
            className="flex-1 max-w-[160px] justify-center rounded-xl shadow-md"
          />
          {isArchiveMode && onReturnToDaily ? (
            <button
              type="button"
              className="px-6 py-3 bg-accent dark:bg-accent-dark text-white rounded-xl font-semibold text-body hover:brightness-110 transition-all active:scale-[0.97]"
              onClick={onReturnToDaily}
            >
              Back to today
            </button>
          ) : (
            <button
              type="button"
              className="px-6 py-3 bg-surface-raised dark:bg-surface-raised-dark text-ink dark:text-ink-dark rounded-xl font-semibold text-body hover:bg-border/50 dark:hover:bg-border-dark/50 transition-all active:scale-[0.97] border border-border dark:border-border-dark"
              onClick={onClose}
            >
              Done
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}
