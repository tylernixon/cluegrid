import type { PuzzleData, Guess } from "@/types";

// Emoji constants
const EMPTY = "\u2B1B"; // black square (empty space)
const MAIN_CORRECT = "\u{1F7E9}"; // green square (main word cell - correct)
const MAIN_PRESENT = "\u{1F7E8}"; // yellow square (main word cell - present)
const MAIN_ABSENT = "\u2B1C"; // white square (main word cell - absent/unsolved)
const CROSSER_SOLVED = "\u{1F7E6}"; // blue square (crosser solved)
const CROSSER_UNSOLVED = "\u2B1B"; // black square (crosser unsolved)
const POINTER = "\u2190"; // left arrow

/**
 * Generate a compact crossword-style grid representation
 * Shows the actual puzzle shape with color-coded cells
 */
function generateCrosswordGrid(
  puzzle: PuzzleData,
  solvedWords: Set<string>,
  guesses: Guess[]
): string {
  const { rows, cols } = puzzle.gridSize;
  const mainRow = puzzle.mainWord.row;
  const mainSolved = solvedWords.has("main");

  // Build a 2D grid of emoji squares
  const grid: (string | null)[][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => null)
  );

  // Place crosser cells first (so main word can override intersections)
  for (const crosser of puzzle.crossers) {
    const isSolved = solvedWords.has(crosser.id);
    for (let i = 0; i < crosser.word.length; i++) {
      const row = crosser.startRow + i;
      const col = crosser.startCol;
      if (row < rows && col < cols && row !== mainRow) {
        grid[row]![col] = isSolved ? CROSSER_SOLVED : CROSSER_UNSOLVED;
      }
    }
  }

  // Place main word cells
  const mainGuesses = guesses.filter((g) => g.targetId === "main");
  const lastMainGuess = mainGuesses[mainGuesses.length - 1];

  for (let i = 0; i < puzzle.mainWord.word.length; i++) {
    const col = puzzle.mainWord.col + i;
    if (col < cols) {
      if (mainSolved && lastMainGuess) {
        // Show feedback from the winning guess
        const fb = lastMainGuess.feedback[i];
        if (fb) {
          grid[mainRow]![col] =
            fb.status === "correct"
              ? MAIN_CORRECT
              : fb.status === "present"
                ? MAIN_PRESENT
                : MAIN_ABSENT;
        } else {
          grid[mainRow]![col] = MAIN_CORRECT;
        }
      } else if (mainSolved) {
        grid[mainRow]![col] = MAIN_CORRECT;
      } else {
        grid[mainRow]![col] = MAIN_ABSENT;
      }
    }
  }

  // Convert grid to string, trimming empty rows and using compact representation
  const lines: string[] = [];

  for (let row = 0; row < rows; row++) {
    const rowCells = grid[row]!;
    // Only include rows that have at least one cell
    if (rowCells.some((cell) => cell !== null)) {
      // Build row string, replacing nulls with spaces
      // Find bounds of non-null cells
      const firstCol = rowCells.findIndex((c) => c !== null);
      let lastCol = rowCells.length - 1;
      while (lastCol >= 0 && rowCells[lastCol] === null) lastCol--;

      if (firstCol === -1) continue;

      // Build the row with proper spacing
      let rowStr = "";
      for (let col = firstCol; col <= lastCol; col++) {
        rowStr += rowCells[col] ?? EMPTY;
      }

      // Add arrow indicator for main word row
      if (row === mainRow) {
        rowStr += " " + POINTER;
      }

      lines.push(rowStr);
    }
  }

  return lines.join("\n");
}

/**
 * Generate a shareable text result for the completed game
 * Distinctive gist format with crossword-style grid
 */
export function generateShareResult(
  puzzle: PuzzleData,
  guesses: Guess[],
  solvedWords: Set<string>,
  won: boolean
): string {
  // Count main-word guesses only for the score display
  const mainGuessCount = guesses.filter((g) => g.targetId === "main").length;
  const scoreDisplay = won ? `${mainGuessCount}` : "X";

  // Count solved crossers (hints used)
  const crossersSolved = puzzle.crossers.filter((c) =>
    solvedWords.has(c.id)
  ).length;
  const totalCrossers = puzzle.crossers.length;

  // Star display based on hints used
  const hintsUsed = crossersSolved;
  const ratio = totalCrossers > 0 ? hintsUsed / totalCrossers : 0;
  const stars = ratio === 0 ? 3 : ratio <= 0.5 ? 2 : ratio < 1 ? 1 : 0;
  const starDisplay = "\u2B50".repeat(stars) + "\u2606".repeat(3 - stars);

  // Generate the crossword grid visualization
  const gridVisual = generateCrosswordGrid(puzzle, solvedWords, guesses);

  // Build the share text with distinctive formatting
  const lines: string[] = [
    `gist ${puzzle.date}`,
    "",
    gridVisual,
    "",
    `${starDisplay} | Guesses: ${scoreDisplay} | Hints: ${hintsUsed}/${totalCrossers}`,
    "gist.ing",
  ];

  return lines.join("\n");
}

/**
 * Calculate the puzzle number based on the date
 * Assumes puzzle #1 started on 2024-01-01
 */
export function getPuzzleNumber(dateStr: string): number {
  const startDate = new Date("2024-01-01");
  const puzzleDate = new Date(dateStr);
  const diffTime = puzzleDate.getTime() - startDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays + 1;
}

/**
 * Share result using Web Share API (mobile) or clipboard fallback
 * Returns a promise that resolves with the sharing method used
 */
export async function shareResult(
  puzzle: PuzzleData,
  guesses: Guess[],
  solvedWords: Set<string>,
  won: boolean
): Promise<"shared" | "copied"> {
  const shareText = generateShareResult(puzzle, guesses, solvedWords, won);

  // Try Web Share API first (primarily for mobile)
  if (canUseWebShare()) {
    try {
      await navigator.share({
        text: shareText,
      });
      return "shared";
    } catch (err) {
      // User cancelled or share failed, fall through to clipboard
      if (err instanceof Error && err.name === "AbortError") {
        throw err; // User cancelled, don't fall back
      }
    }
  }

  // Fallback to clipboard
  try {
    await navigator.clipboard.writeText(shareText);
    return "copied";
  } catch (clipboardErr) {
    // Final fallback: use deprecated execCommand for older browsers/iOS quirks
    const textarea = document.createElement("textarea");
    textarea.value = shareText;
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    textarea.style.top = "0";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();

    try {
      const success = document.execCommand("copy");
      document.body.removeChild(textarea);
      if (success) {
        return "copied";
      }
      throw new Error("execCommand copy failed");
    } catch {
      document.body.removeChild(textarea);
      throw clipboardErr;
    }
  }
}

/**
 * Check if Web Share API is available and likely to work
 */
function canUseWebShare(): boolean {
  try {
    return (
      typeof navigator !== "undefined" &&
      typeof navigator.share === "function" &&
      typeof navigator.canShare === "function" &&
      navigator.canShare({ text: "test" })
    );
  } catch {
    // navigator.canShare can throw on iOS Safari in certain contexts
    return false;
  }
}
