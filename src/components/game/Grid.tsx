"use client";

import { useMemo } from "react";
import { Cell } from "./Cell";
import type { PuzzleData, RevealedLetter } from "@/types";

interface GridProps {
  puzzle: PuzzleData;
  revealedLetters: RevealedLetter[];
  solvedWords: Set<string>;
  selectedTarget: "main" | string;
  shakeTarget: string | null;
  onSelectTarget: (targetId: "main" | string) => void;
}

interface CellInfo {
  letter: string;
  status: "empty" | "filled" | "correct" | "present" | "absent" | "revealed";
  belongsTo: ("main" | string)[];
}

export function Grid({
  puzzle,
  revealedLetters,
  solvedWords,
  selectedTarget,
  shakeTarget,
  onSelectTarget,
}: GridProps) {
  // Build the grid cell data
  const grid = useMemo(() => {
    const cells: (CellInfo | null)[][] = Array.from(
      { length: puzzle.gridSize.rows },
      () => Array.from({ length: puzzle.gridSize.cols }, () => null),
    );

    // Place main word cells
    const { row: mainRow, col: mainCol, word: mainWord } = puzzle.mainWord;
    for (let i = 0; i < mainWord.length; i++) {
      const col = mainCol + i;
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

      cells[mainRow]![col] = { letter, status, belongsTo };
    }

    // Place crosser cells
    for (const crosser of puzzle.crossers) {
      const isSolved = solvedWords.has(crosser.id);
      for (let i = 0; i < crosser.word.length; i++) {
        const row = crosser.startRow + i;
        const col = crosser.startCol;
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

        cells[row]![col] = { letter, status, belongsTo };
      }
    }

    // Apply guess feedback for solved words' display
    // (individual guess feedback is shown in GuessInput, not in the grid)

    return cells;
  }, [puzzle, revealedLetters, solvedWords]);

  const mainRow = puzzle.mainWord.row;

  return (
    <div
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

          return (
            <Cell
              key={`${rowIndex}-${colIndex}`}
              letter={cell.letter}
              status={cell.status}
              isSelected={isSelected}
              isMainWordRow={isMainWordRow}
              animate={isShaking ? "shake" : null}
              onClick={handleClick}
            />
          );
        }),
      )}
    </div>
  );
}
