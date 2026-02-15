/**
 * AI-powered puzzle generator using Claude API
 * Generates complete Cluegrid puzzles with themed crossers and clever clues
 */

import Anthropic from "@anthropic-ai/sdk";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GeneratedCrosser {
  word: string;
  clue: string;
  position: number;
  intersectionIndex: number;
}

export interface GeneratedPuzzle {
  date: string;
  mainWord: string;
  difficulty: number;
  crossers: GeneratedCrosser[];
  theme: string;
  themeHint?: string;
}

export interface GenerateOptions {
  theme: string;
  mainWord?: string;
  difficulty?: number;
  crosserCount?: number;
  date?: string;
}

interface CrosserCandidate {
  word: string;
  mainWordPosition: number;
  crosserPosition: number;
  sharedLetter: string;
  thematicRelevance: number;
}

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const DEFAULT_DIFFICULTY = 3;
const DEFAULT_CROSSER_COUNT = 3;
const MIN_WORD_LENGTH = 3;
const MAX_WORD_LENGTH = 7;

// ---------------------------------------------------------------------------
// Client initialization
// ---------------------------------------------------------------------------

function getAnthropicClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY environment variable is required");
  }
  return new Anthropic({ apiKey });
}

// ---------------------------------------------------------------------------
// Main Word Generation
// ---------------------------------------------------------------------------

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
// Crosser Finding
// ---------------------------------------------------------------------------

async function findCrosserCandidates(
  mainWord: string,
  theme: string
): Promise<CrosserCandidate[]> {
  const positions = Array.from({ length: mainWord.length }, (_, i) => i);

  const positionInfo = positions
    .map((pos) => {
      const letter = mainWord[pos];
      return `- Position ${pos}: letter "${letter}" - find 5-letter words that have "${letter}" somewhere in them`;
    })
    .join("\n");

  const prompt = `You are helping create a word puzzle game. Given a main word and theme, suggest crosser words.

MAIN WORD: ${mainWord}
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
      "thematicRelevance": 0.9
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

  const textContent = response.content.find((block) => block.type === "text");
  if (!textContent || textContent.type !== "text") {
    throw new Error("No text response from Claude API");
  }

  let parsed: { candidates: CrosserCandidate[] };
  try {
    parsed = JSON.parse(textContent.text);
  } catch {
    const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      parsed = JSON.parse(jsonMatch[0]);
    } else {
      throw new Error(`Failed to parse Claude response as JSON`);
    }
  }

  // Validate candidates
  const validCandidates = parsed.candidates.filter((candidate) => {
    const word = candidate.word.toUpperCase();
    const mainLetter = mainWord[candidate.mainWordPosition];
    const crosserLetter = word[candidate.crosserPosition];
    return mainLetter === crosserLetter;
  });

  validCandidates.sort((a, b) => b.thematicRelevance - a.thematicRelevance);

  return validCandidates.map((c) => ({
    word: c.word.toUpperCase(),
    mainWordPosition: c.mainWordPosition,
    crosserPosition: c.crosserPosition,
    sharedLetter: c.sharedLetter.toUpperCase(),
    thematicRelevance: c.thematicRelevance,
  }));
}

// ---------------------------------------------------------------------------
// Crosser Selection
// ---------------------------------------------------------------------------

function selectBestCrossers(
  candidates: CrosserCandidate[],
  mainWord: string,
  targetCount: number
): CrosserCandidate[] {
  const selected: CrosserCandidate[] = [];
  const usedPositions = new Set<number>();
  const usedWords = new Set<string>();

  const sorted = [...candidates].sort(
    (a, b) => b.thematicRelevance - a.thematicRelevance
  );

  // First pass: one word per position
  for (const candidate of sorted) {
    if (selected.length >= targetCount) break;
    if (usedPositions.has(candidate.mainWordPosition)) continue;
    if (usedWords.has(candidate.word.toUpperCase())) continue;

    selected.push(candidate);
    usedPositions.add(candidate.mainWordPosition);
    usedWords.add(candidate.word.toUpperCase());
  }

  // Second pass: fill remaining slots
  for (const candidate of sorted) {
    if (selected.length >= targetCount) break;
    if (usedWords.has(candidate.word.toUpperCase())) continue;

    selected.push(candidate);
    usedWords.add(candidate.word.toUpperCase());
  }

  return selected.sort((a, b) => a.mainWordPosition - b.mainWordPosition);
}

// ---------------------------------------------------------------------------
// Clue Generation
// ---------------------------------------------------------------------------

async function generateClues(
  crossers: CrosserCandidate[],
  theme: string,
  mainWord: string,
  difficulty: number
): Promise<Map<string, string>> {
  const wordList = crossers.map((c) => c.word).join(", ");

  const difficultyGuidance =
    difficulty >= 4
      ? "Use subtle misdirection or require lateral thinking."
      : difficulty <= 2
        ? "Be direct and evocative. Use vivid sensory language."
        : "Balance directness with a small creative leap.";

  const prompt = `You are a puzzle clue writer for Cluegrid, a word puzzle game.

MAIN WORD: ${mainWord}
THEME: ${theme}
CROSSER WORDS: ${wordList}

Write a clue for each crosser word. Each clue should:
1. Point clearly to the crosser word as the answer
2. Subtly connect to or evoke the theme "${theme}"
3. Be 10-25 words long
4. ${difficultyGuidance}

Respond with a JSON object:
{
  "clues": [
    {
      "word": "WORD1",
      "clue": "The clue text here."
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

  let parsed: { clues: Array<{ word: string; clue: string }> };
  try {
    parsed = JSON.parse(textContent.text);
  } catch {
    const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      parsed = JSON.parse(jsonMatch[0]);
    } else {
      throw new Error(`Failed to parse clues response`);
    }
  }

  const clueMap = new Map<string, string>();
  for (const item of parsed.clues) {
    clueMap.set(item.word.toUpperCase(), item.clue);
  }

  return clueMap;
}

// ---------------------------------------------------------------------------
// Theme Hint Generation
// ---------------------------------------------------------------------------

async function generateThemeHint(theme: string, mainWord: string): Promise<string> {
  const prompt = `Generate a short, evocative hint (3-6 words) for the theme "${theme}" that relates to the word "${mainWord}".

The hint should be poetic or playful without giving away the answer directly.

Examples:
- Theme "Beach", word "WAVES": "Where sand meets the sea"
- Theme "Kitchen", word "SPOON": "Where meals come to life"

Respond with ONLY the hint text, nothing else.`;

  const anthropic = getAnthropicClient();
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 50,
    messages: [{ role: "user", content: prompt }],
  });

  const textContent = response.content.find((block) => block.type === "text");
  if (!textContent || textContent.type !== "text") {
    return theme;
  }

  return textContent.text.trim().replace(/^["']|["']$/g, "");
}

// ---------------------------------------------------------------------------
// Main Generation Function
// ---------------------------------------------------------------------------

export async function generatePuzzle(
  options: GenerateOptions
): Promise<GeneratedPuzzle> {
  const crosserCount = options.crosserCount ?? DEFAULT_CROSSER_COUNT;
  const difficulty = options.difficulty ?? DEFAULT_DIFFICULTY;

  // Step 1: Get main word
  const mainWord = await getMainWord(
    options.theme,
    options.mainWord,
    difficulty
  );

  // Step 2: Find crosser candidates
  const candidates = await findCrosserCandidates(mainWord, options.theme);

  if (candidates.length < crosserCount) {
    throw new Error(
      `Only found ${candidates.length} valid crosser candidates, need ${crosserCount}`
    );
  }

  // Step 3: Select best crossers
  const selectedCrossers = selectBestCrossers(candidates, mainWord, crosserCount);

  // Step 4: Generate clues
  const clues = await generateClues(
    selectedCrossers,
    options.theme,
    mainWord,
    difficulty
  );

  // Step 5: Generate theme hint
  const themeHint = await generateThemeHint(options.theme, mainWord);

  // Assemble puzzle
  const puzzleCrossers: GeneratedCrosser[] = selectedCrossers.map((candidate) => {
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

  return {
    date: options.date || new Date().toISOString().split("T")[0]!,
    mainWord: mainWord.toUpperCase(),
    difficulty,
    crossers: puzzleCrossers,
    theme: options.theme,
    themeHint,
  };
}
