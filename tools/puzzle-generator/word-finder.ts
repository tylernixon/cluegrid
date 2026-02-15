#!/usr/bin/env npx tsx
/**
 * Word Finder Utility
 *
 * Given a main word and theme, finds candidate crosser words that:
 * 1. Share a letter at the correct position with the main word
 * 2. Are thematically relevant to the given theme
 *
 * Usage:
 *   npx tsx word-finder.ts --main-word "WHALE" --theme "Ocean Life"
 *   npx tsx word-finder.ts -m WHALE -t "Ocean Life" --position 2
 */

import Anthropic from "@anthropic-ai/sdk";
import type { CrosserCandidate, WordFinderResult } from "./types.js";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

// Lazy-initialized Anthropic client
let _anthropicClient: Anthropic | null = null;

function getAnthropicClient(): Anthropic {
  if (_anthropicClient) {
    return _anthropicClient;
  }
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("Error: ANTHROPIC_API_KEY environment variable is required");
    process.exit(1);
  }
  _anthropicClient = new Anthropic({ apiKey });
  return _anthropicClient;
}

// ---------------------------------------------------------------------------
// Word Finding Logic
// ---------------------------------------------------------------------------

/**
 * Find candidate crosser words for a given main word and theme
 */
export async function findCrosserCandidates(
  mainWord: string,
  theme: string,
  targetPosition?: number
): Promise<WordFinderResult> {
  const normalizedMainWord = mainWord.toUpperCase().trim();

  // Build position constraints
  const positions =
    targetPosition !== undefined
      ? [targetPosition]
      : Array.from({ length: normalizedMainWord.length }, (_, i) => i);

  const positionInfo = positions
    .map((pos) => {
      const letter = normalizedMainWord[pos];
      return `- Position ${pos}: letter "${letter}" - find 5-letter words that have "${letter}" somewhere in them`;
    })
    .join("\n");

  const prompt = `You are helping create a word puzzle game. Given a main word and theme, suggest crosser words.

MAIN WORD: ${normalizedMainWord}
THEME: ${theme}

For each position in the main word, suggest 3-5 candidate crosser words that:
1. Are common English words (5 letters preferred, 3-7 acceptable)
2. Have the intersecting letter at a valid position in the crosser
3. Are thematically connected to "${theme}" (even loosely)
4. Would make good puzzle answers (not too obscure)

Position details:
${positionInfo}

Respond with a JSON object in this exact format:
{
  "candidates": [
    {
      "word": "CORAL",
      "mainWordPosition": 0,
      "crosserPosition": 0,
      "sharedLetter": "W",
      "thematicRelevance": 0.9,
      "reasoning": "Coral reefs are ocean habitats"
    }
  ]
}

IMPORTANT:
- Verify that the sharedLetter actually appears at crosserPosition in the word
- The sharedLetter must match mainWord[mainWordPosition]
- Return ONLY valid JSON, no markdown code blocks`;

  const anthropic = getAnthropicClient();
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2000,
    messages: [{ role: "user", content: prompt }],
  });

  // Extract text content from response
  const textContent = response.content.find((block) => block.type === "text");
  if (!textContent || textContent.type !== "text") {
    throw new Error("No text response from Claude API");
  }

  // Parse JSON response
  let parsed: { candidates: Array<CrosserCandidate & { reasoning?: string }> };
  try {
    parsed = JSON.parse(textContent.text);
  } catch {
    // Try to extract JSON from the response if it has extra text
    const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      parsed = JSON.parse(jsonMatch[0]);
    } else {
      throw new Error(`Failed to parse Claude response as JSON: ${textContent.text}`);
    }
  }

  // Validate and filter candidates
  const validCandidates = parsed.candidates.filter((candidate) => {
    const word = candidate.word.toUpperCase();
    const mainLetter = normalizedMainWord[candidate.mainWordPosition];
    const crosserLetter = word[candidate.crosserPosition];

    // Verify the intersection is valid
    if (mainLetter !== crosserLetter) {
      console.warn(
        `Invalid candidate ${word}: expected letter "${mainLetter}" at position ${candidate.crosserPosition}, got "${crosserLetter}"`
      );
      return false;
    }

    return true;
  });

  // Sort by thematic relevance
  validCandidates.sort((a, b) => b.thematicRelevance - a.thematicRelevance);

  return {
    mainWord: normalizedMainWord,
    theme,
    candidates: validCandidates.map((c) => ({
      word: c.word.toUpperCase(),
      mainWordPosition: c.mainWordPosition,
      crosserPosition: c.crosserPosition,
      sharedLetter: c.sharedLetter.toUpperCase(),
      thematicRelevance: c.thematicRelevance,
    })),
  };
}

/**
 * Validate that a crosser word correctly intersects with the main word
 */
export function validateIntersection(
  mainWord: string,
  crosserWord: string,
  mainWordPosition: number,
  crosserPosition: number
): boolean {
  const mainLetter = mainWord.toUpperCase()[mainWordPosition];
  const crosserLetter = crosserWord.toUpperCase()[crosserPosition];
  return mainLetter === crosserLetter;
}

/**
 * Find all valid intersection positions between two words
 */
export function findIntersections(
  mainWord: string,
  crosserWord: string
): Array<{ mainWordPosition: number; crosserPosition: number; letter: string }> {
  const intersections: Array<{
    mainWordPosition: number;
    crosserPosition: number;
    letter: string;
  }> = [];
  const main = mainWord.toUpperCase();
  const crosser = crosserWord.toUpperCase();

  for (let i = 0; i < main.length; i++) {
    for (let j = 0; j < crosser.length; j++) {
      if (main[i] === crosser[j]) {
        intersections.push({
          mainWordPosition: i,
          crosserPosition: j,
          letter: main[i]!,
        });
      }
    }
  }

  return intersections;
}

// ---------------------------------------------------------------------------
// CLI Entry Point
// ---------------------------------------------------------------------------

async function main() {
  const args = process.argv.slice(2);

  // Parse arguments
  let mainWord: string | undefined;
  let theme: string | undefined;
  let position: number | undefined;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const nextArg = args[i + 1];

    if ((arg === "--main-word" || arg === "-m") && nextArg) {
      mainWord = nextArg;
      i++;
    } else if ((arg === "--theme" || arg === "-t") && nextArg) {
      theme = nextArg;
      i++;
    } else if ((arg === "--position" || arg === "-p") && nextArg) {
      position = parseInt(nextArg, 10);
      i++;
    } else if (arg === "--help" || arg === "-h") {
      console.log(`
Word Finder - Find candidate crosser words for Cluegrid puzzles

Usage:
  npx tsx word-finder.ts --main-word <word> --theme <theme> [options]

Options:
  -m, --main-word <word>   The main puzzle word (required)
  -t, --theme <theme>      Theme/category for words (required)
  -p, --position <num>     Only find words for this position (optional)
  -h, --help               Show this help message

Examples:
  npx tsx word-finder.ts -m WHALE -t "Ocean Life"
  npx tsx word-finder.ts --main-word PIZZA --theme "Italian Food" --position 2
`);
      process.exit(0);
    }
  }

  if (!mainWord || !theme) {
    console.error("Error: --main-word and --theme are required");
    console.error("Run with --help for usage information");
    process.exit(1);
  }

  console.log(`\nFinding crosser candidates for "${mainWord}" with theme "${theme}"...\n`);

  try {
    const result = await findCrosserCandidates(mainWord, theme, position);

    console.log(`Main Word: ${result.mainWord}`);
    console.log(`Theme: ${result.theme}`);
    console.log(`\nCandidates (${result.candidates.length} found):\n`);

    // Group by main word position
    const byPosition = new Map<number, CrosserCandidate[]>();
    for (const candidate of result.candidates) {
      const existing = byPosition.get(candidate.mainWordPosition) || [];
      existing.push(candidate);
      byPosition.set(candidate.mainWordPosition, existing);
    }

    for (const [pos, candidates] of Array.from(byPosition.entries()).sort(
      ([a], [b]) => a - b
    )) {
      const letter = result.mainWord[pos];
      console.log(`Position ${pos} (letter "${letter}"):`);
      for (const c of candidates) {
        const relevanceBar = "=".repeat(Math.round(c.thematicRelevance * 10));
        console.log(
          `  ${c.word.padEnd(10)} [${relevanceBar.padEnd(10)}] intersects at position ${c.crosserPosition}`
        );
      }
      console.log();
    }

    // Output JSON for piping
    if (process.stdout.isTTY === false) {
      console.log(JSON.stringify(result, null, 2));
    }
  } catch (error) {
    console.error("Error finding crosser candidates:", error);
    process.exit(1);
  }
}

// Run CLI if this is the main module
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  main();
}
