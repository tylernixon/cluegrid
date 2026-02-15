"use client";

import { useCallback, useState, useEffect, useRef } from "react";
import { Grid } from "@/components/game/Grid";
import { GridSkeleton } from "@/components/game/GridSkeleton";
import { Keyboard } from "@/components/game/Keyboard";
import { CluePanel } from "@/components/game/CluePanel";
import { CluePanelSkeleton } from "@/components/game/CluePanelSkeleton";
import { GuessInput } from "@/components/game/GuessInput";
import { GuessHistory } from "@/components/game/GuessHistory";
import { CompletionModal } from "@/components/game/CompletionModal";
import { StatsModal } from "@/components/game/StatsModal";
import { Confetti } from "@/components/game/Confetti";
import { Toast } from "@/components/ui/Toast";
import { useGameStore } from "@/stores/gameStore";
import { useKeyboard } from "@/hooks/useKeyboard";

export default function Home() {
  const [showStatsModal, setShowStatsModal] = useState(false);

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
  const targetWordLength = useGameStore((s) => s.targetWordLength);
  const keyStatuses = useGameStore((s) => s.keyStatuses);

  const remaining = guessesRemaining();
  const targetLen = targetWordLength();
  const keys = keyStatuses();

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

  const totalGuesses = 6;
  const usedGuesses = guesses.length;

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
        {/* Spacer for centering */}
        <div className="w-10" />

        <h1 className="text-heading-3 text-ink dark:text-ink-dark lowercase">
          cluegrid
        </h1>

        {/* Stats button */}
        <button
          type="button"
          className="w-10 h-10 flex items-center justify-center rounded-lg text-ink-secondary dark:text-ink-secondary-dark hover:text-ink dark:hover:text-ink-dark hover:bg-surface-raised dark:hover:bg-surface-raised-dark transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent dark:focus-visible:ring-accent-dark focus-visible:ring-offset-2"
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
      <main className="flex-1 flex flex-col items-center overflow-y-auto px-4 py-4 gap-4">
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
              shakeTarget={shakeTarget}
              isVictory={isVictory}
              onSelectTarget={selectTarget}
            />
          )}
        </div>

        {/* Guess history for selected target */}
        {!isLoading && <GuessHistory guesses={guesses} targetId={selectedTarget} />}

        {/* Current guess input */}
        {!isLoading && isPlaying && (
          <GuessInput
            currentGuess={currentGuess}
            targetLength={targetLen}
            shake={shakeTarget === selectedTarget}
          />
        )}

        {/* Clue panel */}
        {isLoading ? (
          <CluePanelSkeleton clueCount={3} />
        ) : (
          <CluePanel
            crossers={puzzle.crossers}
            selectedTarget={selectedTarget}
            solvedWords={solvedWords}
            onSelectTarget={selectTarget}
          />
        )}

        {/* Guess progress */}
        {!isLoading && (
          <div
            className="flex items-center gap-1.5"
            role="status"
            aria-label={`${remaining} guesses remaining out of ${totalGuesses}`}
          >
            {Array.from({ length: totalGuesses }, (_, i) => (
              <div
                key={i}
                className={`w-3 h-3 rounded-full transition-colors ${
                  i < usedGuesses
                    ? "bg-ink dark:bg-ink-dark"
                    : "bg-border dark:bg-border-dark"
                }`}
                aria-hidden="true"
              />
            ))}
            <span className="ml-2 text-caption text-ink-secondary dark:text-ink-secondary-dark">
              {remaining} remaining
            </span>
          </div>
        )}
      </main>

      {/* Keyboard (fixed at bottom) */}
      <div className="sticky bottom-0 bg-canvas dark:bg-canvas-dark border-t border-border dark:border-border-dark py-2 pb-[env(safe-area-inset-bottom)] shrink-0">
        <Keyboard
          keyStatuses={keys}
          onKey={handleKey}
          onEnter={handleEnter}
          onBackspace={handleBackspace}
          disabled={!isPlaying || isLoading}
        />
      </div>

      {/* Toast */}
      <Toast message={toastMessage} onDismiss={clearToast} />

      {/* Confetti celebration */}
      <Confetti active={showConfetti} />

      {/* Completion modal */}
      {(status === "won" || status === "lost") && (
        <CompletionModal
          open={showCompletionModal}
          onClose={() => setShowCompletionModal(false)}
          status={status}
          puzzle={puzzle}
          guesses={guesses}
          solvedWords={solvedWords}
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
    </div>
  );
}
