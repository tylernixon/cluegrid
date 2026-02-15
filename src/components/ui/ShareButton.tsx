"use client";

import { useState, useCallback } from "react";
import { shareResult } from "@/lib/shareResult";
import type { PuzzleData, Guess } from "@/types";

interface ShareButtonProps {
  puzzle: PuzzleData;
  guesses: Guess[];
  solvedWords: Set<string>;
  won: boolean;
  className?: string;
  size?: "default" | "large";
}

type ShareStatus = "idle" | "copied" | "shared" | "error";

export function ShareButton({
  puzzle,
  guesses,
  solvedWords,
  won,
  className = "",
  size = "default",
}: ShareButtonProps) {
  const [status, setStatus] = useState<ShareStatus>("idle");

  const handleShare = useCallback(async () => {
    try {
      const result = await shareResult(puzzle, guesses, solvedWords, won);
      setStatus(result);
      // Reset after 2 seconds
      setTimeout(() => setStatus("idle"), 2000);
    } catch (err) {
      // User cancelled share, don't show error
      if (err instanceof Error && err.name === "AbortError") {
        return;
      }
      setStatus("error");
      setTimeout(() => setStatus("idle"), 2000);
    }
  }, [puzzle, guesses, solvedWords, won]);

  const buttonText = () => {
    switch (status) {
      case "copied":
        return "Copied!";
      case "shared":
        return "Shared!";
      case "error":
        return "Error";
      default:
        return "Share";
    }
  };

  const sizeClasses =
    size === "large" ? "px-6 py-3 text-body" : "px-4 py-2 text-body-small";

  const statusClasses = () => {
    switch (status) {
      case "copied":
      case "shared":
        return "bg-correct dark:bg-correct-dark";
      case "error":
        return "bg-red-500 dark:bg-red-600";
      default:
        return "bg-accent dark:bg-accent-dark hover:bg-accent-hover dark:hover:bg-accent-hover-dark";
    }
  };

  return (
    <button
      type="button"
      className={`${sizeClasses} ${statusClasses()} text-white rounded-lg font-semibold transition-all active:scale-[0.97] flex items-center gap-2 ${className}`}
      onClick={handleShare}
      disabled={status !== "idle"}
      aria-label={buttonText()}
    >
      {status === "idle" && (
        <svg
          className="w-5 h-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
          <polyline points="16 6 12 2 8 6" />
          <line x1="12" y1="2" x2="12" y2="15" />
        </svg>
      )}
      {(status === "copied" || status === "shared") && (
        <svg
          className="w-5 h-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      )}
      {status === "error" && (
        <svg
          className="w-5 h-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      )}
      {buttonText()}
    </button>
  );
}
