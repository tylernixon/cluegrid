'use client';

import React, { Component, type ReactNode } from 'react';
import * as Sentry from '@sentry/nextjs';
import type { GameContext } from '@/lib/sentry';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode | ((props: { error: Error; reset: () => void }) => ReactNode);
  gameContext?: Partial<GameContext>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// ---------------------------------------------------------------------------
// Error Boundary Component
// ---------------------------------------------------------------------------

/**
 * Error boundary that catches React errors and reports them to Sentry
 * with optional game context.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const { gameContext, onError } = this.props;

    // Report to Sentry with game context
    Sentry.withScope((scope) => {
      // Add component stack
      scope.setExtra('componentStack', errorInfo.componentStack);

      // Add game context if provided
      if (gameContext) {
        scope.setContext('game', {
          puzzle_id: gameContext.puzzleId,
          puzzle_date: gameContext.puzzleDate,
          game_state: gameContext.gameState,
          guess_count: gameContext.guessCount,
          crossers_solved: gameContext.crossersSolved,
          total_crossers: gameContext.totalCrossers,
        });

        if (gameContext.puzzleId) {
          scope.setTag('puzzle_id', gameContext.puzzleId);
        }
        if (gameContext.gameState) {
          scope.setTag('game_state', gameContext.gameState);
        }
      }

      scope.setTag('error_boundary', 'true');
      Sentry.captureException(error);
    });

    // Call custom error handler if provided
    onError?.(error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      const { fallback } = this.props;
      const { error } = this.state;

      // Custom fallback renderer
      if (typeof fallback === 'function' && error) {
        const FallbackComponent = fallback;
        return <>{FallbackComponent({ error, reset: this.handleReset })}</>;
      }

      // Custom fallback element
      if (fallback) {
        return <>{fallback}</>;
      }

      // Default fallback
      return (
        <DefaultErrorFallback
          error={error}
          onReset={this.handleReset}
        />
      );
    }

    return <>{this.props.children}</>;
  }
}

// ---------------------------------------------------------------------------
// Default Fallback UI
// ---------------------------------------------------------------------------

interface DefaultErrorFallbackProps {
  error: Error | null;
  onReset: () => void;
}

function DefaultErrorFallback({ error, onReset }: DefaultErrorFallbackProps) {
  return (
    <div className="min-h-[200px] flex items-center justify-center p-6">
      <div className="text-center max-w-sm">
        <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-error/10 flex items-center justify-center">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-error"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>

        <h3 className="text-heading-3 text-ink dark:text-ink-dark mb-2">
          Something went wrong
        </h3>

        <p className="text-body-small text-ink-secondary dark:text-ink-secondary-dark mb-4">
          {error?.message || 'An unexpected error occurred'}
        </p>

        <button
          onClick={onReset}
          className="px-4 py-2 bg-accent dark:bg-accent-dark text-white font-medium text-body-small rounded-lg hover:bg-accent-hover dark:hover:bg-accent-hover-dark transition-colors focus:outline-none focus:ring-2 focus:ring-accent/50"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Game-Specific Error Boundary
// ---------------------------------------------------------------------------

interface GameErrorBoundaryProps {
  children: ReactNode;
  puzzleId?: string;
  puzzleDate?: string;
  gameState?: 'playing' | 'won' | 'lost';
  guessCount?: number;
  crossersSolved?: number;
  totalCrossers?: number;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

/**
 * Specialized error boundary for the game area.
 * Automatically captures game context with errors.
 */
export function GameErrorBoundary({
  children,
  puzzleId,
  puzzleDate,
  gameState,
  guessCount,
  crossersSolved,
  totalCrossers,
  onError,
}: GameErrorBoundaryProps) {
  const gameContext: Partial<GameContext> = {
    puzzleId,
    puzzleDate,
    gameState,
    guessCount,
    crossersSolved,
    totalCrossers,
  };

  return (
    <ErrorBoundary
      gameContext={gameContext}
      onError={onError}
      fallback={({ error, reset }) => (
        <GameErrorFallback error={error} onReset={reset} />
      )}
    >
      {children}
    </ErrorBoundary>
  );
}

function GameErrorFallback({ error, onReset }: DefaultErrorFallbackProps) {
  return (
    <div className="min-h-[400px] flex items-center justify-center p-6 bg-surface dark:bg-surface-dark rounded-xl">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-error/10 flex items-center justify-center">
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-error"
          >
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>

        <h3 className="text-heading-2 text-ink dark:text-ink-dark mb-3">
          Oops! The puzzle broke
        </h3>

        <p className="text-body text-ink-secondary dark:text-ink-secondary-dark mb-6">
          Something unexpected happened. Your progress has been saved.
        </p>

        {process.env.NODE_ENV === 'development' && error && (
          <pre className="text-left text-caption text-error bg-error/5 p-3 rounded-lg mb-6 overflow-auto max-h-32">
            {error.message}
          </pre>
        )}

        <div className="flex flex-col gap-3">
          <button
            onClick={onReset}
            className="w-full px-4 py-3 bg-accent dark:bg-accent-dark text-white font-medium rounded-lg hover:bg-accent-hover dark:hover:bg-accent-hover-dark transition-colors focus:outline-none focus:ring-2 focus:ring-accent/50"
          >
            Try again
          </button>

          <button
            onClick={() => window.location.reload()}
            className="w-full px-4 py-3 bg-surface-raised dark:bg-surface-raised-dark text-ink dark:text-ink-dark font-medium rounded-lg border border-border dark:border-border-dark hover:border-border-active dark:hover:border-border-active-dark transition-colors focus:outline-none focus:ring-2 focus:ring-accent/50"
          >
            Reload page
          </button>
        </div>
      </div>
    </div>
  );
}
