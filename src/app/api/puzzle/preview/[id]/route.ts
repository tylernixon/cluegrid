import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use service role to access any puzzle regardless of status
function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error('Missing Supabase credentials');
  }

  return createClient(url, key);
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } },
) {
  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(params.id)) {
    return NextResponse.json(
      { error: 'INVALID_ID', message: 'Invalid puzzle ID format' },
      { status: 400 },
    );
  }

  const supabase = getServiceClient();

  // Fetch puzzle by ID (any status)
  const { data: puzzle, error: puzzleError } = await supabase
    .from('puzzles')
    .select('*')
    .eq('id', params.id)
    .single();

  if (puzzleError || !puzzle) {
    return NextResponse.json(
      { error: 'NOT_FOUND', message: 'Puzzle not found' },
      { status: 404 },
    );
  }

  // Fetch crossers
  const { data: crossers, error: crossersError } = await supabase
    .from('crossers')
    .select('*')
    .eq('puzzle_id', puzzle.id)
    .order('display_order', { ascending: true });

  if (crossersError) {
    return NextResponse.json(
      { error: 'SERVER_ERROR', message: 'Failed to fetch crossers' },
      { status: 500 },
    );
  }

  // Transform to PuzzleData format
  const puzzleData = {
    id: puzzle.id,
    date: puzzle.puzzle_date,
    mainWord: {
      word: puzzle.main_word,
      row: puzzle.main_word_row,
      col: puzzle.main_word_col,
      length: puzzle.main_word.length,
    },
    crossers: (crossers ?? []).map((c: {
      id: string;
      word: string;
      clue: string;
      start_row: number;
      start_col: number;
      intersection_index: number;
    }) => ({
      id: c.id,
      word: c.word,
      clue: c.clue,
      direction: 'down',
      startRow: c.start_row,
      startCol: c.start_col,
      intersectionIndex: c.intersection_index,
    })),
    gridSize: {
      rows: puzzle.grid_rows,
      cols: puzzle.grid_cols,
    },
    ...(puzzle.theme && { theme: puzzle.theme }),
    ...(puzzle.theme_hint && { themeHint: puzzle.theme_hint }),
    // Mark as preview so the game knows not to save stats
    isPreview: true,
  };

  return NextResponse.json(
    { puzzle: puzzleData },
    {
      status: 200,
      headers: {
        'Cache-Control': 'no-store',
      },
    },
  );
}
