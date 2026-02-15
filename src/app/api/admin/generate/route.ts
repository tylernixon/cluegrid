import { NextResponse } from "next/server";
import { generatePuzzle } from "@/lib/puzzleGenerator";

// Simple auth check (use proper auth in production)
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

export async function POST(request: Request) {
  if (!isAuthenticated(request)) {
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
