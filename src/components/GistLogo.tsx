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

// Characters to cycle through (in order, like a slot machine)
const SLOT_CHARS = "abcdefghijklmnopqrstuvwxyz";

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
  const [displayChar, setDisplayChar] = useState(targetChar);
  const [displayColor, setDisplayColor] = useState(targetColor);
  const [isSettled, setIsSettled] = useState(true);
  const hasAnimatedRef = useRef(false);

  useEffect(() => {
    if (hasAnimatedRef.current) return;
    hasAnimatedRef.current = true;

    // Find target index in alphabet
    const targetIndex = SLOT_CHARS.indexOf(targetChar);
    if (targetIndex === -1) return;

    // Start animation after delay
    const startTimer = setTimeout(() => {
      setIsSettled(false);

      // Cycle through characters like a slot machine
      // Start a few characters before the target and spin through
      const cycleCount = targetIndex + 26; // Full alphabet + position
      let currentStep = 0;

      const spinInterval = setInterval(() => {
        currentStep++;
        const charIndex = currentStep % 26;
        setDisplayChar(SLOT_CHARS[charIndex]!);

        // Randomly vary the color while spinning
        const colorIndex = currentStep % 3;
        setDisplayColor(["#4A8B6E", "#C4944A", "#B8B0A6"][colorIndex]!);

        if (currentStep >= cycleCount) {
          // Settle on target
          clearInterval(spinInterval);
          setDisplayChar(targetChar);
          setDisplayColor(targetColor);
          setIsSettled(true);
        }
      }, 50); // Fast spin

      return () => clearInterval(spinInterval);
    }, delay);

    return () => clearTimeout(startTimer);
  }, [targetChar, targetColor, delay]);

  return (
    <div
      className="relative overflow-hidden flex items-center justify-center"
      style={{
        width: "1.75rem",
        height: "1.75rem",
        perspective: "400px",
      }}
    >
      {/* Split-flap divider line */}
      <div
        className="absolute inset-x-0 top-1/2 h-[1px] pointer-events-none z-10"
        style={{
          backgroundColor: "rgba(0,0,0,0.15)",
          transform: "translateY(-0.5px)"
        }}
      />

      <motion.div
        key={displayChar}
        className="w-full h-full rounded flex items-center justify-center text-white font-sans font-semibold text-lg"
        style={{
          backgroundColor: displayColor,
        }}
        initial={{ rotateX: -90, opacity: 0.8 }}
        animate={{ rotateX: 0, opacity: 1 }}
        transition={{
          rotateX: { duration: isSettled ? 0.35 : 0.08, ease: "easeOut" },
          opacity: { duration: 0.1 },
        }}
      >
        {displayChar}
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
          delay={index * 200} // Stagger start of each tile
        />
      ))}
    </h1>
  );
}
