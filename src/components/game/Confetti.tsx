"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";

interface ConfettiProps {
  active: boolean;
  duration?: number;
}

interface Particle {
  id: number;
  x: number;
  color: string;
  size: number;
  rotation: number;
  delay: number;
}

const COLORS = [
  "#4A8B6E", // correct green
  "#C4944A", // present gold
  "#5B7FA6", // accent blue
  "#E86B5C", // coral red
  "#9B7ED9", // purple
];

const PARTICLE_COUNT = 50;

export function Confetti({ active, duration = 2500 }: ConfettiProps) {
  const prefersReducedMotion = useReducedMotion();
  const [isVisible, setIsVisible] = useState(false);

  const particles = useMemo<Particle[]>(() => {
    return Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
      id: i,
      x: Math.random() * 100, // percentage across screen
      color: COLORS[Math.floor(Math.random() * COLORS.length)]!,
      size: 8 + Math.random() * 8,
      rotation: Math.random() * 360,
      delay: Math.random() * 0.3,
    }));
  }, []);

  useEffect(() => {
    if (active) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [active, duration]);

  // Skip confetti animation for reduced motion preference
  if (prefersReducedMotion || !isVisible) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden z-50"
      aria-hidden="true"
    >
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute"
          style={{
            left: `${particle.x}%`,
            top: -20,
            width: particle.size,
            height: particle.size * 0.6,
            backgroundColor: particle.color,
            borderRadius: 2,
          }}
          initial={{
            y: 0,
            x: 0,
            rotate: particle.rotation,
            opacity: 1,
          }}
          animate={{
            y: [0, window.innerHeight + 50],
            x: [0, (Math.random() - 0.5) * 200],
            rotate: [particle.rotation, particle.rotation + (Math.random() > 0.5 ? 360 : -360) * 2],
            opacity: [1, 1, 1, 0],
          }}
          transition={{
            duration: 2 + Math.random() * 1,
            ease: [0.2, 0.8, 0.4, 1],
            delay: particle.delay,
          }}
        />
      ))}
    </div>
  );
}
