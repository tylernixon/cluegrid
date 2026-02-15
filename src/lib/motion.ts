// Motion variants for Framer Motion animations
import type { Variants } from "framer-motion";

// Tile flip animation for revealing guess feedback
export const tileFlipVariants: Variants = {
  initial: {
    rotateX: 0,
    scale: 1,
  },
  flip: {
    rotateX: [0, 90, 0],
    transition: {
      duration: 0.5,
      ease: "easeInOut",
    },
  },
};

// Stagger delay for sequential tile flips (150ms per tile)
export const FLIP_STAGGER_MS = 150;

// Victory bounce animation for tiles
export const victoryBounceVariants: Variants = {
  initial: {
    y: 0,
    scale: 1,
  },
  bounce: {
    y: [0, -12, 0],
    scale: [1, 1.05, 1],
    transition: {
      duration: 0.4,
      ease: "easeOut",
    },
  },
};

// Victory wave - staggered bounce with 100ms delay
export const VICTORY_STAGGER_MS = 100;

// Cell pop animation for letter entry
export const cellPopVariants: Variants = {
  initial: {
    scale: 1,
  },
  pop: {
    scale: [1, 0.96, 1],
    transition: {
      duration: 0.08,
      ease: "easeOut",
    },
  },
};

// Shake animation for invalid guess
export const shakeVariants: Variants = {
  initial: {
    x: 0,
  },
  shake: {
    x: [0, -4, 4, -3, 3, 0],
    transition: {
      duration: 0.2,
      ease: "linear",
    },
  },
};

// Confetti particle animation
export const confettiVariants: Variants = {
  initial: () => ({
    opacity: 1,
    y: 0,
    x: 0,
    rotate: 0,
    scale: 1,
  }),
  animate: (i: number) => ({
    opacity: [1, 1, 0],
    y: [0, -100 - Math.random() * 100, 200 + Math.random() * 100],
    x: (Math.random() - 0.5) * 400,
    rotate: Math.random() * 720 - 360,
    scale: [1, 1.2, 0.8],
    transition: {
      duration: 2 + Math.random() * 0.5,
      ease: "easeOut",
      delay: i * 0.02,
    },
  }),
};

// Cross-reveal animation (letter drops into place)
export const crossRevealVariants: Variants = {
  initial: {
    y: -20,
    opacity: 0,
    scale: 0.8,
  },
  reveal: {
    y: 0,
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 20,
    },
  },
};
