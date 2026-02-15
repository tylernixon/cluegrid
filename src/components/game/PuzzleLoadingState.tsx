"use client";

import { GridSkeleton } from "./GridSkeleton";
import { CluePanelSkeleton } from "./CluePanelSkeleton";

interface PuzzleLoadingStateProps {
  message?: string;
}

export function PuzzleLoadingState({
  message = "Loading puzzle...",
}: PuzzleLoadingStateProps) {
  return (
    <div
      className="flex flex-col items-center gap-4"
      role="status"
      aria-label={message}
      aria-busy="true"
    >
      {/* Grid skeleton */}
      <div className="flex justify-center">
        <GridSkeleton rows={5} cols={5} />
      </div>

      {/* Clue panel skeleton */}
      <CluePanelSkeleton clueCount={3} />

      {/* Loading message for screen readers */}
      <span className="sr-only">{message}</span>
    </div>
  );
}
