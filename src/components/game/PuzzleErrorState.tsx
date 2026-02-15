"use client";

interface PuzzleErrorStateProps {
  error: "network" | "no_puzzle" | "unknown";
  onRetry?: () => void;
}

const errorMessages = {
  network: {
    title: "Connection Error",
    message: "Couldn't load today's puzzle. Check your connection and try again.",
    showRetry: true,
  },
  no_puzzle: {
    title: "No Puzzle Today",
    message: "No puzzle available today. Come back tomorrow!",
    showRetry: false,
  },
  unknown: {
    title: "Something Went Wrong",
    message: "An unexpected error occurred. Please try again.",
    showRetry: true,
  },
};

export function PuzzleErrorState({ error, onRetry }: PuzzleErrorStateProps) {
  const { title, message, showRetry } = errorMessages[error];

  return (
    <div
      className="flex flex-col items-center justify-center gap-4 p-8 text-center"
      role="alert"
      aria-live="assertive"
    >
      {/* Error icon */}
      <div
        className="w-16 h-16 rounded-full bg-error/10 flex items-center justify-center"
        aria-hidden="true"
      >
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
          {error === "network" ? (
            <>
              <line x1="1" y1="1" x2="23" y2="23" />
              <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
              <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
              <path d="M10.71 5.05A16 16 0 0 1 22.58 9" />
              <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
              <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
              <line x1="12" y1="20" x2="12.01" y2="20" />
            </>
          ) : error === "no_puzzle" ? (
            <>
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
              <line x1="10" y1="14" x2="14" y2="14" />
            </>
          ) : (
            <>
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </>
          )}
        </svg>
      </div>

      {/* Error title */}
      <h2 className="text-heading-2 text-ink dark:text-ink-dark">{title}</h2>

      {/* Error message */}
      <p className="text-body text-ink-secondary dark:text-ink-secondary-dark max-w-sm">
        {message}
      </p>

      {/* Retry button */}
      {showRetry && onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 px-6 py-3 bg-accent dark:bg-accent-dark text-white rounded-lg font-semibold text-body hover:bg-accent-hover dark:hover:bg-accent-hover-dark transition-colors active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent dark:focus-visible:ring-accent-dark focus-visible:ring-offset-2"
        >
          Try Again
        </button>
      )}
    </div>
  );
}
