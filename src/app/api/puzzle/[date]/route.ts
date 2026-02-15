import { NextResponse } from 'next/server';
import { getPuzzleForDate } from '@/lib/puzzle';
import type { PuzzleData } from '@/types';

export async function GET(
  _request: Request,
  { params }: { params: { date: string } },
) {
  // Validate date format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(params.date)) {
    return NextResponse.json(
      { error: 'INVALID_DATE', message: 'Date must be YYYY-MM-DD format' },
      { status: 400 },
    );
  }

  // Fetch puzzle from database (falls back to mock if none exists)
  const puzzle: PuzzleData = await getPuzzleForDate(params.date);

  return NextResponse.json(
    { puzzle },
    {
      status: 200,
      headers: {
        // Cache for 5 minutes, revalidates on publish via revalidatePath
        'Cache-Control': 'public, max-age=300, s-maxage=300, stale-while-revalidate=60',
      },
    },
  );
}
