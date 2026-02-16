"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { tutorialPuzzle } from "@/data/tutorialPuzzle";
import type { RevealedLetter } from "@/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TourStep {
  id: string;
  title: string;
  description: string;
  /** Which region of the UI to highlight */
  highlight: "grid" | "grid-main-row" | "grid-crosser" | "keyboard" | "clue-panel" | "grid-revealed" | null;
  /** Whether the user can type a guess in this step */
  allowInput?: boolean;
  /** The word the user should type (auto-advances on match) */
  expectedWord?: string;
  /** Target to select for this step */
  selectTarget?: "main" | string;
}

interface InteractiveTourProps {
  open: boolean;
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// Tour steps
// ---------------------------------------------------------------------------

const TOUR_STEPS: TourStep[] = [
  {
    id: "welcome",
    title: "Welcome to the walkthrough!",
    description: "Let's practice with a sample puzzle. The goal is to guess the main word.",
    highlight: null,
  },
  {
    id: "main-row",
    title: "This is the main word",
    description: "The horizontal row is the word you're trying to guess. It has 5 letters.",
    highlight: "grid-main-row",
    selectTarget: "main",
  },
  {
    id: "crosser",
    title: "Tap a crossing word",
    description: "Vertical words cross through the main word. Solving them reveals letters! Let's try this one.",
    highlight: "grid-crosser",
    selectTarget: "crosser-1",
  },
  {
    id: "type-guess",
    title: "Type your guess",
    description: "The clue is: \"A superhero wears one\". Type CAPE and press Enter.",
    highlight: "keyboard",
    allowInput: true,
    expectedWord: "CAPE",
    selectTarget: "crosser-1",
  },
  {
    id: "revealed",
    title: "A letter is revealed!",
    description: "Solving CAPE revealed the letter P in the main word. Each crossing word reveals a letter at its intersection.",
    highlight: "grid-revealed",
    selectTarget: "main",
  },
  {
    id: "solve-main",
    title: "Now solve the main word",
    description: "The theme is \"Fruit\" and you can see the letter P. Type APPLE and press Enter!",
    highlight: "grid-main-row",
    allowInput: true,
    expectedWord: "APPLE",
    selectTarget: "main",
  },
  {
    id: "complete",
    title: "You did it!",
    description: "That's how you play! Solve crossing words for hints, then guess the main word. Now try today's puzzle.",
    highlight: null,
  },
];

// ---------------------------------------------------------------------------
// Mini grid components for the tour
// ---------------------------------------------------------------------------

function TourCell({
  letter,
  status,
  isHighlighted,
  isMainRow,
  onClick,
}: {
  letter: string;
  status: "empty" | "correct" | "revealed" | "typing" | "solved";
  isHighlighted: boolean;
  isMainRow: boolean;
  onClick?: () => void;
}) {
  const statusClasses: Record<string, string> = {
    empty: "bg-surface-raised dark:bg-surface-raised-dark border-border dark:border-border-dark",
    correct: "bg-correct dark:bg-correct-dark border-correct dark:border-correct-dark text-white",
    revealed: "bg-revealed dark:bg-revealed-dark border-revealed dark:border-revealed-dark text-white",
    typing: "bg-surface dark:bg-surface-dark border-accent dark:border-accent-dark text-ink dark:text-ink-dark",
    solved: "bg-correct dark:bg-correct-dark border-correct dark:border-correct-dark text-white",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        w-[44px] h-[44px] sm:w-[48px] sm:h-[48px] flex items-center justify-center
        rounded-sm border-2 font-mono text-lg select-none transition-all duration-150
        ${statusClasses[status] || statusClasses.empty}
        ${isMainRow ? "font-bold" : ""}
        ${isHighlighted ? "ring-2 ring-accent dark:ring-accent-dark ring-offset-2 ring-offset-canvas dark:ring-offset-canvas-dark" : ""}
      `}
    >
      {letter}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Spotlight overlay (reserved for future use with element highlighting)
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function SpotlightOverlay({
  targetRect,
  visible,
}: {
  targetRect: { top: number; left: number; width: number; height: number } | null;
  visible: boolean;
}) {
  if (!visible || !targetRect) return null;

  const padding = 8;
  const r = {
    top: targetRect.top - padding,
    left: targetRect.left - padding,
    width: targetRect.width + padding * 2,
    height: targetRect.height + padding * 2,
  };

  return (
    <svg
      className="fixed inset-0 w-full h-full z-40 pointer-events-none"
      aria-hidden="true"
    >
      <defs>
        <mask id="tour-spotlight-mask">
          <rect x="0" y="0" width="100%" height="100%" fill="white" />
          <rect
            x={r.left}
            y={r.top}
            width={r.width}
            height={r.height}
            rx="12"
            fill="black"
          />
        </mask>
      </defs>
      <rect
        x="0"
        y="0"
        width="100%"
        height="100%"
        fill="rgba(0,0,0,0.6)"
        mask="url(#tour-spotlight-mask)"
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Tooltip
// ---------------------------------------------------------------------------

function TourTooltip({
  title,
  description,
  stepIndex,
  totalSteps,
  onNext,
  onSkip,
  showNext,
  position,
}: {
  title: string;
  description: string;
  stepIndex: number;
  totalSteps: number;
  onNext: () => void;
  onSkip: () => void;
  showNext: boolean;
  position: "top" | "bottom" | "center";
}) {
  const positionClass =
    position === "top"
      ? "top-6"
      : position === "bottom"
        ? "bottom-6"
        : "top-1/2 -translate-y-1/2";

  return (
    <motion.div
      className={`fixed left-4 right-4 z-50 flex justify-center ${positionClass}`}
      initial={{ opacity: 0, y: position === "top" ? -10 : 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: position === "top" ? -10 : 10 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="w-full max-w-[360px] bg-surface dark:bg-surface-dark rounded-2xl shadow-lg p-5 border border-border/50 dark:border-border-dark/50">
        {/* Step counter */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-caption text-ink-tertiary dark:text-ink-tertiary-dark">
            Step {stepIndex + 1} of {totalSteps}
          </span>
          <button
            type="button"
            onClick={onSkip}
            className="text-caption text-ink-tertiary dark:text-ink-tertiary-dark hover:text-ink-secondary dark:hover:text-ink-secondary-dark transition-colors"
          >
            Skip Tour
          </button>
        </div>

        <h3 className="text-heading-3 text-ink dark:text-ink-dark mb-1">
          {title}
        </h3>
        <p className="text-body-small text-ink-secondary dark:text-ink-secondary-dark mb-4">
          {description}
        </p>

        {/* Progress dots */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-all duration-150 ${
                  i === stepIndex
                    ? "bg-accent dark:bg-accent-dark w-4"
                    : i < stepIndex
                      ? "bg-correct dark:bg-correct-dark"
                      : "bg-border-active dark:bg-border-active-dark"
                }`}
              />
            ))}
          </div>

          {showNext && (
            <button
              type="button"
              onClick={onNext}
              className="px-4 py-2 bg-correct dark:bg-correct-dark text-white rounded-lg text-body-small font-semibold hover:opacity-90 transition-opacity active:scale-[0.98]"
            >
              {stepIndex === totalSteps - 1 ? "Done" : "Next"}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Main InteractiveTour
// ---------------------------------------------------------------------------

export function InteractiveTour({ open, onClose }: InteractiveTourProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [currentGuess, setCurrentGuess] = useState("");
  const [solvedWords, setSolvedWords] = useState<Set<string>>(new Set());
  const [revealedLetters, setRevealedLetters] = useState<RevealedLetter[]>([]);
  const [selectedTarget, setSelectedTarget] = useState<"main" | string>("main");
  const [shakeInput, setShakeInput] = useState(false);

  const puzzle = tutorialPuzzle;
  const step = TOUR_STEPS[stepIndex]!;

  // Reset state when tour opens
  useEffect(() => {
    if (open) {
      setStepIndex(0);
      setCurrentGuess("");
      setSolvedWords(new Set());
      setRevealedLetters([]);
      setSelectedTarget("main");
    }
  }, [open]);

  // Sync selected target with step
  useEffect(() => {
    if (step.selectTarget) {
      setSelectedTarget(step.selectTarget);
    }
  }, [step.selectTarget]);

  // Handle keyboard input during input steps
  useEffect(() => {
    if (!open || !step.allowInput) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }

      const target = step.selectTarget || selectedTarget;
      const targetWord =
        target === "main"
          ? puzzle.mainWord.word
          : puzzle.crossers.find((c) => c.id === target)?.word || "";
      const maxLength = targetWord.length;

      if (e.key === "Backspace") {
        setCurrentGuess((prev) => prev.slice(0, -1));
        return;
      }

      if (e.key === "Enter") {
        if (
          step.expectedWord &&
          currentGuess.toUpperCase() === step.expectedWord.toUpperCase()
        ) {
          // Correct guess -- mark word as solved
          if (target !== "main") {
            const crosser = puzzle.crossers.find((c) => c.id === target);
            if (crosser) {
              setSolvedWords((prev) => new Set([...Array.from(prev), target]));
              // Reveal the intersection letter on the main word row
              const mainCol = puzzle.mainWord.col + (crosser.startCol - puzzle.mainWord.col);
              setRevealedLetters((prev) => [
                ...prev,
                {
                  row: puzzle.mainWord.row,
                  col: mainCol,
                  letter: crosser.word[crosser.intersectionIndex]!,
                  source: crosser.id,
                },
              ]);
            }
          } else {
            setSolvedWords((prev) => new Set([...Array.from(prev), "main"]));
          }
          setCurrentGuess("");
          setStepIndex((prev) => prev + 1);
        } else {
          // Wrong guess -- shake
          setShakeInput(true);
          setTimeout(() => setShakeInput(false), 300);
        }
        return;
      }

      if (/^[a-zA-Z]$/.test(e.key) && currentGuess.length < maxLength) {
        setCurrentGuess((prev) => prev + e.key.toUpperCase());
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, step, currentGuess, selectedTarget, puzzle, onClose]);

  // Close on escape for non-input steps
  useEffect(() => {
    if (!open || step.allowInput) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, step.allowInput, onClose]);

  const handleNext = useCallback(() => {
    if (stepIndex < TOUR_STEPS.length - 1) {
      setCurrentGuess("");
      setStepIndex((prev) => prev + 1);
    } else {
      onClose();
    }
  }, [stepIndex, onClose]);

  const handleVirtualKey = useCallback(
    (key: string) => {
      if (!step.allowInput) return;

      const target = step.selectTarget || selectedTarget;
      const targetWord =
        target === "main"
          ? puzzle.mainWord.word
          : puzzle.crossers.find((c) => c.id === target)?.word || "";
      const maxLength = targetWord.length;

      if (key === "BACK") {
        setCurrentGuess((prev) => prev.slice(0, -1));
        return;
      }

      if (key === "ENTER") {
        if (
          step.expectedWord &&
          currentGuess.toUpperCase() === step.expectedWord.toUpperCase()
        ) {
          if (target !== "main") {
            const crosser = puzzle.crossers.find((c) => c.id === target);
            if (crosser) {
              setSolvedWords((prev) => new Set([...Array.from(prev), target]));
              const mainCol = puzzle.mainWord.col + (crosser.startCol - puzzle.mainWord.col);
              setRevealedLetters((prev) => [
                ...prev,
                {
                  row: puzzle.mainWord.row,
                  col: mainCol,
                  letter: crosser.word[crosser.intersectionIndex]!,
                  source: crosser.id,
                },
              ]);
            }
          } else {
            setSolvedWords((prev) => new Set([...Array.from(prev), "main"]));
          }
          setCurrentGuess("");
          setStepIndex((prev) => prev + 1);
        } else {
          setShakeInput(true);
          setTimeout(() => setShakeInput(false), 300);
        }
        return;
      }

      if (/^[A-Z]$/.test(key) && currentGuess.length < maxLength) {
        setCurrentGuess((prev) => prev + key);
      }
    },
    [step, selectedTarget, puzzle, currentGuess],
  );

  // Build the visual grid
  const gridCells = useMemo(() => {
    const { rows, cols } = puzzle.gridSize;
    const cells: (({
      letter: string;
      status: "empty" | "correct" | "revealed" | "typing" | "solved";
      isMainRow: boolean;
      belongsTo: string[];
    }) | null)[][] = Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => null),
    );

    // Place main word
    const { row: mainRow, col: mainCol, word: mainWord } = puzzle.mainWord;
    const mainSolved = solvedWords.has("main");

    for (let i = 0; i < mainWord.length; i++) {
      const col = mainCol + i;
      const revealed = revealedLetters.find(
        (r) => r.row === mainRow && r.col === col,
      );

      let letter = "";
      let status: "empty" | "correct" | "revealed" | "typing" | "solved" = "empty";

      if (mainSolved) {
        letter = mainWord[i]!;
        status = "solved";
      } else if (revealed) {
        letter = revealed.letter;
        status = "revealed";
      } else if (selectedTarget === "main" && currentGuess[i]) {
        letter = currentGuess[i]!;
        status = "typing";
      }

      cells[mainRow]![col] = {
        letter,
        status,
        isMainRow: true,
        belongsTo: ["main"],
      };
    }

    // Place crossers
    for (const crosser of puzzle.crossers) {
      const isSolved = solvedWords.has(crosser.id);

      for (let i = 0; i < crosser.word.length; i++) {
        const row = crosser.startRow + i;
        const col = crosser.startCol;
        const existing = cells[row]?.[col];

        // If main word cell already exists at intersection, update belongsTo
        if (existing) {
          existing.belongsTo.push(crosser.id);
          if (isSolved && existing.status !== "solved") {
            // Keep intersection letter as revealed or solved
          }
          continue;
        }

        let letter = "";
        let status: "empty" | "correct" | "revealed" | "typing" | "solved" = "empty";

        if (isSolved) {
          letter = crosser.word[i]!;
          status = "solved";
        } else if (selectedTarget === crosser.id && currentGuess[i]) {
          letter = currentGuess[i]!;
          status = "typing";
        }

        cells[row]![col] = {
          letter,
          status,
          isMainRow: false,
          belongsTo: [crosser.id],
        };
      }
    }

    return cells;
  }, [puzzle, solvedWords, revealedLetters, selectedTarget, currentGuess]);

  // Determine which cells are highlighted based on current step
  const isHighlighted = useCallback(
    (row: number, col: number, cell: NonNullable<(typeof gridCells)[number][number]>) => {
      switch (step.highlight) {
        case "grid":
          return true;
        case "grid-main-row":
          return cell.isMainRow;
        case "grid-crosser":
          return cell.belongsTo.includes("crosser-1") && !cell.isMainRow;
        case "grid-revealed":
          return (
            cell.isMainRow &&
            revealedLetters.some((r) => r.row === row && r.col === col)
          );
        default:
          return false;
      }
    },
    [step.highlight, revealedLetters],
  );

  // Tooltip position: if highlighting grid, put tooltip below; if keyboard, above
  const tooltipPosition: "top" | "bottom" | "center" =
    step.highlight === "keyboard" || step.highlight === "clue-panel"
      ? "top"
      : step.highlight
        ? "bottom"
        : "center";

  // Whether the Next button should show (not for input steps)
  const showNextButton = !step.allowInput;

  if (!open) return null;

  // Virtual keyboard rows
  const kbRows = [
    ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
    ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
    ["ENTER", "Z", "X", "C", "V", "B", "N", "M", "BACK"],
  ];

  return (
    <div className="fixed inset-0 z-50">
      {/* Dark overlay behind everything */}
      <div className="absolute inset-0 bg-black/50 dark:bg-black/70" />

      {/* Tour content area */}
      <div className="relative z-10 flex flex-col h-full bg-canvas/95 dark:bg-canvas-dark/95">
        {/* Top bar */}
        <header className="flex items-center justify-between h-14 border-b border-border dark:border-border-dark px-4 shrink-0 bg-canvas dark:bg-canvas-dark">
          <span className="text-caption font-semibold text-present dark:text-present-dark uppercase tracking-wider bg-present/10 dark:bg-present-dark/10 px-2 py-1 rounded">
            Practice Mode
          </span>
          <button
            type="button"
            onClick={onClose}
            className="text-body-small font-semibold text-ink-secondary dark:text-ink-secondary-dark hover:text-ink dark:hover:text-ink-dark transition-colors px-3 py-1 rounded-lg"
          >
            Exit
          </button>
        </header>

        {/* Grid area */}
        <div className="flex-1 flex flex-col items-center justify-start sm:justify-center pt-8 pb-2 px-4 overflow-y-auto">
          {/* Clue card */}
          <div className="w-full max-w-[360px] mx-auto mb-4">
            <div
              className={`px-4 py-2 bg-surface-raised/90 dark:bg-surface-raised-dark/90 rounded-xl border border-border/50 dark:border-border-dark/50 text-center ${
                step.highlight === "clue-panel" ? "ring-2 ring-accent dark:ring-accent-dark ring-offset-2" : ""
              }`}
            >
              <span
                className={`text-caption font-semibold uppercase tracking-wider px-2 py-0.5 rounded ${
                  selectedTarget !== "main"
                    ? "bg-present/15 dark:bg-present-dark/15 text-present dark:text-present-dark"
                    : "bg-accent/15 dark:bg-accent-dark/15 text-accent dark:text-accent-dark"
                }`}
              >
                {selectedTarget === "main"
                  ? `Theme: ${puzzle.theme}`
                  : `Hint ${puzzle.crossers.findIndex((c) => c.id === selectedTarget) + 1}`}
              </span>
              <p className="text-sm sm:text-base font-serif text-ink dark:text-ink-dark mt-1">
                {selectedTarget === "main"
                  ? puzzle.themeHint
                  : puzzle.crossers.find((c) => c.id === selectedTarget)?.clue}
              </p>
            </div>
          </div>

          {/* Tutorial grid */}
          <motion.div
            className="inline-grid gap-[5px] p-1"
            style={{
              gridTemplateColumns: `repeat(${puzzle.gridSize.cols}, 1fr)`,
              gridTemplateRows: `repeat(${puzzle.gridSize.rows}, 1fr)`,
            }}
            animate={shakeInput ? { x: [0, -4, 4, -3, 3, 0] } : {}}
            transition={{ duration: 0.2, ease: "linear" }}
          >
            {gridCells.map((row, rowIndex) =>
              row.map((cell, colIndex) => {
                if (!cell) {
                  return (
                    <div
                      key={`${rowIndex}-${colIndex}`}
                      className="w-[44px] h-[44px] sm:w-[48px] sm:h-[48px]"
                    />
                  );
                }

                return (
                  <TourCell
                    key={`${rowIndex}-${colIndex}`}
                    letter={cell.letter}
                    status={cell.status}
                    isMainRow={cell.isMainRow}
                    isHighlighted={isHighlighted(rowIndex, colIndex, cell)}
                    onClick={() => {
                      if (cell.belongsTo.length > 0) {
                        const other = cell.belongsTo.find(
                          (w) => w !== selectedTarget,
                        );
                        setSelectedTarget(other || cell.belongsTo[0]!);
                      }
                    }}
                  />
                );
              }),
            )}
          </motion.div>
        </div>

        {/* Keyboard (always visible so layout matches real game) */}
        <div
          className={`sticky bottom-0 bg-canvas/85 dark:bg-canvas-dark/85 backdrop-blur-md border-t border-border/50 dark:border-border-dark/50 shrink-0 pb-2 pb-[env(safe-area-inset-bottom)] ${
            step.highlight === "keyboard" ? "ring-2 ring-inset ring-accent dark:ring-accent-dark" : ""
          }`}
        >
          <div className="w-full max-w-[500px] mx-auto px-1 pt-2 select-none">
            {kbRows.map((row, rowIndex) => (
              <div key={rowIndex} className="flex justify-center gap-[5px] mb-[5px]">
                {row.map((key) => {
                  const isSpecial = key === "ENTER" || key === "BACK";
                  return (
                    <button
                      key={key}
                      type="button"
                      className={`flex items-center justify-center h-[48px] rounded-md text-body-small font-semibold shadow-sm transition-transform active:scale-[0.96]
                        ${isSpecial ? "px-3 min-w-[52px] bg-accent dark:bg-accent-dark text-white" : "min-w-[30px] flex-1 max-w-[40px] bg-surface-raised dark:bg-surface-raised-dark text-ink dark:text-ink-dark"}
                        ${!step.allowInput ? "opacity-40 pointer-events-none" : ""}
                      `}
                      onClick={() => handleVirtualKey(key)}
                      disabled={!step.allowInput}
                    >
                      {key === "BACK" ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" />
                          <line x1="18" y1="9" x2="12" y2="15" />
                          <line x1="12" y1="9" x2="18" y2="15" />
                        </svg>
                      ) : key === "ENTER" ? (
                        "enter"
                      ) : (
                        key
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tooltip overlay (on top of everything) */}
      <AnimatePresence mode="wait">
        <TourTooltip
          key={step.id}
          title={step.title}
          description={step.description}
          stepIndex={stepIndex}
          totalSteps={TOUR_STEPS.length}
          onNext={handleNext}
          onSkip={onClose}
          showNext={showNextButton}
          position={tooltipPosition}
        />
      </AnimatePresence>
    </div>
  );
}
