"use client";

import { motion } from "framer-motion";
import type { Guess } from "@/types";
import { GistLogo } from "@/components/GistLogo";
import { FLIP_STAGGER_MS } from "@/lib/motion";
import { useEffect, useState, useRef } from "react";

interface HeaderFeedbackProps {
  guesses: Guess[];
  selectedTarget: "main" | string;
}

export function HeaderFeedback({ guesses, selectedTarget }: HeaderFeedbackProps) {
  const targetGuesses = guesses.filter((g) => g.targetId === selectedTarget);
  const latestGuess = targetGuesses[targetGuesses.length - 1];

  const [flippingTiles, setFlippingTiles] = useState<Set<number>>(new Set());
  const [revealedTiles, setRevealedTiles] = useState<Set<number>>(new Set());
  const prevGuessRef = useRef<string | null>(null);

  // Trigger flip animation when a new guess is made
  useEffect(() => {
    if (!latestGuess) {
      prevGuessRef.current = null;
      setRevealedTiles(new Set());
      setFlippingTiles(new Set());
      return;
    }

    const guessKey = `${latestGuess.targetId}-${latestGuess.word}`;
    if (guessKey === prevGuessRef.current) return;

    prevGuessRef.current = guessKey;

    // Reset and animate new guess
    setRevealedTiles(new Set());
    setFlippingTiles(new Set());

    // Stagger the flip animations
    latestGuess.feedback.forEach((_, i) => {
      setTimeout(() => {
        setFlippingTiles((prev) => new Set(prev).add(i));
        // Reveal the color at the midpoint of the flip
        setTimeout(() => {
          setRevealedTiles((prev) => new Set(prev).add(i));
        }, 200);
        // Remove from flipping state after animation completes
        setTimeout(() => {
          setFlippingTiles((prev) => {
            const next = new Set(prev);
            next.delete(i);
            return next;
          });
        }, 400);
      }, i * FLIP_STAGGER_MS);
    });
  }, [latestGuess]);

  // No guesses for this target - show the animated logo
  if (!latestGuess) {
    return <GistLogo />;
  }

  return (
    <div className="flex flex-col items-center gap-0">
      {/* Small gist text above feedback */}
      <span className="text-[10px] font-medium tracking-wider text-ink-tertiary dark:text-ink-tertiary-dark">
        gist
      </span>

      {/* Feedback tiles */}
      <div className="flex gap-0.5">
        {latestGuess.feedback.map((fb, i) => {
          const isFlipping = flippingTiles.has(i);
          const isRevealed = revealedTiles.has(i);

          const bgColor = isRevealed
            ? fb.status === "correct"
              ? "bg-correct dark:bg-correct-dark"
              : fb.status === "present"
                ? "bg-present dark:bg-present-dark"
                : "bg-absent dark:bg-absent-dark"
            : "bg-surface-raised dark:bg-surface-raised-dark";

          const textColor = isRevealed
            ? "text-white"
            : "text-ink dark:text-ink-dark";

          return (
            <motion.span
              key={`${i}-${fb.letter}`}
              className={`w-7 h-7 flex items-center justify-center rounded text-sm font-mono font-semibold ${bgColor} ${textColor}`}
              style={{
                transformStyle: "preserve-3d",
              }}
              animate={
                isFlipping
                  ? {
                      rotateX: [0, 90, 0],
                      transition: {
                        duration: 0.4,
                        ease: "easeInOut",
                      },
                    }
                  : {}
              }
            >
              {fb.letter}
            </motion.span>
          );
        })}
      </div>
    </div>
  );
}
