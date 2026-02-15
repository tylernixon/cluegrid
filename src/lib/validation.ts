import { z } from 'zod';

// ---------------------------------------------------------------------------
// Public API schemas
// ---------------------------------------------------------------------------

/** POST /api/verify request body */
export const GuessSchema = z.object({
  puzzleId: z.string().uuid('puzzleId must be a valid UUID'),
  guess: z
    .string()
    .length(5, 'Guess must be exactly 5 letters')
    .regex(/^[A-Z]+$/, 'Guess must be uppercase letters only'),
  target: z.union([z.literal('main'), z.string().uuid('target must be "main" or a valid crosser UUID')]),
});

/** GET /api/puzzle/[date] path param */
export const DateParamSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD format');

// ---------------------------------------------------------------------------
// Admin API schemas
// ---------------------------------------------------------------------------

export const CreatePuzzleSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  mainWord: z
    .string()
    .min(3)
    .max(10)
    .regex(/^[A-Z]+$/, 'mainWord must be uppercase letters'),
  mainWordRow: z.number().int().min(0),
  mainWordCol: z.number().int().min(0).default(0),
  gridRows: z.number().int().min(3).max(10),
  gridCols: z.number().int().min(3).max(10),
  crossers: z
    .array(
      z.object({
        word: z.string().min(3).max(10).regex(/^[A-Z]+$/, 'word must be uppercase letters'),
        clue: z.string().min(3).max(500),
        direction: z.enum(['across', 'down']),
        startRow: z.number().int().min(0),
        startCol: z.number().int().min(0),
        intersectionIndex: z.number().int().min(0),
        displayOrder: z.number().int().min(0).optional(),
      }),
    )
    .min(1)
    .max(6),
  status: z.enum(['draft', 'scheduled']).default('draft'),
  difficultyRating: z.number().int().min(1).max(5).optional(),
  author: z.string().max(100).optional(),
  notes: z.string().max(2000).optional(),
});

export const UpdatePuzzleSchema = CreatePuzzleSchema.partial();

export const ListPuzzlesQuerySchema = z.object({
  status: z.enum(['draft', 'scheduled', 'published', 'archived']).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

// ---------------------------------------------------------------------------
// Inferred types
// ---------------------------------------------------------------------------

export type VerifyGuessInput = z.infer<typeof GuessSchema>;
export type CreatePuzzleInput = z.infer<typeof CreatePuzzleSchema>;
export type UpdatePuzzleInput = z.infer<typeof UpdatePuzzleSchema>;
