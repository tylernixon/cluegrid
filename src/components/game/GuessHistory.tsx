"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { Guess } from "@/types";
import { FLIP_STAGGER_MS } from "@/lib/motion";

interface GuessHistoryProps {
  guesses: Guess[];
  targetId: "main" | string;
}

export function GuessHistory({ guesses, targetId }: GuessHistoryProps) {
  const targetGuesses = guesses.filter((g) => g.targetId === targetId);
  const prefersReducedMotion = useReducedMotion();
  const [flippingTiles, setFlippingTiles] = useState<Set<string>>(new Set());
  const [revealedTiles, setRevealedTiles] = useState<Set<string>>(new Set());
  const prevGuessCount = useRef(0);

  // Track when new guesses are added to trigger flip animation
  useEffect(() => {
    if (targetGuesses.length > prevGuessCount.current) {
      const newGuessIndex = targetGuesses.length - 1;
      const guess = targetGuesses[newGuessIndex];
      if (!guess) return;

      if (prefersReducedMotion) {
        // Instantly reveal all tiles
        const newRevealed = new Set(revealedTiles);
        guess.feedback.forEach((_, i) => {
          newRevealed.add(`${newGuessIndex}-${i}`);
        });
        setRevealedTiles(newRevealed);
      } else {
        // Stagger the flip animations
        guess.feedback.forEach((_, i) => {
          const key = `${newGuessIndex}-${i}`;
          setTimeout(() => {
            setFlippingTiles((prev) => new Set(prev).add(key));
            // Reveal the color at the midpoint of the flip (250ms after starting)
            setTimeout(() => {
              setRevealedTiles((prev) => new Set(prev).add(key));
            }, 250);
            // Remove from flipping state after animation completes
            setTimeout(() => {
              setFlippingTiles((prev) => {
                const next = new Set(prev);
                next.delete(key);
                return next;
              });
            }, 500);
          }, i * FLIP_STAGGER_MS);
        });
      }
    }
    prevGuessCount.current = targetGuesses.length;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetGuesses.length, prefersReducedMotion]);

  // Initialize revealed tiles for existing guesses on mount
  useEffect(() => {
    const existing = new Set<string>();
    targetGuesses.forEach((guess, guessIndex) => {
      guess.feedback.forEach((_, letterIndex) => {
        existing.add(`${guessIndex}-${letterIndex}`);
      });
    });
    setRevealedTiles(existing);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetId]);

  if (targetGuesses.length === 0) return null;

  return (
    <div
      className="flex flex-col gap-1 items-center"
      role="list"
      aria-label="Previous guesses"
    >
      {targetGuesses.map((guess, guessIndex) => (
        <div
          key={guessIndex}
          className="flex gap-[6px]"
          role="listitem"
          aria-label={`Guess ${guessIndex + 1}: ${guess.word}`}
        >
          {guess.feedback.map((fb, letterIndex) => {
            const key = `${guessIndex}-${letterIndex}`;
            const isFlipping = flippingTiles.has(key);
            const isRevealed = revealedTiles.has(key);

            const statusClass = isRevealed
              ? fb.status === "correct"
                ? "bg-correct dark:bg-correct-dark border-correct dark:border-correct-dark"
                : fb.status === "present"
                  ? "bg-present dark:bg-present-dark border-present dark:border-present-dark"
                  : "bg-absent dark:bg-absent-dark border-absent dark:border-absent-dark"
              : "bg-surface-raised dark:bg-surface-raised-dark border-border-active dark:border-border-active-dark";

            return (
              <motion.div
                key={letterIndex}
                className={`flex items-center justify-center w-[52px] h-[52px] sm:w-[56px] sm:h-[56px] rounded-sm border-2 font-mono text-grid select-none
                  ${statusClass}
                  ${isRevealed ? "text-white" : "text-ink dark:text-ink-dark"}
                `}
                style={{
                  transformStyle: "preserve-3d",
                  perspective: "1000px",
                }}
                animate={
                  isFlipping
                    ? {
                        rotateX: [0, 90, 0],
                        transition: {
                          duration: 0.5,
                          ease: "easeInOut",
                        },
                      }
                    : {}
                }
                aria-label={`${fb.letter}, ${fb.status}`}
              >
                {fb.letter}
              </motion.div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
