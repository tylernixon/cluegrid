import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { GuessSchema } from '@/lib/validation';
import { computeFeedback } from '@/lib/feedback';
import type { RevealedLetter, VerifyResponse } from '@/types';

export async function POST(request: Request) {
  // 1. Parse and validate request body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'INVALID_JSON', message: 'Request body must be valid JSON' },
      { status: 400 },
    );
  }

  const result = GuessSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: 'VALIDATION_ERROR', message: result.error.issues[0]?.message ?? 'Invalid input' },
      { status: 400 },
    );
  }

  const { puzzleId, guess, target } = result.data;

  // 2. Check if word exists in dictionary
  const { count: wordCount, error: wordError } = await supabase
    .from('words')
    .select('word', { count: 'exact', head: true })
    .eq('word', guess)
    .eq('is_valid_guess', true);

  if (wordError) {
    return NextResponse.json(
      { error: 'SERVER_ERROR', message: 'Failed to validate word' },
      { status: 500 },
    );
  }

  if ((wordCount ?? 0) === 0) {
    return NextResponse.json(
      {
        valid: false,
        isWord: false,
        feedback: [],
        solved: false,
        revealedLetters: [],
        gameOver: false,
        won: false,
        error: 'INVALID_WORD',
        message: 'Not in word list',
      } satisfies VerifyResponse & { error: string; message: string },
      { status: 400 },
    );
  }

  // 3. Fetch puzzle answers (server-side only, uses base tables)
  const { data: puzzle, error: puzzleError } = await supabase
    .from('puzzles')
    .select('id, main_word, main_word_row, main_word_col, grid_rows, grid_cols, status')
    .eq('id', puzzleId)
    .single();

  if (puzzleError || !puzzle) {
    return NextResponse.json(
      { error: 'PUZZLE_NOT_FOUND', message: 'Puzzle not found' },
      { status: 404 },
    );
  }

  if (puzzle.status !== 'published') {
    return NextResponse.json(
      { error: 'PUZZLE_NOT_FOUND', message: 'Puzzle not found' },
      { status: 404 },
    );
  }

  const { data: crossers, error: crossersError } = await supabase
    .from('crossers')
    .select('id, word, direction, start_row, start_col, intersection_index, display_order')
    .eq('puzzle_id', puzzleId)
    .order('display_order', { ascending: true });

  if (crossersError) {
    return NextResponse.json(
      { error: 'SERVER_ERROR', message: 'Failed to fetch puzzle data' },
      { status: 500 },
    );
  }

  // 4. Determine the target word
  let targetWord: string;
  let targetCrosser: typeof crossers[number] | null = null;

  if (target === 'main') {
    targetWord = puzzle.main_word as string;
  } else {
    targetCrosser = (crossers ?? []).find((c) => c.id === target) ?? null;
    if (!targetCrosser) {
      return NextResponse.json(
        { error: 'INVALID_TARGET', message: 'Target crosser not found' },
        { status: 400 },
      );
    }
    targetWord = targetCrosser.word as string;
  }

  // 5. Validate guess length matches target word length
  if (guess.length !== targetWord.length) {
    return NextResponse.json(
      {
        valid: false,
        isWord: true,
        feedback: [],
        solved: false,
        revealedLetters: [],
        gameOver: false,
        won: false,
        error: 'INVALID_LENGTH',
        message: `Guess must be ${targetWord.length} letters`,
      },
      { status: 400 },
    );
  }

  // 6. Compute feedback
  const feedback = computeFeedback(guess, targetWord);
  const solved = feedback.every((f) => f.status === 'correct');

  // 7. Compute revealed letters if a crosser was solved
  const revealedLetters: RevealedLetter[] = [];

  if (solved && target !== 'main' && targetCrosser) {
    // When a crosser is solved, reveal the letter where it intersects the main word
    const intersectionIdx = targetCrosser.intersection_index as number;
    const crosserStartRow = targetCrosser.start_row as number;
    const crosserStartCol = targetCrosser.start_col as number;
    const direction = targetCrosser.direction as string;

    let revealRow: number;
    let revealCol: number;

    if (direction === 'down') {
      revealRow = crosserStartRow + intersectionIdx;
      revealCol = crosserStartCol;
    } else {
      revealRow = crosserStartRow;
      revealCol = crosserStartCol + intersectionIdx;
    }

    const revealedLetter = targetWord[intersectionIdx];
    if (revealedLetter) {
      revealedLetters.push({
        row: revealRow,
        col: revealCol,
        letter: revealedLetter,
        source: targetCrosser.id as string,
      });
    }
  }

  // 8. Determine game-over status
  // Note: The server is stateless -- it doesn't track guess count per session.
  // The client tracks total guesses and sends the count context.
  // However, for the MVP, the server validates each guess independently.
  // Game-over logic (won/lost after N guesses) is managed client-side.
  // The server returns whether THIS guess solved the target.
  //
  // If the main word is solved, the game is won.
  const gameWon = solved && target === 'main';

  const response: VerifyResponse = {
    valid: true,
    isWord: true,
    feedback,
    solved,
    revealedLetters,
    gameOver: gameWon, // Client manages loss detection based on guess count
    won: gameWon,
  };

  return NextResponse.json(response, { status: 200 });
}
