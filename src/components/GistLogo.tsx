"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Brand gradient: blue → green → yellow (green centered)
const BRAND_GRADIENT = "linear-gradient(135deg, #5B7FA6 0%, #4A8B6E 50%, #C9A227 100%)";

const LETTERS = [
  { char: "g" },
  { char: "i" },
  { char: "s" },
  { char: "t" },
];

// Characters to cycle through for the slot-machine effect
const SLOT_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".toLowerCase().split("");

interface GistLogoProps {
  className?: string;
}

function SlotLetter({
  targetChar,
  delay
}: {
  targetChar: string;
  delay: number;
}) {
  // Start with target char to avoid hydration mismatch (server/client must match)
  const [currentChar, setCurrentChar] = useState(targetChar);
  const [isSettled, setIsSettled] = useState(true);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    // Only run animation on client after mount
    if (hasStarted) return;
    setHasStarted(true);
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
  }, [targetChar, delay, hasStarted]);

  return (
    <span
      className="w-7 h-7 flex items-center justify-center rounded text-white font-sans font-semibold text-lg overflow-hidden"
      style={{ background: BRAND_GRADIENT }}
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
          delay={index * 80} // Stagger the start of each letter
        />
      ))}
    </h1>
  );
}
