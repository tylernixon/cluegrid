#!/usr/bin/env npx tsx
/**
 * Cluegrid Puzzle Generator
 *
 * An AI-powered tool that generates complete puzzles using Claude API.
 * Given a theme and optionally a main word, it:
 * 1. Brainstorms or validates the main word
 * 2. Finds thematically relevant crosser words
 * 3. Validates letter intersections
 * 4. Generates clever clues that hint at both the word AND the theme
 * 5. Outputs valid puzzle JSON
 *
 * Usage:
 *   npx tsx generate-puzzle.ts --theme "Ocean Life" --main-word "WHALE"
 *   npx tsx generate-puzzle.ts --theme "Italian Food" --difficulty 2 --crossers 4
 */

import Anthropic from "@anthropic-ai/sdk";
import * as fs from "fs";
import type {
  Crosser,
  PuzzleData,
  GenerateOptions,
  CrosserCandidate,
} from "./types.js";
import {
  findCrosserCandidates,
  validateIntersection,
} from "./word-finder.js";

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

// Default values
const DEFAULT_DIFFICULTY = 3;
const DEFAULT_CROSSER_COUNT = 3;
const MIN_WORD_LENGTH = 3;
const MAX_WORD_LENGTH = 7;

// ---------------------------------------------------------------------------
// Main Word Generation
// ---------------------------------------------------------------------------

/**
 * Generate or validate a main word for the given theme
 */
async function getMainWord(
  theme: string,
  providedWord?: string,
  difficulty?: number
): Promise<string> {
  if (providedWord) {
    const word = providedWord.toUpperCase().trim();
    if (word.length < MIN_WORD_LENGTH || word.length > MAX_WORD_LENGTH) {
      throw new Error(
        `Main word must be ${MIN_WORD_LENGTH}-${MAX_WORD_LENGTH} letters (got ${word.length})`
      );
    }
    if (!/^[A-Z]+$/.test(word)) {
      throw new Error("Main word must contain only letters A-Z");
    }
    return word;
  }

  // Generate a main word using Claude
  const difficultyDesc =
    difficulty && difficulty >= 4
      ? "less common but still recognizable"
      : difficulty && difficulty <= 2
        ? "very common and well-known"
        : "moderately common";

  const prompt = `You are helping create a word puzzle game.

THEME: ${theme}

Generate a single ${difficultyDesc} English word that:
1. Is 5 letters long (strongly preferred) or 4-6 letters
2. Is related to the theme "${theme}"
3. Would make a good puzzle answer (not too obscure, not a proper noun)
4. Has a good variety of letters (avoid double letters if possible)

Respond with ONLY the word in uppercase, nothing else.`;

  const anthropic = getAnthropicClient();
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 50,
    messages: [{ role: "user", content: prompt }],
  });

  const textContent = response.content.find((block) => block.type === "text");
  if (!textContent || textContent.type !== "text") {
    throw new Error("No text response from Claude API");
  }

  const word = textContent.text.trim().toUpperCase().replace(/[^A-Z]/g, "");
  if (word.length < MIN_WORD_LENGTH || word.length > MAX_WORD_LENGTH) {
    throw new Error(`Generated word "${word}" has invalid length`);
  }

  return word;
}

// ---------------------------------------------------------------------------
// Crosser Selection
// ---------------------------------------------------------------------------

/**
 * Select the best crosser words from candidates
 * Ensures good distribution across main word positions
 */
function selectBestCrossers(
  candidates: CrosserCandidate[],
  mainWord: string,
  targetCount: number
): CrosserCandidate[] {
  const selected: CrosserCandidate[] = [];
  const usedPositions = new Set<number>();
  const usedWords = new Set<string>();

  // Sort by thematic relevance
  const sorted = [...candidates].sort(
    (a, b) => b.thematicRelevance - a.thematicRelevance
  );

  // First pass: pick one word per position (spread across main word)
  for (const candidate of sorted) {
    if (selected.length >= targetCount) break;
    if (usedPositions.has(candidate.mainWordPosition)) continue;
    if (usedWords.has(candidate.word.toUpperCase())) continue;

    selected.push(candidate);
    usedPositions.add(candidate.mainWordPosition);
    usedWords.add(candidate.word.toUpperCase());
  }

  // Second pass: fill remaining slots if needed
  for (const candidate of sorted) {
    if (selected.length >= targetCount) break;
    if (usedWords.has(candidate.word.toUpperCase())) continue;

    selected.push(candidate);
    usedWords.add(candidate.word.toUpperCase());
  }

  // Sort by position in main word for display order
  return selected.sort((a, b) => a.mainWordPosition - b.mainWordPosition);
}

// ---------------------------------------------------------------------------
// Clue Generation
// ---------------------------------------------------------------------------

/**
 * Generate clever clues for the crosser words
 * Clues should hint at both the word AND subtly connect to the theme
 */
async function generateClues(
  crossers: CrosserCandidate[],
  theme: string,
  mainWord: string,
  difficulty: number
): Promise<Map<string, string>> {
  const wordList = crossers.map((c) => c.word).join(", ");

  const difficultyGuidance =
    difficulty >= 4
      ? "Use subtle misdirection or require lateral thinking. The connection to the answer should be clear in hindsight."
      : difficulty <= 2
        ? "Be direct and evocative. Use vivid sensory language that points clearly to the answer."
        : "Balance directness with a small creative leap. The clue should be satisfying to solve.";

  const prompt = `You are a puzzle clue writer for Cluegrid, a word puzzle game.

MAIN WORD: ${mainWord} (the hidden word players are trying to guess)
THEME: ${theme}
CROSSER WORDS: ${wordList}

Write a clue for each crosser word. Each clue should:
1. Point clearly to the crosser word as the answer
2. Subtly connect to or evoke the theme "${theme}" (but don't mention the theme directly)
3. Be 10-25 words long
4. Use vivid, sensory language when possible
5. ${difficultyGuidance}

Example good clues:
- For CORAL with theme "Ocean Life": "The hard, colorful structures that tiny sea creatures build over centuries."
- For ARROW with theme "Hunting": "What a bow releases toward its target, seeking the mark."
- For STORM with theme "Weather": "Dark clouds, wind, and heavy rain all arriving at once."

Respond with a JSON object:
{
  "clues": [
    {
      "word": "WORD1",
      "clue": "The clue text here.",
      "themeConnection": "Brief explanation of how it connects to theme"
    }
  ]
}

Return ONLY valid JSON, no markdown code blocks.`;

  const anthropic = getAnthropicClient();
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2000,
    messages: [{ role: "user", content: prompt }],
  });

  const textContent = response.content.find((block) => block.type === "text");
  if (!textContent || textContent.type !== "text") {
    throw new Error("No text response from Claude API");
  }

  let parsed: {
    clues: Array<{ word: string; clue: string; themeConnection?: string }>;
  };
  try {
    parsed = JSON.parse(textContent.text);
  } catch {
    const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      parsed = JSON.parse(jsonMatch[0]);
    } else {
      throw new Error(`Failed to parse clues response: ${textContent.text}`);
    }
  }

  const clueMap = new Map<string, string>();
  for (const item of parsed.clues) {
    clueMap.set(item.word.toUpperCase(), item.clue);
  }

  return clueMap;
}

// ---------------------------------------------------------------------------
// Puzzle Assembly
// ---------------------------------------------------------------------------

/**
 * Assemble the final puzzle from components
 */
function assemblePuzzle(
  mainWord: string,
  crossers: CrosserCandidate[],
  clues: Map<string, string>,
  options: GenerateOptions
): PuzzleData {
  const puzzleCrossers: Crosser[] = crossers.map((candidate) => {
    const clue = clues.get(candidate.word.toUpperCase());
    if (!clue) {
      throw new Error(`Missing clue for word: ${candidate.word}`);
    }

    return {
      word: candidate.word.toUpperCase(),
      clue,
      position: candidate.mainWordPosition,
      intersectionIndex: candidate.crosserPosition,
    };
  });

  // Calculate difficulty based on crosser count and word obscurity
  const difficulty =
    options.difficulty ??
    Math.max(1, Math.min(5, 6 - puzzleCrossers.length));

  return {
    date: options.date || new Date().toISOString().split("T")[0]!,
    mainWord: mainWord.toUpperCase(),
    difficulty,
    crossers: puzzleCrossers,
    theme: options.theme,
    notes: `Generated with AI. Theme: ${options.theme}`,
  };
}

// ---------------------------------------------------------------------------
// Main Generation Function
// ---------------------------------------------------------------------------

/**
 * Generate a complete puzzle
 */
export async function generatePuzzle(
  options: GenerateOptions
): Promise<PuzzleData> {
  const crosserCount = options.crosserCount ?? DEFAULT_CROSSER_COUNT;
  const difficulty = options.difficulty ?? DEFAULT_DIFFICULTY;

  console.log(`\n=== Cluegrid Puzzle Generator ===`);
  console.log(`Theme: ${options.theme}`);
  console.log(`Difficulty: ${difficulty}`);
  console.log(`Crossers: ${crosserCount}`);

  // Step 1: Get or generate main word
  console.log(`\n[1/4] Getting main word...`);
  const mainWord = await getMainWord(
    options.theme,
    options.mainWord,
    difficulty
  );
  console.log(`  Main word: ${mainWord}`);

  // Step 2: Find crosser candidates
  console.log(`\n[2/4] Finding crosser candidates...`);
  const candidateResult = await findCrosserCandidates(mainWord, options.theme);
  console.log(`  Found ${candidateResult.candidates.length} candidates`);

  if (candidateResult.candidates.length < crosserCount) {
    console.warn(
      `  Warning: Only found ${candidateResult.candidates.length} candidates, wanted ${crosserCount}`
    );
  }

  // Step 3: Select best crossers
  console.log(`\n[3/4] Selecting best crossers...`);
  const selectedCrossers = selectBestCrossers(
    candidateResult.candidates,
    mainWord,
    crosserCount
  );

  // Validate intersections
  for (const crosser of selectedCrossers) {
    const valid = validateIntersection(
      mainWord,
      crosser.word,
      crosser.mainWordPosition,
      crosser.crosserPosition
    );
    if (!valid) {
      throw new Error(
        `Invalid intersection: ${crosser.word} at position ${crosser.mainWordPosition}`
      );
    }
    console.log(
      `  ${crosser.word} (position ${crosser.mainWordPosition}, letter "${crosser.sharedLetter}")`
    );
  }

  // Step 4: Generate clues
  console.log(`\n[4/4] Generating clues...`);
  const clues = await generateClues(
    selectedCrossers,
    options.theme,
    mainWord,
    difficulty
  );

  for (const [word, clue] of clues) {
    console.log(`  ${word}: "${clue.substring(0, 50)}..."`);
  }

  // Assemble final puzzle
  console.log(`\n=== Puzzle Complete ===\n`);
  const puzzle = assemblePuzzle(mainWord, selectedCrossers, clues, {
    ...options,
    difficulty,
  });

  return puzzle;
}

// ---------------------------------------------------------------------------
// CLI Entry Point
// ---------------------------------------------------------------------------

function parseArgs(): GenerateOptions & { output?: string; help?: boolean } {
  const args = process.argv.slice(2);
  const options: GenerateOptions & { output?: string; help?: boolean } = {
    theme: "",
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const nextArg = args[i + 1];

    switch (arg) {
      case "--theme":
      case "-t":
        options.theme = nextArg || "";
        i++;
        break;
      case "--main-word":
      case "-m":
        options.mainWord = nextArg;
        i++;
        break;
      case "--difficulty":
      case "-d":
        options.difficulty = parseInt(nextArg || "3", 10);
        i++;
        break;
      case "--crossers":
      case "-c":
        options.crosserCount = parseInt(nextArg || "3", 10);
        i++;
        break;
      case "--date":
        options.date = nextArg;
        i++;
        break;
      case "--output":
      case "-o":
        options.output = nextArg;
        i++;
        break;
      case "--help":
      case "-h":
        options.help = true;
        break;
    }
  }

  return options;
}

function showHelp(): void {
  console.log(`
Cluegrid Puzzle Generator - AI-powered puzzle creation

Usage:
  npx tsx generate-puzzle.ts --theme <theme> [options]

Required:
  -t, --theme <theme>       Theme/category (e.g., "Ocean Life", "Food")

Options:
  -m, --main-word <word>    Specify main word (otherwise AI generates one)
  -d, --difficulty <1-5>    Difficulty rating (default: 3)
  -c, --crossers <num>      Number of crosser words (default: 3)
  --date <YYYY-MM-DD>       Scheduled date (default: today)
  -o, --output <file>       Output file path (default: stdout)
  -h, --help                Show this help message

Examples:
  npx tsx generate-puzzle.ts --theme "Ocean Life" --main-word "WHALE"
  npx tsx generate-puzzle.ts -t "Italian Food" -d 2 -c 4
  npx tsx generate-puzzle.ts -t Sports -m SCORE -o puzzle.json

Environment:
  ANTHROPIC_API_KEY         Required. Your Anthropic API key.
`);
}

async function main(): Promise<void> {
  const options = parseArgs();

  if (options.help) {
    showHelp();
    process.exit(0);
  }

  if (!options.theme) {
    console.error("Error: --theme is required");
    console.error("Run with --help for usage information");
    process.exit(1);
  }

  // Validate options
  if (options.difficulty && (options.difficulty < 1 || options.difficulty > 5)) {
    console.error("Error: difficulty must be between 1 and 5");
    process.exit(1);
  }

  if (
    options.crosserCount &&
    (options.crosserCount < 1 || options.crosserCount > 6)
  ) {
    console.error("Error: crossers must be between 1 and 6");
    process.exit(1);
  }

  try {
    const puzzle = await generatePuzzle(options);

    const jsonOutput = JSON.stringify(puzzle, null, 2);

    if (options.output) {
      fs.writeFileSync(options.output, jsonOutput);
      console.log(`Puzzle written to: ${options.output}`);
    } else {
      console.log("Generated Puzzle JSON:");
      console.log(jsonOutput);
    }

    // Print visual grid
    console.log("\nVisual Grid:");
    printPuzzleGrid(puzzle);
  } catch (error) {
    console.error("Error generating puzzle:", error);
    process.exit(1);
  }
}

/**
 * Print a visual representation of the puzzle grid
 */
function printPuzzleGrid(puzzle: PuzzleData): void {
  const mainWord = puzzle.mainWord;
  const gridWidth = mainWord.length;
  const maxCrosserLength = Math.max(
    ...puzzle.crossers.map((c) => c.word.length)
  );
  const gridHeight = maxCrosserLength;

  // Find where the main word row should be (middle-ish)
  const mainRow = Math.floor(gridHeight / 2);

  // Build grid
  const grid: string[][] = Array(gridHeight)
    .fill(null)
    .map(() => Array(gridWidth).fill(" "));

  // Place main word
  for (let i = 0; i < mainWord.length; i++) {
    grid[mainRow]![i] = mainWord[i]!;
  }

  // Place crossers (going down from main word)
  for (const crosser of puzzle.crossers) {
    const col = crosser.position;
    const startRow = mainRow - crosser.intersectionIndex;

    for (let i = 0; i < crosser.word.length; i++) {
      const row = startRow + i;
      if (row >= 0 && row < gridHeight) {
        grid[row]![col] = crosser.word[i]!;
      }
    }
  }

  // Print grid
  console.log("    " + Array.from({ length: gridWidth }, (_, i) => i).join("   "));
  console.log("  +" + "---+".repeat(gridWidth));
  for (let row = 0; row < gridHeight; row++) {
    const rowStr = grid[row]!.map((c) => ` ${c} `).join("|");
    const marker = row === mainRow ? "*" : " ";
    console.log(`${marker} |${rowStr}|`);
    console.log("  +" + "---+".repeat(gridWidth));
  }
  console.log("(* = main word row)\n");

  // Print clues
  console.log("Clues:");
  for (let i = 0; i < puzzle.crossers.length; i++) {
    const crosser = puzzle.crossers[i]!;
    console.log(`  ${i + 1}. ${crosser.clue}`);
    console.log(`     Answer: ${crosser.word} (intersects at position ${crosser.position})`);
  }
}

// Run CLI if this is the main module
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  main();
}
