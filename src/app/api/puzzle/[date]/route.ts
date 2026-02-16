import { NextResponse } from 'next/server';
import { getPuzzleForDate } from '@/lib/puzzle';
import type { PuzzleData } from '@/types';

// Force dynamic rendering to avoid stale edge cache
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  request: Request,
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

  // Always no-cache to ensure fresh data
  return NextResponse.json(
    { puzzle },
    {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    },
  );
}
