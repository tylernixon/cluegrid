import { NextResponse } from 'next/server';
import { getPuzzleForDate } from '@/lib/puzzle';
import type { PuzzleData } from '@/types';

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

  // Check for cache-bust query param
  const url = new URL(request.url);
  const bustCache = url.searchParams.has('bust');

  // Fetch puzzle from database (falls back to mock if none exists)
  const puzzle: PuzzleData = await getPuzzleForDate(params.date);

  // If bust param is present, don't cache
  const cacheHeaders = bustCache
    ? { 'Cache-Control': 'no-store, no-cache, must-revalidate' }
    : { 'Cache-Control': 'public, max-age=300, s-maxage=300, stale-while-revalidate=60' };

  return NextResponse.json(
    { puzzle },
    {
      status: 200,
      headers: cacheHeaders,
    },
  );
}
