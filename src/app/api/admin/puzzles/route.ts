import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { requireAdmin } from '@/lib/admin-auth';
import { CreatePuzzleSchema, ListPuzzlesQuerySchema } from '@/lib/validation';

// GET /api/admin/puzzles -- List all puzzles with optional filters
export async function GET(request: Request) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const queryResult = ListPuzzlesQuerySchema.safeParse({
    status: searchParams.get('status') ?? undefined,
    limit: searchParams.get('limit') ?? undefined,
    offset: searchParams.get('offset') ?? undefined,
  });

  if (!queryResult.success) {
    return NextResponse.json(
      { error: 'VALIDATION_ERROR', message: queryResult.error.issues[0]?.message ?? 'Invalid query params' },
      { status: 400 },
    );
  }

  const { status, limit, offset } = queryResult.data;

  // Build query
  let query = supabase
    .from('puzzles')
    .select('id, puzzle_date, main_word, status, difficulty_rating, author, created_at, updated_at', { count: 'exact' })
    .order('puzzle_date', { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) {
    query = query.eq('status', status);
  }

  const { data: puzzles, count, error } = await query;

  if (error) {
    return NextResponse.json(
      { error: 'SERVER_ERROR', message: 'Failed to fetch puzzles' },
      { status: 500 },
    );
  }

  // Fetch crosser counts for each puzzle
  const puzzleIds = (puzzles ?? []).map((p) => p.id as string);
  let crosserCounts: Record<string, number> = {};

  if (puzzleIds.length > 0) {
    const { data: crosserData } = await supabase
      .from('crossers')
      .select('puzzle_id')
      .in('puzzle_id', puzzleIds);

    crosserCounts = (crosserData ?? []).reduce<Record<string, number>>((acc, c) => {
      const pid = c.puzzle_id as string;
      acc[pid] = (acc[pid] ?? 0) + 1;
      return acc;
    }, {});
  }

  const formattedPuzzles = (puzzles ?? []).map((p) => ({
    id: p.id,
    date: p.puzzle_date,
    mainWord: p.main_word,
    status: p.status,
    difficultyRating: p.difficulty_rating,
    author: p.author,
    crosserCount: crosserCounts[p.id as string] ?? 0,
    createdAt: p.created_at,
    updatedAt: p.updated_at,
  }));

  return NextResponse.json({
    puzzles: formattedPuzzles,
    total: count ?? 0,
    limit,
    offset,
  });
}

// POST /api/admin/puzzles -- Create a new puzzle
export async function POST(request: Request) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'INVALID_JSON', message: 'Request body must be valid JSON' },
      { status: 400 },
    );
  }

  const result = CreatePuzzleSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: 'VALIDATION_ERROR', message: result.error.issues[0]?.message ?? 'Invalid input' },
      { status: 400 },
    );
  }

  const input = result.data;

  // Check for date conflict
  const { data: existing } = await supabase
    .from('puzzles')
    .select('id')
    .eq('puzzle_date', input.date)
    .single();

  if (existing) {
    return NextResponse.json(
      { error: 'DUPLICATE_DATE', message: `A puzzle already exists for ${input.date}` },
      { status: 409 },
    );
  }

  // Insert puzzle
  const { data: puzzle, error: puzzleError } = await supabase
    .from('puzzles')
    .insert({
      puzzle_date: input.date,
      main_word: input.mainWord,
      main_word_row: input.mainWordRow,
      main_word_col: input.mainWordCol,
      grid_rows: input.gridRows,
      grid_cols: input.gridCols,
      status: input.status,
      difficulty_rating: input.difficultyRating ?? null,
      author: input.author ?? null,
      notes: input.notes ?? null,
    })
    .select('id, puzzle_date, main_word, status, created_at')
    .single();

  if (puzzleError || !puzzle) {
    return NextResponse.json(
      { error: 'SERVER_ERROR', message: 'Failed to create puzzle' },
      { status: 500 },
    );
  }

  // Insert crossers
  const crosserRows = input.crossers.map((c, i) => ({
    puzzle_id: puzzle.id,
    word: c.word,
    clue: c.clue,
    direction: c.direction,
    start_row: c.startRow,
    start_col: c.startCol,
    intersection_index: c.intersectionIndex,
    display_order: c.displayOrder ?? i + 1,
  }));

  const { error: crossersError } = await supabase
    .from('crossers')
    .insert(crosserRows);

  if (crossersError) {
    // Attempt cleanup: delete the puzzle we just created
    await supabase.from('puzzles').delete().eq('id', puzzle.id);
    return NextResponse.json(
      { error: 'SERVER_ERROR', message: 'Failed to create crossers' },
      { status: 500 },
    );
  }

  return NextResponse.json(
    {
      puzzle: {
        id: puzzle.id,
        date: puzzle.puzzle_date,
        mainWord: puzzle.main_word,
        status: puzzle.status,
        crosserCount: input.crossers.length,
        createdAt: puzzle.created_at,
      },
    },
    { status: 201 },
  );
}
