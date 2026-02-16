"use client";

import { useCallback, useState, useEffect, useRef, lazy, Suspense } from "react";
import { Grid } from "@/components/game/Grid";
import { PuzzleLoadingState } from "@/components/game/PuzzleLoadingState";
import { Keyboard } from "@/components/game/Keyboard";
import { ActiveCluePanel } from "@/components/game/ActiveCluePanel";
import { GuessHistory } from "@/components/game/GuessHistory";
import { CompletionModal } from "@/components/game/CompletionModal";
import { StatsModal } from "@/components/game/StatsModal";
import { SettingsModal } from "@/components/game/SettingsModal";
import { BadgeNotification } from "@/components/game/BadgeNotification";
import { Confetti } from "@/components/game/Confetti";
import { Toast } from "@/components/ui/Toast";
import { HeaderFeedback } from "@/components/game/HeaderFeedback";
import { OnboardingModal } from "@/components/game/OnboardingModal";
import { HelpIcon } from "@/components/game/HelpIcon";
import { HelpMenu } from "@/components/game/HelpMenu";
import { HamburgerMenu } from "@/components/layout/HamburgerMenu";
import { useGameStore } from "@/stores/gameStore";
import { useStatsStore } from "@/stores/statsStore";
import { useKeyboard } from "@/hooks/useKeyboard";

// Lazy load heavy components that aren't needed on initial render
const InteractiveTour = lazy(() =>
  import("@/components/game/InteractiveTour").then((m) => ({ default: m.InteractiveTour }))
);
const HistoryView = lazy(() =>
  import("@/components/game/HistoryView").then((m) => ({ default: m.HistoryView }))
);

export default function Home() {
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showHelpMenu, setShowHelpMenu] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const [showHistoryView, setShowHistoryView] = useState(false);

  // Check if user has seen onboarding
  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem("gist-onboarding-seen");
    if (!hasSeenOnboarding) {
      setShowOnboarding(true);
    }
  }, []);

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
  const isPreviewMode = useGameStore((s) => s.isPreviewMode);
  const isArchiveMode = useGameStore((s) => s.isArchiveMode);
  const archiveDate = useGameStore((s) => s.archiveDate);
  const exitArchiveMode = useGameStore((s) => s.exitArchiveMode);
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
  const hintsUsed = useGameStore((s) => s.hintsUsed);
  const keyStatuses = useGameStore((s) => s.keyStatuses);
  const isSubmitting = useGameStore((s) => s.isSubmitting);
  const presentLettersForTarget = useGameStore((s) => s.presentLettersForTarget);

  const remaining = guessesRemaining();
  const keys = keyStatuses();
  const presentLetters = presentLettersForTarget();

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
    disabled: !isPlaying || isLoading || isSubmitting || showTour,
  });

  return (
    <div className="flex flex-col h-[100dvh] bg-canvas dark:bg-canvas-dark">
      {/* Skip link for accessibility */}
      <a
        href="#puzzle-grid"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-accent focus:text-white focus:rounded-md"
      >
        Skip to puzzle
      </a>

      {/* Header */}
      <header className="flex items-center justify-between h-14 px-4 shrink-0">
        <HamburgerMenu
          onOpenStats={() => setShowStatsModal(true)}
          onOpenSettings={() => setShowSettingsModal(true)}
          onOpenHistory={() => setShowHistoryView(true)}
        />

        <HeaderFeedback guesses={guesses} selectedTarget={selectedTarget} />

        <HelpIcon onClick={() => setShowHelpMenu(true)} />
      </header>

      {/* Preview mode banner */}
      {isPreviewMode && (
        <div className="bg-purple-600 text-white text-center py-2 px-4 text-sm font-medium">
          Preview Mode — Stats will not be saved
        </div>
      )}

      {/* Archive mode banner */}
      {isArchiveMode && archiveDate && (
        <div className="bg-accent dark:bg-accent-dark text-white text-center py-2 px-4 text-sm font-medium flex items-center justify-center gap-3">
          <span>
            Playing: {new Date(archiveDate + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </span>
          <button
            type="button"
            className="underline hover:no-underline text-white/90 hover:text-white"
            onClick={() => {
              exitArchiveMode();
              fetchPuzzle();
            }}
          >
            Back to today
          </button>
        </div>
      )}

      {/* Main game area */}
      <main className="flex-1 flex flex-col items-center justify-start sm:justify-center overflow-y-auto px-4 pt-4 pb-2 gap-1">
        {/* Grid */}
        <div id="puzzle-grid" className="flex justify-center">
          {isLoading ? (
            <PuzzleLoadingState />
          ) : (
            <Grid
              puzzle={puzzle}
              revealedLetters={revealedLetters}
              solvedWords={solvedWords}
              selectedTarget={selectedTarget}
              currentGuess={currentGuess}
              shakeTarget={shakeTarget}
              isVictory={isVictory}
              guesses={guesses}
              onSelectTarget={selectTarget}
            />
          )}
        </div>

        {/* Guess history for selected target */}
        {!isLoading && <GuessHistory guesses={guesses} targetId={selectedTarget} />}
      </main>

      {/* Clue panel + Keyboard (sticky at bottom) */}
      <div className="bg-canvas/85 dark:bg-canvas-dark/85 backdrop-blur-md border-t border-border/50 dark:border-border-dark/50 shrink-0">
        {/* Active clue panel */}
        {!isLoading && isPlaying && (
          <div className="px-4 pt-2 pb-1">
            <ActiveCluePanel
              selectedTarget={selectedTarget}
              crossers={puzzle.crossers}
              solvedWords={solvedWords}
              onSelectTarget={selectTarget}
              theme={puzzle.theme}
              themeHint={puzzle.themeHint}
              presentLetters={presentLetters}
              guessesRemaining={remaining}
              hintsUsed={hintsUsed}
            />
          </div>
        )}

        {/* Keyboard */}
        <div className="pb-2 pb-[env(safe-area-inset-bottom)]">
          <Keyboard
            keyStatuses={keys}
            onKey={handleKey}
            onEnter={handleEnter}
            onBackspace={handleBackspace}
            disabled={!isPlaying || isLoading || isSubmitting}
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
          isArchiveMode={isArchiveMode}
          archiveDate={archiveDate}
          onReturnToDaily={() => {
            setShowCompletionModal(false);
            exitArchiveMode();
            fetchPuzzle();
          }}
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

      {/* Onboarding modal (first visit) */}
      <OnboardingModal
        open={showOnboarding}
        onClose={() => setShowOnboarding(false)}
      />

      {/* Help menu (action sheet) */}
      <HelpMenu
        open={showHelpMenu}
        onClose={() => setShowHelpMenu(false)}
        onViewTutorial={() => setShowHelpModal(true)}
        onStartWalkthrough={() => setShowTour(true)}
      />

      {/* Help modal (view tutorial) */}
      <OnboardingModal
        open={showHelpModal}
        onClose={() => setShowHelpModal(false)}
        forceShow
      />

      {/* Interactive walkthrough tour (lazy loaded) */}
      {showTour && (
        <Suspense fallback={null}>
          <InteractiveTour
            open={showTour}
            onClose={() => setShowTour(false)}
          />
        </Suspense>
      )}

      {/* History view (lazy loaded, full-screen replacement) */}
      {showHistoryView && (
        <Suspense fallback={null}>
          <HistoryView onClose={() => setShowHistoryView(false)} />
        </Suspense>
      )}
    </div>
  );
}
