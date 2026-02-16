import type { PuzzleData } from "@/types";

/**
 * A simple, static puzzle used by the interactive tutorial.
 *
 * Layout (5x5 grid):
 *
 *       0   1   2   3   4
 *  0         A       P
 *  1         P       I
 *  2    A  [P] [L] [E] [S]   <-- main word row (PLES shifted; actual: APPLE)
 *  3         L       C
 *  4         E       K
 *
 * Main word: APPLE  (row 2, cols 0-4)
 * Crosser 1: "APPLE" vertical? No -- let's pick clear, simple words.
 *
 * Revised layout (7 cols x 5 rows):
 *
 *       0   1   2   3   4
 *  0        A           P
 *  1        P           E
 *  2   [A] [P] [P] [L] [E]   <-- main word "APPLE" row=2, col=0
 *  3        L           N
 *  4        E
 *
 * Crosser 1: APPLE down at col=1, rows 0-4 (intersects main at row=2, col=1 => "P")
 *   Wait, that duplicates. Let's use different words.
 *
 * Better layout:
 *
 *       0   1   2   3   4
 *  0        C           S
 *  1        A           P
 *  2   [A] [P] [P] [L] [E]   <-- main word "APPLE"
 *  3        E           N
 *  4                    D
 *
 * Crosser 1: CAPE  col=1, rows 0-3 (intersects main at row=2, col=1 => "P", intersectionIndex=2)
 * Crosser 2: SPEND col=4, rows 0-4 (intersects main at row=2, col=4 => "E", intersectionIndex=2)
 */
export const tutorialPuzzle: PuzzleData = {
  id: "tutorial",
  date: "tutorial",
  mainWord: {
    word: "APPLE",
    row: 2,
    col: 0,
    length: 5,
  },
  crossers: [
    {
      id: "crosser-1",
      word: "CAPE",
      clue: "A superhero wears one",
      direction: "down",
      startRow: 0,
      startCol: 1,
      intersectionIndex: 2, // "P" is at index 2 of "CAPE"
    },
    {
      id: "crosser-2",
      word: "SPEND",
      clue: "Use money to buy things",
      direction: "down",
      startRow: 0,
      startCol: 4,
      intersectionIndex: 2, // "E" is at index 2 of "SPEND"
    },
  ],
  gridSize: { rows: 5, cols: 5 },
  theme: "Fruit",
  themeHint: "A common fruit",
};
