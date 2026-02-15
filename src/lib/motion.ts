// Motion variants for Framer Motion animations
import type { Variants, Transition } from "framer-motion";

// ============================================
// TIMING CONSTANTS
// ============================================

// Stagger delay for sequential tile flips (150ms per tile)
export const FLIP_STAGGER_MS = 150;

// Victory wave - staggered glow with 80ms delay
export const VICTORY_STAGGER_MS = 80;

// Premium animation timings (150-300ms range)
export const TIMING = {
  fast: 0.15,      // 150ms - quick micro-interactions
  medium: 0.2,     // 200ms - standard transitions
  slow: 0.25,      // 250ms - emphasized transitions
  settle: 0.18,    // 180ms - cell settle animation
} as const;

// ============================================
// EASING CURVES
// ============================================

// Premium easing - smooth deceleration
export const EASE = {
  out: [0.22, 1, 0.36, 1],        // smooth ease-out
  inOut: [0.65, 0, 0.35, 1],     // smooth ease-in-out
  settle: [0.34, 1.02, 0.68, 1], // subtle overshoot for settle
} as const;

// ============================================
// ANIMATION VARIANTS
// ============================================

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

// Victory glow pulse animation (gentle, not bouncy)
export const victoryGlowVariants: Variants = {
  initial: {
    scale: 1,
    filter: "brightness(1)",
  },
  glow: {
    scale: [1, 1.02, 1],
    filter: ["brightness(1)", "brightness(1.15)", "brightness(1)"],
    transition: {
      duration: 0.3,
      ease: EASE.out,
    },
  },
};

// Legacy bounce variant (kept for compatibility, but replaced with glow)
export const victoryBounceVariants: Variants = {
  initial: {
    y: 0,
    scale: 1,
  },
  bounce: {
    y: [0, -3, 0],
    scale: [1, 1.02, 1],
    transition: {
      duration: 0.25,
      ease: EASE.out,
    },
  },
};

// Cell pop animation for letter entry (subtle scale)
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

// ============================================
// PREMIUM MICRO-ANIMATIONS
// ============================================

// Clue selection highlight - smooth fade in
export const clueHighlightVariants: Variants = {
  unselected: {
    backgroundColor: "rgba(0, 0, 0, 0)",
    borderLeftWidth: 2,
    borderLeftColor: "transparent",
  },
  selected: {
    backgroundColor: "rgba(var(--accent-rgb), 0.1)",
    borderLeftWidth: 2,
    borderLeftColor: "rgb(var(--accent-rgb))",
    transition: {
      duration: TIMING.fast,
      ease: EASE.out,
    },
  },
};

// Cell settle animation - subtle scale when letter fills slot
export const cellSettleVariants: Variants = {
  initial: {
    scale: 1,
  },
  settle: {
    scale: [0.95, 1.02, 1],
    transition: {
      duration: TIMING.settle,
      ease: EASE.settle,
    },
  },
};

// Crosser solved - slot locks with soft fade
export const crosserSolvedVariants: Variants = {
  unsolved: {
    opacity: 1,
  },
  solved: {
    opacity: [1, 0.85, 1],
    transition: {
      duration: TIMING.medium,
      ease: EASE.out,
    },
  },
};

// Revealed letter fade-in (intersecting letter appears)
export const revealedLetterVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.9,
  },
  revealed: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: TIMING.medium,
      ease: EASE.out,
    },
  },
};

// Grid-wide glow pulse for final word solve
export const gridGlowVariants: Variants = {
  idle: {
    boxShadow: "0 0 0 0 rgba(var(--correct-rgb), 0)",
  },
  glow: {
    boxShadow: [
      "0 0 0 0 rgba(var(--correct-rgb), 0)",
      "0 0 20px 4px rgba(var(--correct-rgb), 0.3)",
      "0 0 0 0 rgba(var(--correct-rgb), 0)",
    ],
    transition: {
      duration: 0.6,
      ease: EASE.inOut,
    },
  },
};

// Selection ring animation - smooth appear
export const selectionRingVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.98,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: TIMING.fast,
      ease: EASE.out,
    },
  },
};

// ============================================
// TRANSITION PRESETS
// ============================================

export const transitionPresets: Record<string, Transition> = {
  fast: {
    duration: TIMING.fast,
    ease: EASE.out,
  },
  medium: {
    duration: TIMING.medium,
    ease: EASE.out,
  },
  settle: {
    duration: TIMING.settle,
    ease: EASE.settle,
  },
  selection: {
    duration: TIMING.fast,
    ease: EASE.out,
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

// Cross-reveal animation (soft fade-in, no bounce)
export const crossRevealVariants: Variants = {
  initial: {
    opacity: 0,
    scale: 0.95,
  },
  reveal: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: TIMING.medium,
      ease: EASE.out,
    },
  },
};
