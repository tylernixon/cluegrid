import { NextResponse } from "next/server";
import { generatePuzzle } from "@/lib/puzzleGenerator";
import { isAdminAuthenticated } from "@/lib/adminAuth";

export async function POST(request: Request) {
  if (!isAdminAuthenticated(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { theme, mainWord, difficulty, crosserCount, date } = body;

    if (!theme) {
      return NextResponse.json(
        { error: "Theme is required" },
        { status: 400 }
      );
    }

    const puzzle = await generatePuzzle({
      theme,
      mainWord,
      difficulty: difficulty ? parseInt(difficulty, 10) : undefined,
      crosserCount: crosserCount ? parseInt(crosserCount, 10) : undefined,
      date,
    });

    return NextResponse.json({ puzzle });
  } catch (error) {
    console.error("Puzzle generation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Generation failed" },
      { status: 500 }
    );
  }
}
