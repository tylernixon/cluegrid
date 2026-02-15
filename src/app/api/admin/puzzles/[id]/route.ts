import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/admin-auth';
import { UpdatePuzzleSchema } from '@/lib/validation';

// Use service role for admin operations
function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error('Missing Supabase credentials');
  }

  return createClient(url, key);
}

// GET /api/admin/puzzles/[id] -- Get single puzzle with full details (including answers)
export async function GET(
  request: Request,
  { params }: { params: { id: string } },
) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  const supabase = getServiceClient();

  const { data: puzzle, error: puzzleError } = await supabase
    .from('puzzles')
    .select('*')
    .eq('id', params.id)
    .single();

  if (puzzleError || !puzzle) {
    return NextResponse.json(
      { error: 'PUZZLE_NOT_FOUND', message: 'Puzzle not found' },
      { status: 404 },
    );
  }

  const { data: crossers } = await supabase
    .from('crossers')
    .select('*')
    .eq('puzzle_id', params.id)
    .order('display_order', { ascending: true });

  return NextResponse.json({
    puzzle: {
      id: puzzle.id,
      date: puzzle.puzzle_date,
      mainWord: puzzle.main_word,
      mainWordRow: puzzle.main_word_row,
      mainWordCol: puzzle.main_word_col,
      gridRows: puzzle.grid_rows,
      gridCols: puzzle.grid_cols,
      status: puzzle.status,
      difficultyRating: puzzle.difficulty_rating,
      author: puzzle.author,
      notes: puzzle.notes,
      createdAt: puzzle.created_at,
      updatedAt: puzzle.updated_at,
      publishedAt: puzzle.published_at,
      crossers: (crossers ?? []).map((c) => ({
        id: c.id,
        word: c.word,
        clue: c.clue,
        direction: c.direction,
        startRow: c.start_row,
        startCol: c.start_col,
        intersectionIndex: c.intersection_index,
        displayOrder: c.display_order,
      })),
    },
  });
}

// PUT /api/admin/puzzles/[id] -- Update puzzle
export async function PUT(
  request: Request,
  { params }: { params: { id: string } },
) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  const supabase = getServiceClient();

  // Verify puzzle exists and is editable
  const { data: existing, error: fetchError } = await supabase
    .from('puzzles')
    .select('id, status')
    .eq('id', params.id)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json(
      { error: 'PUZZLE_NOT_FOUND', message: 'Puzzle not found' },
      { status: 404 },
    );
  }

  if (existing.status === 'published' || existing.status === 'archived') {
    return NextResponse.json(
      { error: 'IMMUTABLE_PUZZLE', message: `Cannot edit a puzzle with status "${existing.status}"` },
      { status: 409 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'INVALID_JSON', message: 'Request body must be valid JSON' },
      { status: 400 },
    );
  }

  const result = UpdatePuzzleSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: 'VALIDATION_ERROR', message: result.error.issues[0]?.message ?? 'Invalid input' },
      { status: 400 },
    );
  }

  const input = result.data;

  // Build update object (only include provided fields)
  const puzzleUpdate: Record<string, unknown> = {};
  if (input.date !== undefined) puzzleUpdate.puzzle_date = input.date;
  if (input.mainWord !== undefined) puzzleUpdate.main_word = input.mainWord;
  if (input.mainWordRow !== undefined) puzzleUpdate.main_word_row = input.mainWordRow;
  if (input.mainWordCol !== undefined) puzzleUpdate.main_word_col = input.mainWordCol;
  if (input.gridRows !== undefined) puzzleUpdate.grid_rows = input.gridRows;
  if (input.gridCols !== undefined) puzzleUpdate.grid_cols = input.gridCols;
  if (input.status !== undefined) puzzleUpdate.status = input.status;
  if (input.difficultyRating !== undefined) puzzleUpdate.difficulty_rating = input.difficultyRating;
  if (input.author !== undefined) puzzleUpdate.author = input.author;
  if (input.notes !== undefined) puzzleUpdate.notes = input.notes;

  // Update puzzle fields if any
  if (Object.keys(puzzleUpdate).length > 0) {
    const { error: updateError } = await supabase
      .from('puzzles')
      .update(puzzleUpdate)
      .eq('id', params.id);

    if (updateError) {
      return NextResponse.json(
        { error: 'SERVER_ERROR', message: 'Failed to update puzzle' },
        { status: 500 },
      );
    }
  }

  // Replace crossers if provided
  if (input.crossers !== undefined) {
    // Delete existing crossers
    const { error: deleteError } = await supabase
      .from('crossers')
      .delete()
      .eq('puzzle_id', params.id);

    if (deleteError) {
      return NextResponse.json(
        { error: 'SERVER_ERROR', message: 'Failed to update crossers' },
        { status: 500 },
      );
    }

    // Insert new crossers
    const crosserRows = input.crossers.map((c, i) => ({
      puzzle_id: params.id,
      word: c.word,
      clue: c.clue,
      direction: c.direction,
      start_row: c.startRow,
      start_col: c.startCol,
      intersection_index: c.intersectionIndex,
      display_order: c.displayOrder ?? i + 1,
    }));

    const { error: insertError } = await supabase
      .from('crossers')
      .insert(crosserRows);

    if (insertError) {
      return NextResponse.json(
        { error: 'SERVER_ERROR', message: 'Failed to insert updated crossers' },
        { status: 500 },
      );
    }
  }

  // Fetch updated puzzle for response
  const { data: updated } = await supabase
    .from('puzzles')
    .select('id, puzzle_date, main_word, status, updated_at')
    .eq('id', params.id)
    .single();

  return NextResponse.json({
    puzzle: {
      id: updated?.id,
      date: updated?.puzzle_date,
      mainWord: updated?.main_word,
      status: updated?.status,
      updatedAt: updated?.updated_at,
    },
  });
}

// DELETE /api/admin/puzzles/[id] -- Delete draft puzzle only
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } },
) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  const supabase = getServiceClient();

  // Verify puzzle exists and is a draft, get date for cache revalidation
  const { data: existing, error: fetchError } = await supabase
    .from('puzzles')
    .select('id, status, puzzle_date')
    .eq('id', params.id)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json(
      { error: 'PUZZLE_NOT_FOUND', message: 'Puzzle not found' },
      { status: 404 },
    );
  }

  if (existing.status !== 'draft') {
    return NextResponse.json(
      { error: 'CANNOT_DELETE', message: `Only draft puzzles can be deleted. This puzzle has status "${existing.status}".` },
      { status: 409 },
    );
  }

  // Cascade delete handles crossers
  const { error: deleteError } = await supabase
    .from('puzzles')
    .delete()
    .eq('id', params.id);

  if (deleteError) {
    return NextResponse.json(
      { error: 'SERVER_ERROR', message: 'Failed to delete puzzle' },
      { status: 500 },
    );
  }

  // Revalidate cache for this puzzle date
  if (existing.puzzle_date) {
    revalidatePath(`/api/puzzle/${existing.puzzle_date}`);
    revalidatePath('/api/puzzle/today');
    revalidatePath('/');
  }

  return NextResponse.json({ deleted: true, id: params.id });
}
