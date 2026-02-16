import type { PuzzleData } from "@/types";

/**
 * A simple, static puzzle used by the interactive tutorial.
 *
 * The crosser clues hint at the theme - that's the "gist" of the game!
 *
 * Layout (5x4 grid):
 *
 *       0   1   2   3   4
 *  0        R           T
 *  1        I           R
 *  2   [A] [P] [P] [L] [E]   <-- main word "APPLE"
 *  3        E           E
 *
 * Crosser 1: RIPE col=1, rows 0-3 (intersects main at row=2, col=1 => "P", intersectionIndex=2)
 *   Clue hints at fruit: "Ready to pick from the orchard"
 *
 * Crosser 2: TREE col=4, rows 0-3 (intersects main at row=2, col=4 => "E", intersectionIndex=2)
 *   Clue hints at fruit: "A Granny Smith grows on one"
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
      word: "RIPE",
      clue: "Ready to pick from the orchard",
      direction: "down",
      startRow: 0,
      startCol: 1,
      intersectionIndex: 2, // "P" is at index 2 of "RIPE"
    },
    {
      id: "crosser-2",
      word: "TREE",
      clue: "A Granny Smith grows on one",
      direction: "down",
      startRow: 0,
      startCol: 4,
      intersectionIndex: 2, // "E" is at index 2 of "TREE"
    },
  ],
  gridSize: { rows: 4, cols: 5 },
  theme: "Fruit",
  themeHint: "A common fruit",
};
