import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { generatePuzzleWithAI } from '@/lib/puzzleGenerator';
import type { AIGenerateRequest } from '@/lib/puzzleGenerator';

export async function POST(request: Request) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  try {
    const body = (await request.json()) as Record<string, unknown>;

    const mode = body.mode as AIGenerateRequest['mode'] | undefined;
    if (mode !== 'crossers' && mode !== 'full') {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'mode must be "crossers" or "full"' },
        { status: 400 },
      );
    }

    if (mode === 'crossers' && (typeof body.mainWord !== 'string' || !body.mainWord)) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'mainWord is required for crossers mode' },
        { status: 400 },
      );
    }

    if (mode === 'full' && (typeof body.theme !== 'string' || !body.theme)) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'theme is required for full mode' },
        { status: 400 },
      );
    }

    const difficulty = body.difficulty as string | undefined;
    if (difficulty && !['easy', 'medium', 'hard'].includes(difficulty)) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'difficulty must be "easy", "medium", or "hard"' },
        { status: 400 },
      );
    }

    const crosserCount = typeof body.crosserCount === 'number' ? body.crosserCount : undefined;
    if (crosserCount !== undefined && (crosserCount < 3 || crosserCount > 5)) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'crosserCount must be between 3 and 5' },
        { status: 400 },
      );
    }

    const aiRequest: AIGenerateRequest = {
      mode,
      mainWord: typeof body.mainWord === 'string' ? body.mainWord : undefined,
      theme: typeof body.theme === 'string' ? body.theme : undefined,
      difficulty: difficulty as AIGenerateRequest['difficulty'],
      crosserCount,
    };

    const puzzle = await generatePuzzleWithAI(aiRequest);

    return NextResponse.json({ puzzle });
  } catch (error) {
    console.error('Puzzle generation error:', error);
    return NextResponse.json(
      { error: 'GENERATION_ERROR', message: error instanceof Error ? error.message : 'Generation failed' },
      { status: 500 },
    );
  }
}
