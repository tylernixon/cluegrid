import type { PuzzleData, Guess } from "@/types";

/**
 * Generate a shareable text result for the completed game
 * Format:
 *   Cluegrid #123 4/6
 *
 *   [emoji grid for main word guesses]
 *
 *   Crossers: 2/3
 *   cluegrid.com
 */
export function generateShareResult(
  puzzle: PuzzleData,
  guesses: Guess[],
  solvedWords: Set<string>,
  won: boolean
): string {
  const puzzleNumber = getPuzzleNumber(puzzle.date);
  const mainGuesses = guesses.filter((g) => g.targetId === "main");
  const guessCount = guesses.length;
  const scoreDisplay = won ? `${guessCount}/6` : "X/6";

  // Generate emoji grid for main word guesses
  const emojiGrid = mainGuesses
    .map((guess) =>
      guess.feedback
        .map((fb) => {
          switch (fb.status) {
            case "correct":
              return "\u{1F7E9}"; // green square
            case "present":
              return "\u{1F7E8}"; // yellow square
            case "absent":
              return "\u2B1B"; // black square
          }
        })
        .join("")
    )
    .join("\n");

  // Count solved crossers
  const crossersSolved = puzzle.crossers.filter((c) =>
    solvedWords.has(c.id)
  ).length;
  const totalCrossers = puzzle.crossers.length;

  // Build the share text
  const lines: string[] = [
    `Cluegrid #${puzzleNumber} ${scoreDisplay}`,
    "",
    emojiGrid,
    "",
    `Crossers: ${crossersSolved}/${totalCrossers}`,
    "cluegrid.com",
  ];

  return lines.join("\n");
}

/**
 * Calculate the puzzle number based on the date
 * Assumes puzzle #1 started on 2024-01-01
 */
function getPuzzleNumber(dateStr: string): number {
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
  await navigator.clipboard.writeText(shareText);
  return "copied";
}

/**
 * Check if Web Share API is available and likely to work
 */
function canUseWebShare(): boolean {
  return (
    typeof navigator !== "undefined" &&
    typeof navigator.share === "function" &&
    typeof navigator.canShare === "function" &&
    navigator.canShare({ text: "test" })
  );
}
