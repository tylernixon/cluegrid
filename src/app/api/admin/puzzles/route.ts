import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

// Use service role for admin operations
function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Missing Supabase credentials");
  }

  return createClient(url, key);
}

function isAuthenticated(request: Request): boolean {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Basic ")) return false;

  const credentials = atob(authHeader.slice(6));
  const [username, password] = credentials.split(":");

  return (
    username === process.env.ADMIN_USERNAME &&
    password === process.env.ADMIN_PASSWORD
  );
}

// GET - List all puzzles
export async function GET(request: Request) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = getServiceClient();
    const url = new URL(request.url);
    const statusFilter = url.searchParams.get("status");
    const limit = parseInt(url.searchParams.get("limit") || "50");
    const offset = parseInt(url.searchParams.get("offset") || "0");

    let query = supabase
      .from("puzzles")
      .select("*, crossers(id)", { count: "exact" })
      .order("puzzle_date", { ascending: false })
      .range(offset, offset + limit - 1);

    if (statusFilter && statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }

    const { data: puzzles, error, count } = await query;

    if (error) throw error;

    // Transform to camelCase for frontend
    const transformed = (puzzles || []).map((p: {
      id: string;
      puzzle_date: string;
      main_word: string;
      status: string;
      difficulty_rating: number | null;
      author: string | null;
      created_at: string;
      updated_at: string;
      crossers: { id: string }[];
    }) => ({
      id: p.id,
      date: p.puzzle_date,
      mainWord: p.main_word,
      status: p.status,
      difficultyRating: p.difficulty_rating,
      author: p.author,
      crosserCount: p.crossers?.length || 0,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
    }));

    return NextResponse.json({
      puzzles: transformed,
      total: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Error fetching puzzles:", error);
    return NextResponse.json(
      { error: "Failed to fetch puzzles" },
      { status: 500 }
    );
  }
}

// POST - Save a new puzzle
export async function POST(request: Request) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { puzzle, status = "draft" } = body;

    if (!puzzle) {
      return NextResponse.json(
        { error: "Puzzle data is required" },
        { status: 400 }
      );
    }

    const supabase = getServiceClient();

    // Check if a puzzle already exists for this date
    const { data: existing } = await supabase
      .from("puzzles")
      .select("id, main_word")
      .eq("puzzle_date", puzzle.date)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: `A puzzle already exists for ${puzzle.date} (${existing.main_word}). Please choose a different date or edit the existing puzzle.` },
        { status: 409 }
      );
    }

    // Calculate grid size based on puzzle
    // Need to account for crossers extending ABOVE and BELOW the main word row
    const crossersWithMetrics = puzzle.crossers.map((c: { word: string; intersectionIndex: number }) => ({
      lettersAbove: c.intersectionIndex,  // letters above main word
      lettersBelow: c.word.length - c.intersectionIndex - 1,  // letters below main word
    }));

    const maxAbove = Math.max(...crossersWithMetrics.map((c: { lettersAbove: number }) => c.lettersAbove));
    const maxBelow = Math.max(...crossersWithMetrics.map((c: { lettersBelow: number }) => c.lettersBelow));

    // Grid needs: rows above + main word row + rows below + padding
    const gridRows = maxAbove + 1 + maxBelow + 2;  // +2 for padding
    const mainWordRow = maxAbove + 1;  // Position main word so all crossers fit above
    const gridCols = puzzle.mainWord.length;

    // Insert puzzle
    const { data: savedPuzzle, error: puzzleError } = await supabase
      .from("puzzles")
      .insert({
        puzzle_date: puzzle.date,
        main_word: puzzle.mainWord,
        main_word_row: mainWordRow,
        main_word_col: 0,
        grid_rows: gridRows,
        grid_cols: gridCols,
        status,
        theme: puzzle.theme,
        theme_hint: puzzle.themeHint,
      })
      .select()
      .single();

    if (puzzleError) throw puzzleError;

    // Insert crossers
    const crossersToInsert = puzzle.crossers.map((crosser: {
      word: string;
      clue: string;
      position: number;
      intersectionIndex: number;
    }, index: number) => ({
      puzzle_id: savedPuzzle.id,
      word: crosser.word,
      clue: crosser.clue,
      direction: "down",
      start_row: mainWordRow - crosser.intersectionIndex,
      start_col: crosser.position,
      intersection_index: crosser.intersectionIndex,
      display_order: index + 1,
    }));

    const { error: crossersError } = await supabase
      .from("crossers")
      .insert(crossersToInsert);

    if (crossersError) throw crossersError;

    // Revalidate cache for this puzzle date so it appears immediately
    if (status === "published") {
      revalidatePath(`/api/puzzle/${puzzle.date}`);
      revalidatePath("/api/puzzle/today");
      revalidatePath("/");
    }

    return NextResponse.json({
      success: true,
      puzzleId: savedPuzzle.id,
      message: `Puzzle saved as ${status}`
    });
  } catch (error) {
    console.error("Error saving puzzle:", error);
    // Handle Supabase errors (which have a message property but aren't Error instances)
    const errorMessage =
      error instanceof Error ? error.message :
      (error && typeof error === 'object' && 'message' in error) ? String(error.message) :
      "Failed to save puzzle";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
