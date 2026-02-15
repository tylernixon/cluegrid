"use client";

import { useCallback, useState, useEffect, useRef } from "react";
import { Grid } from "@/components/game/Grid";
import { GridSkeleton } from "@/components/game/GridSkeleton";
import { Keyboard } from "@/components/game/Keyboard";
import { ActiveCluePanel } from "@/components/game/ActiveCluePanel";
import { GuessHistory } from "@/components/game/GuessHistory";
import { CompletionModal } from "@/components/game/CompletionModal";
import { StatsModal } from "@/components/game/StatsModal";
import { SettingsModal } from "@/components/game/SettingsModal";
import { BadgeNotification } from "@/components/game/BadgeNotification";
import { Confetti } from "@/components/game/Confetti";
import { Toast } from "@/components/ui/Toast";
import { useGameStore } from "@/stores/gameStore";
import { useStatsStore } from "@/stores/statsStore";
import { useKeyboard } from "@/hooks/useKeyboard";

export default function Home() {
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  const puzzle = useGameStore((s) => s.puzzle);
  const guesses = useGameStore((s) => s.guesses);
  const currentGuess = useGameStore((s) => s.currentGuess);
  const selectedTarget = useGameStore((s) => s.selectedTarget);
  const solvedWords = useGameStore((s) => s.solvedWords);
  const revealedLetters = useGameStore((s) => s.revealedLetters);
  const status = useGameStore((s) => s.status);
  const shakeTarget = useGameStore((s) => s.shakeTarget);
  const toastMessage = useGameStore((s) => s.toastMessage);
  const showCompletionModal = useGameStore((s) => s.showCompletionModal);
  const isLoading = useGameStore((s) => s.isLoading);
  const fetchPuzzle = useGameStore((s) => s.fetchPuzzle);

  // Fetch puzzle on mount
  useEffect(() => {
    fetchPuzzle();
  }, [fetchPuzzle]);

  const addLetter = useGameStore((s) => s.addLetter);
  const removeLetter = useGameStore((s) => s.removeLetter);
  const submitGuess = useGameStore((s) => s.submitGuess);
  const selectTarget = useGameStore((s) => s.selectTarget);
  const clearToast = useGameStore((s) => s.clearToast);
  const setShowCompletionModal = useGameStore((s) => s.setShowCompletionModal);

  const guessesRemaining = useGameStore((s) => s.guessesRemaining);
  const maxGuesses = useGameStore((s) => s.maxGuesses);
  const hintsUsed = useGameStore((s) => s.hintsUsed);
  const keyStatuses = useGameStore((s) => s.keyStatuses);

  const remaining = guessesRemaining();
  const maxGuessesValue = maxGuesses();
  const keys = keyStatuses();

  const newBadges = useStatsStore((s) => s.newBadges);
  const clearNewBadges = useStatsStore((s) => s.clearNewBadges);

  const isPlaying = status === "playing";
  const isVictory = status === "won";

  // Track victory animation trigger
  const [showConfetti, setShowConfetti] = useState(false);
  const prevStatusRef = useRef(status);

  useEffect(() => {
    if (status === "won" && prevStatusRef.current !== "won") {
      setShowConfetti(true);
    }
    prevStatusRef.current = status;
  }, [status]);

  // Screen reader announcement state
  const [announcement, setAnnouncement] = useState<string>("");
  const prevGuessCount = useRef(guesses.length);

  // Announce guess results to screen readers
  useEffect(() => {
    if (guesses.length > prevGuessCount.current) {
      const latestGuess = guesses[guesses.length - 1];
      if (latestGuess) {
        const feedbackText = latestGuess.feedback
          .map((fb) => {
            const statusLabel =
              fb.status === "correct"
                ? "correct"
                : fb.status === "present"
                  ? "wrong position"
                  : "not in word";
            return `${fb.letter} ${statusLabel}`;
          })
          .join(", ");
        setAnnouncement(`Guess ${guesses.length}: ${latestGuess.word}. ${feedbackText}`);
      }
    }
    prevGuessCount.current = guesses.length;
  }, [guesses]);

  // Announce game over
  useEffect(() => {
    if (status === "won") {
      setAnnouncement(
        `Congratulations! Puzzle solved in ${guesses.length} ${guesses.length === 1 ? "guess" : "guesses"}.`,
      );
    } else if (status === "lost") {
      setAnnouncement(
        `Puzzle not solved. The word was ${puzzle.mainWord.word}.`,
      );
    }
  }, [status, guesses.length, puzzle.mainWord.word]);

  const handleKey = useCallback(
    (key: string) => addLetter(key),
    [addLetter],
  );
  const handleEnter = useCallback(() => submitGuess(), [submitGuess]);
  const handleBackspace = useCallback(() => removeLetter(), [removeLetter]);

  useKeyboard({
    onKey: handleKey,
    onEnter: handleEnter,
    onBackspace: handleBackspace,
    disabled: !isPlaying || isLoading,
  });

  return (
    <div className="flex flex-col min-h-screen min-h-dvh bg-canvas dark:bg-canvas-dark">
      {/* Skip link for accessibility */}
      <a
        href="#puzzle-grid"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-accent focus:text-white focus:rounded-md"
      >
        Skip to puzzle
      </a>

      {/* Header */}
      <header className="flex items-center justify-between h-14 border-b border-border dark:border-border-dark px-4 shrink-0">
        {/* Settings button */}
        <button
          type="button"
          className="w-10 h-10 flex items-center justify-center rounded-lg text-[#4A8B8D] hover:text-[#3D5A5E] hover:bg-surface-raised dark:hover:bg-surface-raised-dark transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4A8B8D] focus-visible:ring-offset-2"
          onClick={() => setShowSettingsModal(true)}
          aria-label="Open settings"
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </button>

        <h1 className="flex gap-0.5">
          <span className="w-7 h-7 flex items-center justify-center rounded bg-[#4A8B8D] text-white font-serif font-medium text-lg">g</span>
          <span className="w-7 h-7 flex items-center justify-center rounded bg-[#D97B5D] text-white font-serif font-medium text-lg">i</span>
          <span className="w-7 h-7 flex items-center justify-center rounded bg-[#E8B84A] text-white font-serif font-medium text-lg">s</span>
          <span className="w-7 h-7 flex items-center justify-center rounded bg-[#3D5A5E] text-white font-serif font-medium text-lg">t</span>
        </h1>

        {/* Stats button */}
        <button
          type="button"
          className="w-10 h-10 flex items-center justify-center rounded-lg text-[#4A8B8D] hover:text-[#3D5A5E] hover:bg-surface-raised dark:hover:bg-surface-raised-dark transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4A8B8D] focus-visible:ring-offset-2"
          onClick={() => setShowStatsModal(true)}
          aria-label="View statistics"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="3" y="12" width="4" height="9" rx="1" />
            <rect x="10" y="7" width="4" height="14" rx="1" />
            <rect x="17" y="3" width="4" height="18" rx="1" />
          </svg>
        </button>
      </header>

      {/* Main game area */}
      <main className="flex-1 flex flex-col items-center justify-start sm:justify-center overflow-y-auto px-4 pt-1 pb-2 gap-2">
        {/* Grid */}
        <div id="puzzle-grid" className="flex justify-center">
          {isLoading ? (
            <GridSkeleton rows={5} cols={5} />
          ) : (
            <Grid
              puzzle={puzzle}
              revealedLetters={revealedLetters}
              solvedWords={solvedWords}
              selectedTarget={selectedTarget}
              currentGuess={currentGuess}
              shakeTarget={shakeTarget}
              isVictory={isVictory}
              onSelectTarget={selectTarget}
            />
          )}
        </div>

        {/* Guess history for selected target */}
        {!isLoading && <GuessHistory guesses={guesses} targetId={selectedTarget} />}
      </main>

      {/* Clue panel + Keyboard (sticky at bottom) */}
      <div className="sticky bottom-0 bg-canvas dark:bg-canvas-dark border-t border-border dark:border-border-dark shrink-0">
        {/* Active clue panel */}
        {!isLoading && isPlaying && (
          <div className="px-4 pt-2">
            <ActiveCluePanel
              selectedTarget={selectedTarget}
              crossers={puzzle.crossers}
              solvedWords={solvedWords}
              onSelectTarget={selectTarget}
            />
          </div>
        )}

        {/* Status bar - between clue and keyboard */}
        {!isLoading && (
          <div
            className="flex items-center justify-center gap-4 py-1.5 text-caption text-ink-tertiary dark:text-ink-tertiary-dark"
            role="status"
            aria-label={`${remaining} guesses remaining out of ${maxGuessesValue}. ${hintsUsed} hints used out of ${puzzle.crossers.length}`}
          >
            <span>{remaining} guesses left</span>
            <span className="w-px h-3 bg-border dark:bg-border-dark" aria-hidden="true" />
            <span>{hintsUsed}/{puzzle.crossers.length} hints</span>
          </div>
        )}

        {/* Keyboard */}
        <div className="pb-2 pb-[env(safe-area-inset-bottom)]">
          <Keyboard
            keyStatuses={keys}
            onKey={handleKey}
            onEnter={handleEnter}
            onBackspace={handleBackspace}
            disabled={!isPlaying || isLoading}
          />
        </div>
      </div>

      {/* Toast */}
      <Toast message={toastMessage} onDismiss={clearToast} />

      {/* Confetti celebration */}
      <Confetti active={showConfetti} />

      {/* Badge notification */}
      {newBadges.length > 0 && (
        <BadgeNotification badges={newBadges} onDismiss={clearNewBadges} />
      )}

      {/* Completion modal */}
      {(status === "won" || status === "lost") && (
        <CompletionModal
          open={showCompletionModal}
          onClose={() => setShowCompletionModal(false)}
          status={status}
          puzzle={puzzle}
          guesses={guesses}
          solvedWords={solvedWords}
          hintsUsed={hintsUsed}
        />
      )}

      {/* Screen reader announcements */}
      <div
        className="sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {announcement}
      </div>
      <div
        className="sr-only"
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
      >
        {toastMessage}
      </div>

      {/* Stats modal */}
      <StatsModal
        open={showStatsModal}
        onClose={() => setShowStatsModal(false)}
      />

      {/* Settings modal */}
      <SettingsModal
        open={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
      />
    </div>
  );
}
