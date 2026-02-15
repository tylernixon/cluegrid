"use client";

import { useEffect, useState } from "react";

const LETTERS = [
  { char: "g", color: "#4A8B8D" },
  { char: "i", color: "#D97B5D" },
  { char: "s", color: "#E8B84A" },
  { char: "t", color: "#3D5A5E" },
];

interface GistLogoProps {
  className?: string;
}

export function GistLogo({ className }: GistLogoProps) {
  const [isAnimating, setIsAnimating] = useState(true);
  const [shuffleIndices, setShuffleIndices] = useState<number[]>([0, 1, 2, 3]);

  useEffect(() => {
    // Generate random shuffle sequence
    const shuffleSequence = () => {
      const indices = [0, 1, 2, 3];
      for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
      }
      return indices;
    };

    // Do a few shuffles before settling
    let shuffleCount = 0;
    const maxShuffles = 4;

    const shuffleInterval = setInterval(() => {
      if (shuffleCount < maxShuffles) {
        setShuffleIndices(shuffleSequence());
        shuffleCount++;
      } else {
        setShuffleIndices([0, 1, 2, 3]);
        clearInterval(shuffleInterval);
        setTimeout(() => setIsAnimating(false), 300);
      }
    }, 150);

    return () => clearInterval(shuffleInterval);
  }, []);

  return (
    <h1 className={`flex gap-0.5 ${className || ""}`}>
      {LETTERS.map((letter, index) => {
        const currentPosition = shuffleIndices.indexOf(index);
        const offset = (currentPosition - index) * 30; // 30px per position

        return (
          <span
            key={letter.char}
            className="w-7 h-7 flex items-center justify-center rounded text-white font-sans font-semibold text-lg transition-all duration-150 ease-out"
            style={{
              backgroundColor: letter.color,
              transform: isAnimating ? `translateX(${offset}px)` : "translateX(0)",
              opacity: isAnimating ? 0.8 : 1,
            }}
          >
            {letter.char}
          </span>
        );
      })}
    </h1>
  );
}
