/**
 * AI-powered puzzle generator using Claude API
 * Generates complete gist puzzles with themed crossers and clever clues
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

// ---------------------------------------------------------------------------
// New "mode-based" API types (used by /api/admin/puzzles/generate)
// ---------------------------------------------------------------------------

export interface AIGenerateRequest {
  mode: 'crossers' | 'full';
  mainWord?: string;
  theme?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  crosserCount?: number;
}

export interface AIGeneratedCrosser {
  word: string;
  clue: string;
  intersectionIndex: number;
  mainWordLetterIndex: number;
  startRow: number;
  startCol: number;
}

export interface AIGeneratedPuzzle {
  mainWord: string;
  mainWordRow: number;
  mainWordCol: number;
  gridRows: number;
  gridCols: number;
  crossers: AIGeneratedCrosser[];
  theme?: string;
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

  // Different clue styles based on difficulty
  let difficultyGuidance: string;
  let lengthGuidance: string;

  if (difficulty >= 4) {
    // Hard/Very Hard - cryptic riddle style
    difficultyGuidance = `HARD CLUE STYLE:
- Write clues that feel like riddles, not explanations
- Use ONE indirect anchor or metaphor per clue
- AVOID: dates, famous proper nouns, Wikipedia-style facts
- AVOID: "this is the thing" or definitional phrasing
- Use poetic misdirection and double meanings
- Make the solver work for it through lateral thinking

Examples of GOOD hard clues:
- PARIS: "A capital of talk, not war."
- TOKYO: "Where neon and order coexist."
- ITALY: "A boot with an empire in its shadow."
- CLAWS: "What cats keep hidden until needed."

Examples of BAD clues (too easy/explanatory):
- PARIS: "The capital of France, known for the Eiffel Tower."
- TOKYO: "Japan's largest city, home to 14 million people."`;
    lengthGuidance = "1 sentence, under 10 words";
  } else if (difficulty <= 2) {
    difficultyGuidance = "Be direct and evocative. Use vivid sensory language that paints a clear picture.";
    lengthGuidance = "1-2 sentences, 10-20 words";
  } else {
    difficultyGuidance = "Balance directness with a small creative leap. Use clever wordplay but keep it accessible.";
    lengthGuidance = "1 sentence, 8-15 words";
  }

  const prompt = `You are a puzzle clue writer for gist, a word puzzle game.

MAIN WORD: ${mainWord}
THEME: ${theme}
CROSSER WORDS: ${wordList}

Write a clue for each crosser word.

${difficultyGuidance}

LENGTH: ${lengthGuidance}

Each clue should subtly evoke the theme "${theme}" when possible.

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

// ---------------------------------------------------------------------------
// New single-call AI generation (used by /api/admin/puzzles/generate)
// ---------------------------------------------------------------------------

export async function generatePuzzleWithAI(request: AIGenerateRequest): Promise<AIGeneratedPuzzle> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY environment variable is not configured');
  }

  const client = new Anthropic({ apiKey });
  const crosserCount = Math.min(Math.max(request.crosserCount ?? 4, 3), 5);
  const difficulty = request.difficulty ?? 'medium';

  const difficultyGuidance: Record<string, string> = {
    easy: 'Write straightforward, definitional clues. Use common words (4-6 letters) that most people would know.',
    medium: 'Write clever wordplay clues in the style of NYT Monday/Tuesday crosswords. Use moderately common words (4-7 letters). Include some misdirection.',
    hard: `Write cryptic RIDDLE-style clues (not explanations). Each clue should:
- Be 1 sentence, under 10 words
- Use ONE indirect anchor or metaphor
- AVOID dates, famous proper nouns, Wikipedia facts
- AVOID "this is the thing" phrasing
- Feel like a riddle that requires lateral thinking

GOOD examples: "A capital of talk, not war." (PARIS), "Where neon and order coexist." (TOKYO), "A boot with an empire in its shadow." (ITALY)
BAD examples: "The capital of France, known for the Eiffel Tower." (too explanatory)`,
  };

  let prompt: string;

  if (request.mode === 'crossers' && request.mainWord) {
    prompt = buildCrossersPrompt(request.mainWord, crosserCount, difficulty, difficultyGuidance[difficulty] ?? '');
  } else if (request.mode === 'full' && request.theme) {
    prompt = buildFullPuzzlePrompt(request.theme, crosserCount, difficulty, difficultyGuidance[difficulty] ?? '');
  } else {
    throw new Error(
      request.mode === 'crossers'
        ? 'mainWord is required for crossers mode'
        : 'theme is required for full mode',
    );
  }

  // Use extended thinking so Opus can carefully reason through crosser placement
  const message = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 16000,
    thinking: {
      type: 'enabled',
      budget_tokens: 10000,
    },
    messages: [{ role: 'user', content: prompt }],
  });

  const textBlock = message.content.find((b) => b.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('No text response from AI');
  }

  return parseAIResponse(textBlock.text, request);
}

// ---------------------------------------------------------------------------
// Prompt builders for single-call generation
// ---------------------------------------------------------------------------

function buildCrossersPrompt(
  mainWord: string,
  crosserCount: number,
  difficulty: string,
  guidance: string,
): string {
  const upper = mainWord.toUpperCase();
  const letterList = upper.split('').map((l, i) => `  Position ${i}: "${l}"`).join('\n');

  return `You are a crossword puzzle designer for a word game called gist.

The main word is "${upper}" which is placed HORIZONTALLY on the grid. It has these letters:
${letterList}

Generate exactly ${crosserCount} crosser words that go VERTICALLY through the main word. Each crosser must:
1. Share exactly one letter with the main word at a specific position
2. Be a real, common English word (no proper nouns, no abbreviations)
3. Be between 4 and 8 letters long
4. Each crosser must intersect the main word at a DIFFERENT position (column)

Difficulty level: ${difficulty}
${guidance}

IMPORTANT RULES:
- Each crosser intersects the main word at a different letter position
- The shared letter must appear in the crosser word at the "intersectionIndex" position
- Spread crossers across different positions in the main word for visual balance
- Try to vary word lengths (mix of 4, 5, 6, 7 letter words) for visual interest

CRITICAL - AVOIDING ROW COLLISIONS:
When crossers have the same intersectionIndex, their letters appear on the same row.
If those letters spell something that looks like a word (even gibberish), it confuses players.

For example, with main word "UMAMI" at row 2:
- If CAROB (intersectionIndex=2) and BRAIN (intersectionIndex=2) both have index 2:
  - Row 0: C and B on same row → "CB" (OK)
  - Row 1: A and R on same row → "AR" (looks like a word!)
  - Row 4: O and I on same row → "OI" (looks like a word!)

To avoid this, use DIFFERENT intersectionIndex values:
- CAROB with intersectionIndex=0 starts at row 2
- BRAIN with intersectionIndex=4 starts at row -2 (or pick a different word)

Before finalizing, VERIFY that no two crossers share the same intersectionIndex value.
If they must share, ensure the resulting horizontal letter pairs don't spell anything word-like.

Respond ONLY with a JSON object in this exact format (no markdown, no explanation):
{
  "crossers": [
    {
      "word": "EXAMPLE",
      "clue": "A clever crossword-style clue",
      "intersectionIndex": 2,
      "mainWordLetterIndex": 0
    }
  ]
}

Where:
- "word" is the crosser word in uppercase
- "clue" is the clue for this word
- "intersectionIndex" is the 0-based index within the crosser word where it intersects the main word
- "mainWordLetterIndex" is the 0-based index within "${upper}" where this crosser intersects

Double-check that for each crosser: "${upper}"[mainWordLetterIndex] === crosser.word[intersectionIndex]`;
}

function buildFullPuzzlePrompt(
  theme: string,
  crosserCount: number,
  difficulty: string,
  guidance: string,
): string {
  return `You are a crossword puzzle designer for a word game called gist.

Create a complete puzzle with the theme: "${theme}"

Requirements:
1. Choose a main word (4-7 letters) related to the theme. It goes HORIZONTALLY.
2. Generate exactly ${crosserCount} crosser words that go VERTICALLY through the main word.
3. Each crosser shares exactly one letter with the main word at a specific position.
4. All words must be real, common English words (no proper nouns, no abbreviations).
5. Crosser words should be 4-8 letters long.
6. Each crosser must intersect the main word at a DIFFERENT position.
7. Crosser words should loosely relate to the theme when possible.
8. Try to vary word lengths (mix of 4, 5, 6, 7 letter words) for visual interest

CRITICAL - AVOIDING ROW COLLISIONS:
When crossers have the same intersectionIndex, their letters appear on the same row.
If those letters spell something that looks like a word (even gibberish), it confuses players.

For example, with main word at row 2:
- If two crossers both have intersectionIndex=2, they both start at row 0
- Their letters align horizontally: row 0 has letter from crosser A + letter from crosser B
- If this spells "AR", "OI", "ED" etc., players might think it's a word!

To avoid this, use DIFFERENT intersectionIndex values for each crosser.
Before finalizing, VERIFY that no two crossers share the same intersectionIndex value.
If they must share (rare), ensure the resulting horizontal letter pairs don't spell anything word-like.

Difficulty level: ${difficulty}
${guidance}

Respond ONLY with a JSON object in this exact format (no markdown, no explanation):
{
  "mainWord": "HEART",
  "crossers": [
    {
      "word": "EXAMPLE",
      "clue": "A clever crossword-style clue",
      "intersectionIndex": 2,
      "mainWordLetterIndex": 0
    }
  ]
}

Where:
- "mainWord" is the main horizontal word in uppercase
- For each crosser:
  - "word" is the crosser word in uppercase
  - "clue" is the clue for this word
  - "intersectionIndex" is the 0-based index within the crosser word where it intersects the main word
  - "mainWordLetterIndex" is the 0-based index within the main word where this crosser intersects

Double-check that for each crosser: mainWord[mainWordLetterIndex] === crosser.word[intersectionIndex]`;
}

// ---------------------------------------------------------------------------
// AI response parser
// ---------------------------------------------------------------------------

interface AICrosserRaw {
  word: string;
  clue: string;
  intersectionIndex: number;
  mainWordLetterIndex: number;
}

interface AIResponseRaw {
  mainWord?: string;
  crossers: AICrosserRaw[];
}

function parseAIResponse(text: string, request: AIGenerateRequest): AIGeneratedPuzzle {
  let jsonStr = text.trim();
  const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch?.[1]) {
    jsonStr = jsonMatch[1].trim();
  }

  let parsed: AIResponseRaw;
  try {
    parsed = JSON.parse(jsonStr) as AIResponseRaw;
  } catch {
    throw new Error('Failed to parse AI response as JSON');
  }

  const mainWord = (request.mode === 'crossers' ? request.mainWord! : parsed.mainWord ?? '').toUpperCase();
  if (!mainWord || mainWord.length < 3) {
    throw new Error('Invalid main word in AI response');
  }

  if (!Array.isArray(parsed.crossers) || parsed.crossers.length === 0) {
    throw new Error('No crossers in AI response');
  }

  const mainWordCol = 0;

  // First pass: validate crossers and find maximum intersectionIndex
  // This determines where the main word row needs to be positioned
  const validCrossers: Array<{
    word: string;
    clue: string;
    crossIdx: number;
    mainIdx: number;
  }> = [];

  for (const raw of parsed.crossers) {
    const word = raw.word.toUpperCase();
    const mainIdx = raw.mainWordLetterIndex;
    const crossIdx = raw.intersectionIndex;

    if (mainIdx < 0 || mainIdx >= mainWord.length) continue;
    if (crossIdx < 0 || crossIdx >= word.length) continue;
    if (mainWord[mainIdx] !== word[crossIdx]) continue;

    validCrossers.push({ word, clue: raw.clue, crossIdx, mainIdx });
  }

  // Calculate mainWordRow dynamically to ensure all crossers fit
  // It needs to be at least as large as the maximum intersectionIndex
  const maxIntersectionIndex = Math.max(...validCrossers.map(c => c.crossIdx), 0);
  const mainWordRow = maxIntersectionIndex + 1; // +1 so all crossers start at row 0 or later

  let maxRow = mainWordRow;
  let maxCol = mainWordCol + mainWord.length - 1;

  const crossers: AIGeneratedCrosser[] = [];

  // Second pass: calculate positions with the adjusted mainWordRow
  for (const { word, clue, crossIdx, mainIdx } of validCrossers) {
    const startCol = mainWordCol + mainIdx;
    const startRow = mainWordRow - crossIdx;
    const endRow = startRow + word.length - 1;

    maxRow = Math.max(maxRow, endRow);
    maxCol = Math.max(maxCol, startCol);

    crossers.push({
      word,
      clue,
      intersectionIndex: crossIdx,
      mainWordLetterIndex: mainIdx,
      startRow,
      startCol,
    });
  }

  if (crossers.length === 0) {
    throw new Error('No valid crossers could be placed after validation');
  }

  // Check for row collisions (crossers with same intersectionIndex)
  const intersectionIndexCounts = new Map<number, number>();
  for (const crosser of crossers) {
    const count = intersectionIndexCounts.get(crosser.intersectionIndex) ?? 0;
    intersectionIndexCounts.set(crosser.intersectionIndex, count + 1);
  }

  const duplicateIndices = Array.from(intersectionIndexCounts.entries())
    .filter((entry) => entry[1] > 1)
    .map((entry) => entry[0]);

  if (duplicateIndices.length > 0) {
    console.warn(
      `[PuzzleGenerator] Warning: ${duplicateIndices.length} intersectionIndex values are shared by multiple crossers: ${duplicateIndices.join(', ')}. This may cause horizontal letter conflicts.`
    );
  }

  return {
    mainWord,
    mainWordRow,
    mainWordCol,
    gridRows: maxRow + 1,
    gridCols: maxCol + 1,
    crossers,
    ...(request.theme ? { theme: request.theme } : {}),
  };
}
