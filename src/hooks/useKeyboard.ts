"use client";

import { useEffect, useRef } from "react";

interface UseKeyboardOptions {
  onKey: (letter: string) => void;
  onEnter: () => void;
  onBackspace: () => void;
  disabled: boolean;
}

export function useKeyboard({
  onKey,
  onEnter,
  onBackspace,
  disabled,
}: UseKeyboardOptions) {
  // Use ref to avoid stale closure issues with disabled state
  const disabledRef = useRef(disabled);
  disabledRef.current = disabled;

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (disabledRef.current) return;

      // Ignore if user is typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (e.key === "Enter") {
        e.preventDefault();
        onEnter();
      } else if (e.key === "Backspace") {
        e.preventDefault();
        onBackspace();
      } else if (e.key.length === 1 && /^[a-zA-Z]$/.test(e.key)) {
        e.preventDefault();
        onKey(e.key.toUpperCase());
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onKey, onEnter, onBackspace]);
}
