import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * GET /api/puzzles/archive
 *
 * Returns a list of dates that have published puzzles, ordered
 * chronologically.  The response also includes the earliest puzzle date so
 * the frontend calendar knows its lower bound.
 *
 * Query params:
 *   limit  – max rows to return (default 365, max 1000)
 *   offset – pagination offset (default 0)
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const limit = Math.min(
      parseInt(url.searchParams.get("limit") || "365", 10) || 365,
      1000,
    );
    const offset = parseInt(url.searchParams.get("offset") || "0", 10) || 0;

    // Fetch published puzzle dates (ascending so the first entry is the
    // earliest puzzle, which the calendar needs for its lower bound).
    const { data, error, count } = await supabase
      .from("puzzles")
      .select("puzzle_date", { count: "exact" })
      .eq("status", "published")
      .order("puzzle_date", { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    const dates: string[] = (data ?? []).map(
      (row: { puzzle_date: string }) => row.puzzle_date,
    );

    const firstPuzzleDate = dates.length > 0 ? dates[0] : null;

    return NextResponse.json(
      {
        dates,
        firstPuzzleDate,
        total: count ?? dates.length,
        limit,
        offset,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=600",
        },
      },
    );
  } catch (error) {
    console.error("Error fetching puzzle archive:", error);
    return NextResponse.json(
      { error: "Failed to fetch puzzle archive" },
      { status: 500 },
    );
  }
}
