"use client";

import { useCallback } from "react";
import { Grid } from "@/components/game/Grid";
import { Keyboard } from "@/components/game/Keyboard";
import { CluePanel } from "@/components/game/CluePanel";
import { GuessInput } from "@/components/game/GuessInput";
import { GuessHistory } from "@/components/game/GuessHistory";
import { CompletionModal } from "@/components/game/CompletionModal";
import { Toast } from "@/components/ui/Toast";
import { useGameStore } from "@/stores/gameStore";
import { useKeyboard } from "@/hooks/useKeyboard";

export default function Home() {
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
    disabled: !isPlaying,
  });

  const totalGuesses = 6;
  const usedGuesses = guesses.length;

  return (
    <div className="flex flex-col min-h-screen min-h-dvh bg-canvas dark:bg-canvas-dark">
      {/* Header */}
      <header className="flex items-center justify-center h-14 border-b border-border dark:border-border-dark px-4 shrink-0">
        <h1 className="text-heading-3 text-ink dark:text-ink-dark lowercase">
          cluegrid
        </h1>
      </header>

      {/* Main game area */}
      <main className="flex-1 flex flex-col items-center overflow-y-auto px-4 py-4 gap-4">
        {/* Grid */}
        <div className="flex justify-center">
          <Grid
            puzzle={puzzle}
            revealedLetters={revealedLetters}
            solvedWords={solvedWords}
            selectedTarget={selectedTarget}
            shakeTarget={shakeTarget}
            onSelectTarget={selectTarget}
          />
        </div>

        {/* Guess history for selected target */}
        <GuessHistory guesses={guesses} targetId={selectedTarget} />

        {/* Current guess input */}
        {isPlaying && (
          <GuessInput
            currentGuess={currentGuess}
            targetLength={targetLen}
            shake={shakeTarget === selectedTarget}
          />
        )}

        {/* Clue panel */}
        <CluePanel
          crossers={puzzle.crossers}
          selectedTarget={selectedTarget}
          solvedWords={solvedWords}
          onSelectTarget={selectTarget}
        />

        {/* Guess progress */}
        <div className="flex items-center gap-1.5">
          {Array.from({ length: totalGuesses }, (_, i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full transition-colors ${
                i < usedGuesses
                  ? "bg-ink dark:bg-ink-dark"
                  : "bg-border dark:bg-border-dark"
              }`}
              aria-label={i < usedGuesses ? "Used guess" : "Remaining guess"}
            />
          ))}
          <span className="ml-2 text-caption text-ink-secondary dark:text-ink-secondary-dark">
            {remaining} remaining
          </span>
        </div>
      </main>

      {/* Keyboard (fixed at bottom) */}
      <div className="sticky bottom-0 bg-canvas dark:bg-canvas-dark border-t border-border dark:border-border-dark py-2 pb-[env(safe-area-inset-bottom)] shrink-0">
        <Keyboard
          keyStatuses={keys}
          onKey={handleKey}
          onEnter={handleEnter}
          onBackspace={handleBackspace}
          disabled={!isPlaying}
        />
      </div>

      {/* Toast */}
      <Toast message={toastMessage} onDismiss={clearToast} />

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
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {toastMessage}
      </div>
    </div>
  );
}
