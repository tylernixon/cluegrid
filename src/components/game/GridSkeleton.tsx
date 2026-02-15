"use client";

import { motion, useReducedMotion, type HTMLMotionProps } from "framer-motion";

interface GridSkeletonProps {
  rows?: number;
  cols?: number;
}

export function GridSkeleton({ rows = 5, cols = 5 }: GridSkeletonProps) {
  const prefersReducedMotion = useReducedMotion();

  // Create a skeleton pattern that mimics a typical puzzle grid
  // Main word at row index 2, with some crosser cells above and below
  const getSkeletonCell = (row: number, col: number): boolean => {
    // Main word row - all cells visible
    if (row === 2) return true;
    // Crosser columns (0, 2, 3) - full vertical extent
    if (col === 0 || col === 2 || col === 3) return true;
    return false;
  };

  const shimmerAnimation: Partial<HTMLMotionProps<"div">> = prefersReducedMotion
    ? {}
    : {
        initial: { opacity: 0.5 },
        animate: {
          opacity: [0.5, 0.8, 0.5],
          transition: {
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut" as const,
          },
        },
      };

  return (
    <div
      className="inline-grid gap-[6px]"
      style={{
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gridTemplateRows: `repeat(${rows}, 1fr)`,
      }}
      role="status"
      aria-label="Loading puzzle"
      aria-busy="true"
    >
      {Array.from({ length: rows }, (_, rowIndex) =>
        Array.from({ length: cols }, (_, colIndex) => {
          const isVisible = getSkeletonCell(rowIndex, colIndex);

          if (!isVisible) {
            return (
              <div
                key={`${rowIndex}-${colIndex}`}
                className="w-[52px] h-[52px] sm:w-[56px] sm:h-[56px] md:w-[60px] md:h-[60px]"
                aria-hidden="true"
              />
            );
          }

          return (
            <motion.div
              key={`${rowIndex}-${colIndex}`}
              className="w-[52px] h-[52px] sm:w-[56px] sm:h-[56px] md:w-[60px] md:h-[60px] rounded-sm border-2 border-border dark:border-border-dark bg-surface-raised dark:bg-surface-raised-dark"
              {...shimmerAnimation}
              style={{
                animationDelay: `${(rowIndex * cols + colIndex) * 50}ms`,
              }}
              aria-hidden="true"
            />
          );
        }),
      )}
      <span className="sr-only">Loading puzzle grid...</span>
    </div>
  );
}
