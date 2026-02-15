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

    const { data: puzzles, error } = await supabase
      .from("puzzles")
      .select("*")
      .order("puzzle_date", { ascending: false })
      .limit(50);

    if (error) throw error;

    return NextResponse.json({ puzzles });
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

    // Calculate grid size based on puzzle
    const maxCrosserLength = Math.max(...puzzle.crossers.map((c: { word: string }) => c.word.length));
    const gridRows = maxCrosserLength + 2;
    const gridCols = puzzle.mainWord.length;

    // Insert puzzle
    const { data: savedPuzzle, error: puzzleError } = await supabase
      .from("puzzles")
      .insert({
        puzzle_date: puzzle.date,
        main_word: puzzle.mainWord,
        main_word_row: Math.floor(gridRows / 2),
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
      start_row: Math.floor(gridRows / 2) - crosser.intersectionIndex,
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
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save puzzle" },
      { status: 500 }
    );
  }
}
