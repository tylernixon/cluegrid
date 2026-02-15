import * as Sentry from "@sentry/nextjs";
import type { GameStatus } from "@/types";

// ---------------------------------------------------------------------------
// Game Context Types
// ---------------------------------------------------------------------------

export interface GameContext {
  puzzleId: string;
  puzzleDate: string;
  gameState: GameStatus;
  guessCount: number;
  crossersSolved: number;
  totalCrossers: number;
}

// ---------------------------------------------------------------------------
// Error Capturing
// ---------------------------------------------------------------------------

/**
 * Capture an error with optional extra context.
 */
export function captureError(
  error: unknown,
  context?: Record<string, unknown>,
) {
  Sentry.captureException(error, { extra: context });
}

/**
 * Capture an error with game context attached.
 */
export function captureGameError(
  error: unknown,
  gameContext: GameContext,
  additionalContext?: Record<string, unknown>,
) {
  Sentry.withScope((scope) => {
    scope.setContext("game", {
      puzzle_id: gameContext.puzzleId,
      puzzle_date: gameContext.puzzleDate,
      game_state: gameContext.gameState,
      guess_count: gameContext.guessCount,
      crossers_solved: gameContext.crossersSolved,
      total_crossers: gameContext.totalCrossers,
    });

    if (additionalContext) {
      scope.setExtras(additionalContext);
    }

    Sentry.captureException(error);
  });
}

/**
 * Capture a warning-level message.
 */
export function captureMessage(
  message: string,
  context?: Record<string, unknown>,
) {
  Sentry.captureMessage(message, { extra: context, level: "warning" });
}

// ---------------------------------------------------------------------------
// User Context
// ---------------------------------------------------------------------------

/**
 * Set user-level context (anonymous ID only, no PII).
 */
export function setUser(anonymousId: string) {
  Sentry.setUser({ id: anonymousId });
}

/**
 * Clear user context (e.g. on opt-out).
 */
export function clearUser() {
  Sentry.setUser(null);
}

// ---------------------------------------------------------------------------
// Game Context Management
// ---------------------------------------------------------------------------

/**
 * Set global game context for all subsequent error reports.
 */
export function setGameContext(gameContext: Partial<GameContext>) {
  Sentry.setContext("game", {
    puzzle_id: gameContext.puzzleId,
    puzzle_date: gameContext.puzzleDate,
    game_state: gameContext.gameState,
    guess_count: gameContext.guessCount,
    crossers_solved: gameContext.crossersSolved,
    total_crossers: gameContext.totalCrossers,
  });
}

/**
 * Clear game context (e.g. when leaving game page).
 */
export function clearGameContext() {
  Sentry.setContext("game", null);
}

// ---------------------------------------------------------------------------
// Breadcrumbs
// ---------------------------------------------------------------------------

/**
 * Add breadcrumb for debugging context.
 */
export function addBreadcrumb(
  message: string,
  category: string,
  data?: Record<string, unknown>,
) {
  Sentry.addBreadcrumb({ message, category, data, level: "info" });
}

/**
 * Add game-specific breadcrumb.
 */
export function addGameBreadcrumb(
  action: "guess_submitted" | "crosser_solved" | "game_completed" | "target_selected",
  data: Record<string, unknown>,
) {
  Sentry.addBreadcrumb({
    message: `Game action: ${action}`,
    category: "game",
    data,
    level: "info",
  });
}
