"use client";

import { motion, useReducedMotion, type HTMLMotionProps } from "framer-motion";

interface CluePanelSkeletonProps {
  clueCount?: number;
}

export function CluePanelSkeleton({ clueCount = 3 }: CluePanelSkeletonProps) {
  const prefersReducedMotion = useReducedMotion();

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
      className="w-full max-w-[480px] mx-auto px-4 py-3"
      role="status"
      aria-label="Loading clues"
      aria-busy="true"
    >
      {/* Header skeleton */}
      <motion.div
        className="h-3 w-12 rounded bg-surface-raised dark:bg-surface-raised-dark mb-3"
        {...shimmerAnimation}
        aria-hidden="true"
      />

      {/* Clue skeletons */}
      <div className="space-y-2">
        {Array.from({ length: clueCount }, (_, i) => (
          <div key={i} className="flex gap-3 items-start px-3 py-2">
            {/* Number placeholder */}
            <motion.div
              className="w-5 h-4 rounded bg-surface-raised dark:bg-surface-raised-dark shrink-0"
              {...shimmerAnimation}
              style={{ animationDelay: `${i * 100}ms` }}
              aria-hidden="true"
            />
            {/* Clue text placeholder */}
            <div className="flex-1 space-y-1.5">
              <motion.div
                className="h-4 rounded bg-surface-raised dark:bg-surface-raised-dark"
                style={{
                  width: `${70 + Math.random() * 30}%`,
                  animationDelay: `${i * 100 + 50}ms`,
                }}
                {...shimmerAnimation}
                aria-hidden="true"
              />
              {i === 0 && (
                <motion.div
                  className="h-4 w-3/5 rounded bg-surface-raised dark:bg-surface-raised-dark"
                  {...shimmerAnimation}
                  style={{ animationDelay: "150ms" }}
                  aria-hidden="true"
                />
              )}
            </div>
          </div>
        ))}

        {/* Main word hint skeleton */}
        <div className="flex gap-3 items-start px-3 py-2">
          <motion.div
            className="w-5 h-4 rounded bg-surface-raised dark:bg-surface-raised-dark shrink-0"
            {...shimmerAnimation}
            aria-hidden="true"
          />
          <motion.div
            className="h-4 w-4/5 rounded bg-surface-raised dark:bg-surface-raised-dark"
            {...shimmerAnimation}
            aria-hidden="true"
          />
        </div>
      </div>

      <span className="sr-only">Loading clues...</span>
    </div>
  );
}
