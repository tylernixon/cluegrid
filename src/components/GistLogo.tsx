"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Using game feedback colors: green (correct), yellow (present), gray (absent)
const LETTERS = [
  { char: "g", color: "#4A8B6E" },  // correct (green)
  { char: "i", color: "#C4944A" },  // present (yellow)
  { char: "s", color: "#B8B0A6" },  // absent (gray)
  { char: "t", color: "#4A8B6E" },  // correct (green)
];

// Characters to cycle through for the slot-machine effect
const SLOT_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".toLowerCase().split("");

interface GistLogoProps {
  className?: string;
}

function SlotLetter({
  targetChar,
  color,
  delay
}: {
  targetChar: string;
  color: string;
  delay: number;
}) {
  // Start with target char to avoid hydration mismatch (server/client must match)
  const [currentChar, setCurrentChar] = useState(targetChar);
  const [isSettled, setIsSettled] = useState(true);
  const hasStartedRef = useRef(false);

  useEffect(() => {
    // Only run animation on client after mount
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;
    setIsSettled(false);

    let spinCount = 0;
    const maxSpins = 8 + Math.floor(Math.random() * 4); // 8-11 spins
    const spinInterval = 60; // ms between each character change

    const startTime = Date.now();

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;

      if (elapsed < delay) {
        // Still in delay phase, show random char
        setCurrentChar(SLOT_CHARS[Math.floor(Math.random() * SLOT_CHARS.length)]!);
        return;
      }

      spinCount++;

      if (spinCount >= maxSpins) {
        // Settle on the target character
        setCurrentChar(targetChar);
        setIsSettled(true);
        clearInterval(interval);
      } else {
        // Show a random character with vertical flip
        setCurrentChar(SLOT_CHARS[Math.floor(Math.random() * SLOT_CHARS.length)]!);
      }
    }, spinInterval);

    return () => clearInterval(interval);
  }, [targetChar, delay]);

  return (
    <span
      className="w-7 h-7 flex items-center justify-center rounded text-white font-sans font-semibold text-lg overflow-hidden"
      style={{ backgroundColor: color }}
    >
      <AnimatePresence mode="popLayout">
        <motion.span
          key={currentChar + (isSettled ? "-settled" : "")}
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 20, opacity: 0 }}
          transition={{
            duration: isSettled ? 0.15 : 0.06,
            ease: isSettled ? "easeOut" : "linear"
          }}
          className="block"
        >
          {currentChar}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

export function GistLogo({ className }: GistLogoProps) {
  return (
    <h1 className={`flex gap-0.5 ${className || ""}`}>
      {LETTERS.map((letter, index) => (
        <SlotLetter
          key={letter.char}
          targetChar={letter.char}
          color={letter.color}
          delay={index * 80} // Stagger the start of each letter
        />
      ))}
    </h1>
  );
}
