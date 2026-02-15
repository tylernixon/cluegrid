import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { DateParamSchema } from '@/lib/validation';
import type { PuzzleResponse, CrosserPublic } from '@/types';

export async function GET(
  _request: Request,
  { params }: { params: { date: string } },
) {
  // 1. Validate date param
  const dateResult = DateParamSchema.safeParse(params.date);
  if (!dateResult.success) {
    return NextResponse.json(
      { error: 'INVALID_DATE', message: 'Date must be YYYY-MM-DD format' },
      { status: 400 },
    );
  }
  const date = dateResult.data;

  // 2. Reject future dates
  const today = new Date().toISOString().split('T')[0]!;
  if (date > today) {
    return NextResponse.json(
      { error: 'PUZZLE_NOT_FOUND', message: `No puzzle available for ${date}` },
      { status: 404 },
    );
  }

  // 3. Fetch puzzle using the public_puzzles view (NO answers)
  const { data: puzzle, error: puzzleError } = await supabase
    .from('public_puzzles')
    .select('id, puzzle_date, grid_rows, grid_cols, main_word_row, main_word_col, main_word_length')
    .eq('puzzle_date', date)
    .single();

  if (puzzleError || !puzzle) {
    return NextResponse.json(
      { error: 'PUZZLE_NOT_FOUND', message: `No puzzle available for ${date}` },
      { status: 404 },
    );
  }

  // 4. Fetch crossers using the public_crossers view (NO words)
  const { data: crossers, error: crossersError } = await supabase
    .from('public_crossers')
    .select('id, puzzle_id, clue, direction, start_row, start_col, word_length, display_order')
    .eq('puzzle_id', puzzle.id)
    .order('display_order', { ascending: true });

  if (crossersError) {
    return NextResponse.json(
      { error: 'SERVER_ERROR', message: 'Failed to fetch puzzle data' },
      { status: 500 },
    );
  }

  // 5. Build response -- answers structurally cannot be here
  const crosserList: CrosserPublic[] = (crossers ?? []).map((c) => ({
    id: c.id as string,
    clue: c.clue as string,
    direction: c.direction as 'down',
    length: c.word_length as number,
    startRow: c.start_row as number,
    startCol: c.start_col as number,
    displayOrder: c.display_order as number,
  }));

  const response: PuzzleResponse = {
    id: puzzle.id as string,
    date: puzzle.puzzle_date as string,
    gridSize: {
      rows: puzzle.grid_rows as number,
      cols: puzzle.grid_cols as number,
    },
    mainWordLength: puzzle.main_word_length as number,
    mainWordRow: puzzle.main_word_row as number,
    mainWordCol: puzzle.main_word_col as number,
    crossers: crosserList,
  };

  return NextResponse.json(
    { puzzle: response },
    {
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=3600',
      },
    },
  );
}
