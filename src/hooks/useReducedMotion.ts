"use client";

import { useState, useEffect } from "react";

/**
 * Returns true when the user prefers reduced motion.
 * Use this to disable or simplify Framer Motion animations.
 */
export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mql.matches);

    function handleChange(e: MediaQueryListEvent) {
      setPrefersReducedMotion(e.matches);
    }

    mql.addEventListener("change", handleChange);
    return () => mql.removeEventListener("change", handleChange);
  }, []);

  return prefersReducedMotion;
}
