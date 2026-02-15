"use client";

import { useMemo, useState, useEffect, useCallback, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Cell } from "./Cell";
import type { PuzzleData, RevealedLetter, Guess } from "@/types";
import { VICTORY_STAGGER_MS, EASE } from "@/lib/motion";

interface GridProps {
  puzzle: PuzzleData;
  revealedLetters: RevealedLetter[];
  solvedWords: Set<string>;
  selectedTarget: "main" | string;
  currentGuess: string;
  shakeTarget: string | null;
  isVictory?: boolean;
  guesses: Guess[];
  onSelectTarget: (targetId: "main" | string) => void;
}

interface CellInfo {
  letter: string;
  status: "empty" | "filled" | "correct" | "present" | "absent" | "revealed" | "lockedCorrect" | "typing";
  belongsTo: ("main" | string)[];
  row: number;
  col: number;
}

// Track recently solved/revealed for animations
interface AnimationState {
  recentlySolved: Set<string>;
  recentlyRevealed: Set<string>; // "row-col" format
}

export function Grid({
  puzzle,
  revealedLetters,
  solvedWords,
  selectedTarget,
  currentGuess,
  shakeTarget,
  isVictory = false,
  guesses,
  onSelectTarget,
}: GridProps) {
  const [victoryAnimating, setVictoryAnimating] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);
  const [focusedCell, setFocusedCell] = useState<{ row: number; col: number } | null>(null);
  const prefersReducedMotion = useReducedMotion();

  // Track animation state for recently changed items
  const [animState, setAnimState] = useState<AnimationState>({
    recentlySolved: new Set(),
    recentlyRevealed: new Set(),
  });

  // Keep refs to previous values for change detection
  const prevSolvedWordsRef = useRef<Set<string>>(new Set());
  const prevRevealedLettersRef = useRef<RevealedLetter[]>([]);

  // Detect newly solved words and revealed letters
  useEffect(() => {
    const prevSolved = prevSolvedWordsRef.current;
    const prevRevealed = prevRevealedLettersRef.current;

    // Find newly solved words
    const newlySolved = new Set<string>();
    solvedWords.forEach((word) => {
      if (!prevSolved.has(word)) {
        newlySolved.add(word);
      }
    });

    // Find newly revealed letters
    const newlyRevealed = new Set<string>();
    revealedLetters.forEach((rl) => {
      const key = `${rl.row}-${rl.col}`;
      const wasRevealed = prevRevealed.some(
        (prev) => prev.row === rl.row && prev.col === rl.col
      );
      if (!wasRevealed) {
        newlyRevealed.add(key);
      }
    });

    // Update animation state if there are new items
    if (newlySolved.size > 0 || newlyRevealed.size > 0) {
      setAnimState({
        recentlySolved: newlySolved,
        recentlyRevealed: newlyRevealed,
      });

      // Clear animation state after animation completes (300ms)
      const timer = setTimeout(() => {
        setAnimState({
          recentlySolved: new Set(),
          recentlyRevealed: new Set(),
        });
      }, 300);

      // Update refs
      prevSolvedWordsRef.current = new Set(solvedWords);
      prevRevealedLettersRef.current = [...revealedLetters];

      return () => clearTimeout(timer);
    }

    // Update refs for next comparison
    prevSolvedWordsRef.current = new Set(solvedWords);
    prevRevealedLettersRef.current = [...revealedLetters];
  }, [solvedWords, revealedLetters]);

  // Trigger victory animation when isVictory becomes true
  useEffect(() => {
    if (isVictory && !victoryAnimating) {
      setVictoryAnimating(true);
      // Reset after animation completes (gentle glow, shorter duration)
      const totalDuration = puzzle.mainWord.length * VICTORY_STAGGER_MS + 350;
      const timer = setTimeout(() => {
        setVictoryAnimating(false);
      }, totalDuration);
      return () => clearTimeout(timer);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVictory, puzzle.mainWord.length]);

  // Build the grid cell data
  const grid = useMemo(() => {
    // Safety check for valid dimensions
    const safeRows = Math.max(1, puzzle.gridSize?.rows || 5);
    const safeCols = Math.max(1, puzzle.gridSize?.cols || 5);

    const cells: (CellInfo | null)[][] = Array.from(
      { length: safeRows },
      () =>
        Array.from({ length: safeCols }, () => null),
    );

    // Build a map of locked correct positions from previous guesses
    // (letters that got "correct" feedback but word not solved yet)
    const lockedCorrectPositions = new Map<string, Map<number, string>>(); // targetId -> position -> letter
    for (const guess of guesses) {
      if (solvedWords.has(guess.targetId)) continue; // Skip if already solved
      if (!lockedCorrectPositions.has(guess.targetId)) {
        lockedCorrectPositions.set(guess.targetId, new Map());
      }
      const targetMap = lockedCorrectPositions.get(guess.targetId)!;
      for (let i = 0; i < guess.feedback.length; i++) {
        const fb = guess.feedback[i];
        if (fb && fb.status === "correct") {
          targetMap.set(i, fb.letter.toUpperCase());
        }
      }
    }

    // Place main word cells
    const { row: mainRowIdx, col: mainCol, word: mainWord } = puzzle.mainWord;
    const mainLockedCorrect = lockedCorrectPositions.get("main") ?? new Map();

    for (let i = 0; i < mainWord.length; i++) {
      const col = mainCol + i;
      if (mainRowIdx < 0 || mainRowIdx >= safeRows || col < 0 || col >= safeCols) continue;
      if (!cells[mainRowIdx]) continue;
      const existing = cells[mainRowIdx][col];
      const belongsTo = existing ? [...existing.belongsTo, "main" as const] : ["main" as const];

      // Check if this letter is revealed by a crosser solve (intersection hint)
      const revealed = revealedLetters.find(
        (r) => r.row === mainRowIdx && r.col === col,
      );

      // Check if this position is locked from a correct guess
      const lockedFromGuess = mainLockedCorrect.get(i);

      // Check if main word is solved
      const mainSolved = solvedWords.has("main");

      let letter = "";
      let status: CellInfo["status"] = "empty";

      if (mainSolved) {
        letter = mainWord[i]!;
        status = "correct";
      } else if (revealed) {
        letter = revealed.letter;
        status = "revealed"; // Teal - hint from intersection
      } else if (lockedFromGuess) {
        letter = lockedFromGuess;
        status = "lockedCorrect"; // Green - earned from your guess
      } else if (selectedTarget === "main" && currentGuess[i] && currentGuess[i] !== " ") {
        // Show current guess letter for main word (skip spaces which indicate unfilled)
        letter = currentGuess[i]!.toUpperCase();
        status = "typing";
      }

      cells[mainRowIdx][col] = { letter, status, belongsTo, row: mainRowIdx, col };
    }

    // Place crosser cells
    for (const crosser of puzzle.crossers) {
      const isSolved = solvedWords.has(crosser.id);
      const isActiveTarget = selectedTarget === crosser.id;
      const crosserLockedCorrect = lockedCorrectPositions.get(crosser.id) ?? new Map();

      for (let i = 0; i < crosser.word.length; i++) {
        const row = crosser.startRow + i;
        const col = crosser.startCol;
        if (row < 0 || row >= safeRows || col < 0 || col >= safeCols) continue;
        if (!cells[row]) continue;
        const existing = cells[row][col];
        const belongsTo = existing
          ? [...existing.belongsTo, crosser.id]
          : [crosser.id];

        // If cell already has data (intersection with solved/revealed/lockedCorrect/typing letter), preserve it
        if (existing && existing.letter && (existing.status === "correct" || existing.status === "revealed" || existing.status === "lockedCorrect" || existing.status === "typing")) {
          cells[row][col] = { ...existing, belongsTo };
          continue;
        }

        // Check if this position is locked from a correct guess
        const lockedFromGuess = crosserLockedCorrect.get(i);

        let letter = "";
        let status: CellInfo["status"] = "empty";

        if (isSolved) {
          letter = crosser.word[i]!;
          status = "correct";
        } else if (lockedFromGuess) {
          letter = lockedFromGuess;
          status = "lockedCorrect"; // Green - earned from your guess
        } else if (isActiveTarget && currentGuess[i] && currentGuess[i] !== " ") {
          // Show current guess letter for this crosser (skip spaces which indicate unfilled)
          letter = currentGuess[i]!.toUpperCase();
          status = "typing";
        }

        cells[row][col] = { letter, status, belongsTo, row, col };
      }
    }

    return cells;
  }, [puzzle, revealedLetters, solvedWords, selectedTarget, currentGuess, guesses]);

  // Build a flat list of navigable cells for keyboard navigation
  const navigableCells = useMemo(() => {
    const cells: { row: number; col: number }[] = [];
    grid.forEach((row, rowIndex) => {
      row.forEach((cell, colIndex) => {
        if (cell) {
          cells.push({ row: rowIndex, col: colIndex });
        }
      });
    });
    return cells;
  }, [grid]);

  // Find next/prev cell in navigation order
  const findAdjacentCell = useCallback(
    (
      currentRow: number,
      currentCol: number,
      direction: "up" | "down" | "left" | "right",
    ): { row: number; col: number } | null => {
      let newRow = currentRow;
      let newCol = currentCol;

      switch (direction) {
        case "up":
          newRow--;
          break;
        case "down":
          newRow++;
          break;
        case "left":
          newCol--;
          break;
        case "right":
          newCol++;
          break;
      }

      // Check bounds
      if (newRow < 0 || newRow >= puzzle.gridSize.rows) return null;
      if (newCol < 0 || newCol >= puzzle.gridSize.cols) return null;

      // Check if cell exists
      if (grid[newRow]?.[newCol]) {
        return { row: newRow, col: newCol };
      }

      return null;
    },
    [grid, puzzle.gridSize],
  );

  // Handle keyboard navigation within the grid
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, row: number, col: number) => {
      let nextCell: { row: number; col: number } | null = null;

      switch (e.key) {
        case "ArrowUp":
          e.preventDefault();
          nextCell = findAdjacentCell(row, col, "up");
          break;
        case "ArrowDown":
          e.preventDefault();
          nextCell = findAdjacentCell(row, col, "down");
          break;
        case "ArrowLeft":
          e.preventDefault();
          nextCell = findAdjacentCell(row, col, "left");
          break;
        case "ArrowRight":
          e.preventDefault();
          nextCell = findAdjacentCell(row, col, "right");
          break;
        case "Enter":
        case " ":
          e.preventDefault();
          // Select the word at this cell
          const cell = grid[row]?.[col];
          if (cell) {
            if (cell.belongsTo.length === 1) {
              onSelectTarget(cell.belongsTo[0]!);
            } else {
              const otherWord = cell.belongsTo.find((w) => w !== selectedTarget);
              if (otherWord) {
                onSelectTarget(otherWord);
              } else {
                onSelectTarget(cell.belongsTo[0]!);
              }
            }
          }
          break;
        case "Home":
          e.preventDefault();
          nextCell = navigableCells[0] ?? null;
          break;
        case "End":
          e.preventDefault();
          nextCell = navigableCells[navigableCells.length - 1] ?? null;
          break;
      }

      if (nextCell) {
        setFocusedCell(nextCell);
        // Focus the cell element
        const cellElement = gridRef.current?.querySelector(
          `[data-row="${nextCell.row}"][data-col="${nextCell.col}"]`,
        ) as HTMLElement | null;
        cellElement?.focus();
      }
    },
    [findAdjacentCell, grid, navigableCells, onSelectTarget, selectedTarget],
  );

  const mainRow = puzzle.mainWord.row;
  const mainCol = puzzle.mainWord.col;

  // Grid-wide glow animation for final word solve
  const gridGlowAnimation = victoryAnimating && !prefersReducedMotion
    ? {
        boxShadow: [
          "0 0 0 0 rgba(34, 197, 94, 0)",
          "0 0 24px 6px rgba(34, 197, 94, 0.25)",
          "0 0 0 0 rgba(34, 197, 94, 0)",
        ],
      }
    : {};

  const gridGlowTransition = victoryAnimating
    ? {
        duration: 0.6,
        ease: EASE.inOut,
        delay: (puzzle.mainWord.word.length * VICTORY_STAGGER_MS) / 1000,
      }
    : {};

  return (
    <motion.div
      ref={gridRef}
      className="inline-grid gap-[6px] rounded-lg p-1"
      style={{
        gridTemplateColumns: `repeat(${puzzle.gridSize.cols}, 1fr)`,
        gridTemplateRows: `repeat(${puzzle.gridSize.rows}, 1fr)`,
      }}
      role="grid"
      aria-label="Puzzle grid"
      animate={gridGlowAnimation}
      transition={gridGlowTransition}
    >
      {grid.map((row, rowIndex) =>
        row.map((cell, colIndex) => {
          if (!cell) {
            // Empty space in the grid
            return (
              <div
                key={`${rowIndex}-${colIndex}`}
                className="w-[52px] h-[52px] sm:w-[56px] sm:h-[56px] md:w-[60px] md:h-[60px]"
                aria-hidden="true"
              />
            );
          }

          const isSelected = cell.belongsTo.includes(selectedTarget);
          const isMainWordRow = rowIndex === mainRow;

          // Handle click: toggle between words at intersection
          const handleClick = () => {
            if (cell.belongsTo.length === 1) {
              onSelectTarget(cell.belongsTo[0]!);
            } else {
              // At intersection, toggle to the other word
              const otherWord = cell.belongsTo.find(
                (w) => w !== selectedTarget,
              );
              if (otherWord) {
                onSelectTarget(otherWord);
              } else {
                onSelectTarget(cell.belongsTo[0]!);
              }
            }
          };

          const isShaking = shakeTarget
            ? cell.belongsTo.includes(shakeTarget)
            : false;

          // Victory glow animation for main word cells (gentle, not bouncy)
          const shouldGlow =
            victoryAnimating && isMainWordRow && cell.belongsTo.includes("main");
          const glowDelay = shouldGlow
            ? (colIndex - mainCol) * (VICTORY_STAGGER_MS / 1000)
            : 0;

          // Check if this cell belongs to a recently solved crosser
          const isRecentlySolvedCrosser = cell.belongsTo.some(
            (wordId) => wordId !== "main" && animState.recentlySolved.has(wordId)
          );

          // Check if this is a recently revealed letter (intersection)
          const cellKey = `${rowIndex}-${colIndex}`;
          const isRecentlyRevealed = animState.recentlyRevealed.has(cellKey);

          // Determine animation type with priority
          let animationType: "shake" | "glow" | "solvedLock" | "reveal" | null = null;
          let animationDelay = 0;

          if (isShaking) {
            animationType = "shake";
          } else if (shouldGlow) {
            animationType = "glow";
            animationDelay = glowDelay;
          } else if (isRecentlyRevealed && !prefersReducedMotion) {
            // Soft fade-in for revealed intersection letters
            animationType = "reveal";
          } else if (isRecentlySolvedCrosser && !prefersReducedMotion) {
            // Subtle lock animation for solved crosser cells
            animationType = "solvedLock";
            // Stagger based on position in the crosser
            const crosserId = cell.belongsTo.find(
              (id) => id !== "main" && animState.recentlySolved.has(id)
            );
            if (crosserId) {
              const crosser = puzzle.crossers.find((c) => c.id === crosserId);
              if (crosser) {
                const positionInCrosser = rowIndex - crosser.startRow;
                animationDelay = positionInCrosser * 0.03; // 30ms stagger
              }
            }
          }

          // Determine if this cell should be focusable
          const isFirstCell = navigableCells[0]?.row === rowIndex && navigableCells[0]?.col === colIndex;
          const isFocused = focusedCell?.row === rowIndex && focusedCell?.col === colIndex;
          const tabIndexValue = isFocused || (focusedCell === null && isFirstCell) ? 0 : -1;

          return (
            <Cell
              key={`${rowIndex}-${colIndex}`}
              letter={cell.letter}
              status={cell.status}
              isSelected={isSelected}
              isMainWordRow={isMainWordRow}
              animate={animationType}
              animationDelay={animationDelay}
              onClick={handleClick}
              tabIndex={tabIndexValue}
              onKeyDown={(e) => handleKeyDown(e, rowIndex, colIndex)}
              row={rowIndex}
              col={colIndex}
            />
          );
        }),
      )}
    </motion.div>
  );
}
