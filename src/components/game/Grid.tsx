"use client";

import { useMemo, useState, useEffect, useCallback, useRef } from "react";
import { Cell } from "./Cell";
import type { PuzzleData, RevealedLetter } from "@/types";
import { VICTORY_STAGGER_MS } from "@/lib/motion";

interface GridProps {
  puzzle: PuzzleData;
  revealedLetters: RevealedLetter[];
  solvedWords: Set<string>;
  selectedTarget: "main" | string;
  shakeTarget: string | null;
  isVictory?: boolean;
  onSelectTarget: (targetId: "main" | string) => void;
}

interface CellInfo {
  letter: string;
  status: "empty" | "filled" | "correct" | "present" | "absent" | "revealed";
  belongsTo: ("main" | string)[];
  row: number;
  col: number;
}

export function Grid({
  puzzle,
  revealedLetters,
  solvedWords,
  selectedTarget,
  shakeTarget,
  isVictory = false,
  onSelectTarget,
}: GridProps) {
  const [victoryAnimating, setVictoryAnimating] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);
  const [focusedCell, setFocusedCell] = useState<{ row: number; col: number } | null>(null);

  // Trigger victory animation when isVictory becomes true
  useEffect(() => {
    if (isVictory && !victoryAnimating) {
      setVictoryAnimating(true);
      // Reset after animation completes
      const totalDuration = puzzle.mainWord.length * VICTORY_STAGGER_MS + 400;
      const timer = setTimeout(() => {
        setVictoryAnimating(false);
      }, totalDuration);
      return () => clearTimeout(timer);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVictory, puzzle.mainWord.length]);

  // Build the grid cell data
  const grid = useMemo(() => {
    const cells: (CellInfo | null)[][] = Array.from(
      { length: puzzle.gridSize.rows },
      () =>
        Array.from({ length: puzzle.gridSize.cols }, () => null),
    );

    // Place main word cells
    const { row: mainRow, col: mainCol, word: mainWord } = puzzle.mainWord;
    for (let i = 0; i < mainWord.length; i++) {
      const col = mainCol + i;
      if (mainRow >= puzzle.gridSize.rows || col >= puzzle.gridSize.cols) continue;
      const existing = cells[mainRow]?.[col];
      const belongsTo = existing ? [...existing.belongsTo, "main" as const] : ["main" as const];

      // Check if this letter is revealed by a crosser solve
      const revealed = revealedLetters.find(
        (r) => r.row === mainRow && r.col === col,
      );

      // Check if main word is solved
      const mainSolved = solvedWords.has("main");

      let letter = "";
      let status: CellInfo["status"] = "empty";

      if (mainSolved) {
        letter = mainWord[i]!;
        status = "correct";
      } else if (revealed) {
        letter = revealed.letter;
        status = "revealed";
      }

      cells[mainRow]![col] = { letter, status, belongsTo, row: mainRow, col };
    }

    // Place crosser cells
    for (const crosser of puzzle.crossers) {
      const isSolved = solvedWords.has(crosser.id);
      for (let i = 0; i < crosser.word.length; i++) {
        const row = crosser.startRow + i;
        const col = crosser.startCol;
        if (row >= puzzle.gridSize.rows || col >= puzzle.gridSize.cols) continue;
        const existing = cells[row]?.[col];
        const belongsTo = existing
          ? [...existing.belongsTo, crosser.id]
          : [crosser.id];

        // If cell already has data (intersection), merge
        if (existing && existing.letter) {
          cells[row]![col] = { ...existing, belongsTo };
          continue;
        }

        let letter = "";
        let status: CellInfo["status"] = "empty";

        if (isSolved) {
          letter = crosser.word[i]!;
          status = "correct";
        }

        cells[row]![col] = { letter, status, belongsTo, row, col };
      }
    }

    return cells;
  }, [puzzle, revealedLetters, solvedWords]);

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

  return (
    <div
      ref={gridRef}
      className="inline-grid gap-[6px]"
      style={{
        gridTemplateColumns: `repeat(${puzzle.gridSize.cols}, 1fr)`,
        gridTemplateRows: `repeat(${puzzle.gridSize.rows}, 1fr)`,
      }}
      role="grid"
      aria-label="Puzzle grid"
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

          // Victory bounce animation for main word cells
          const shouldBounce =
            victoryAnimating && isMainWordRow && cell.belongsTo.includes("main");
          const bounceDelay = shouldBounce
            ? (colIndex - mainCol) * (VICTORY_STAGGER_MS / 1000)
            : 0;

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
              animate={
                isShaking ? "shake" : shouldBounce ? "bounce" : null
              }
              animationDelay={bounceDelay}
              onClick={handleClick}
              tabIndex={tabIndexValue}
              onKeyDown={(e) => handleKeyDown(e, rowIndex, colIndex)}
            />
          );
        }),
      )}
    </div>
  );
}
