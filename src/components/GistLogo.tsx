"use client";

import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";

// Final letters with their colors
const LETTERS = [
  { char: "g", color: "#4A8B6E" },  // correct (green)
  { char: "i", color: "#C4944A" },  // present (yellow)
  { char: "s", color: "#B8B0A6" },  // absent (beige)
  { char: "t", color: "#4A8B6E" },  // correct (green)
];

// Colors to cycle through during animation
const TILE_COLORS = ["#4A8B6E", "#C4944A", "#B8B0A6"];

// Characters to cycle through
const SLOT_CHARS = "abcdefghijklmnopqrstuvwxyz".split("");

interface GistLogoProps {
  className?: string;
}

function FlipTile({
  targetChar,
  targetColor,
  delay
}: {
  targetChar: string;
  targetColor: string;
  delay: number;
}) {
  // Start with target values to avoid hydration mismatch
  const [currentChar, setCurrentChar] = useState(targetChar);
  const [currentColor, setCurrentColor] = useState(targetColor);
  const [flipKey, setFlipKey] = useState(0);
  const [isSettled, setIsSettled] = useState(true);
  const hasStartedRef = useRef(false);

  useEffect(() => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;
    setIsSettled(false);

    let flipCount = 0;
    const maxFlips = 4 + Math.floor(Math.random() * 3); // 4-6 flips
    const flipInterval = 200; // ms between flips

    const startTime = Date.now();

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;

      if (elapsed < delay) {
        return; // Wait for stagger delay
      }

      flipCount++;

      if (flipCount > maxFlips) {
        // Final flip to target
        setCurrentChar(targetChar);
        setCurrentColor(targetColor);
        setFlipKey(prev => prev + 1);
        setIsSettled(true);
        clearInterval(interval);
      } else {
        // Random flip
        setCurrentChar(SLOT_CHARS[Math.floor(Math.random() * SLOT_CHARS.length)]!);
        setCurrentColor(TILE_COLORS[Math.floor(Math.random() * TILE_COLORS.length)]!);
        setFlipKey(prev => prev + 1);
      }
    }, flipInterval);

    return () => {
      clearInterval(interval);
      // Always settle on target when cleaning up
      setCurrentChar(targetChar);
      setCurrentColor(targetColor);
      setIsSettled(true);
    };
  }, [targetChar, targetColor, delay]);

  return (
    <div className="w-7 h-7" style={{ perspective: "200px" }}>
      <motion.div
        key={flipKey}
        className="w-full h-full rounded flex items-center justify-center text-white font-sans font-semibold text-lg"
        style={{ backgroundColor: currentColor }}
        initial={flipKey === 0 ? false : { rotateX: -90 }}
        animate={{ rotateX: 0 }}
        transition={{
          duration: isSettled ? 0.3 : 0.15,
          ease: "easeOut"
        }}
      >
        {currentChar}
      </motion.div>
    </div>
  );
}

export function GistLogo({ className }: GistLogoProps) {
  return (
    <h1 className={`flex gap-0.5 ${className || ""}`}>
      {LETTERS.map((letter, index) => (
        <FlipTile
          key={index}
          targetChar={letter.char}
          targetColor={letter.color}
          delay={index * 150} // Stagger start of each tile
        />
      ))}
    </h1>
  );
}
