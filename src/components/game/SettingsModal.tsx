"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { DifficultySelector } from "@/components/game/DifficultySelector";
import { useGameStore } from "@/stores/gameStore";
import type { Difficulty } from "@/types";

type Theme = "light" | "dark";

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  return (localStorage.getItem("gist-theme") as Theme) || "dark";
}

function applyTheme(theme: Theme) {
  const isDark = theme === "dark";
  document.documentElement.classList.toggle("dark", isDark);
  localStorage.setItem("gist-theme", theme);
}

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
}

export function SettingsModal({ open, onClose }: SettingsModalProps) {
  const currentDifficulty = useGameStore((s) => s.difficulty);
  const setDifficulty = useGameStore((s) => s.setDifficulty);
  const resetGame = useGameStore((s) => s.resetGame);
  const mainGuessCount = useGameStore((s) => s.mainGuessCount);

  const [pendingDifficulty, setPendingDifficulty] = useState<Difficulty>(currentDifficulty);
  const hasChanged = pendingDifficulty !== currentDifficulty;

  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    setTheme(getInitialTheme());
  }, []);

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    applyTheme(newTheme);
  };

  // Reset pending state when modal opens
  const handleClose = () => {
    setPendingDifficulty(currentDifficulty);
    onClose();
  };

  const handleNewGame = () => {
    if (hasChanged) {
      setDifficulty(pendingDifficulty);
    }
    resetGame();
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose} title="Settings">
      <div className="flex flex-col flex-1">
        {/* Settings content */}
        <div className="flex-1">
          {/* Theme selector */}
          <div className="mb-6">
            <h3 className="text-body font-semibold text-ink dark:text-ink-dark mb-3">
              Theme
            </h3>
            <div className="flex gap-3">
              {(["light", "dark"] as const).map((t) => {
                const isSelected = theme === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => handleThemeChange(t)}
                    className={`relative flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 text-body font-semibold capitalize transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-correct dark:focus-visible:ring-correct-dark focus-visible:ring-offset-2 ${
                      isSelected
                        ? "bg-correct/10 dark:bg-correct-dark/10 border-correct dark:border-correct-dark text-correct dark:text-correct-dark"
                        : "border-border dark:border-border-dark hover:border-border-active dark:hover:border-border-active-dark bg-surface-raised dark:bg-surface-raised-dark text-ink dark:text-ink-dark"
                    }`}
                  >
                    {t === "light" ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="4" />
                        <path d="M12 2v2" /><path d="M12 20v2" /><path d="m4.93 4.93 1.41 1.41" /><path d="m17.66 17.66 1.41 1.41" /><path d="M2 12h2" /><path d="M20 12h2" /><path d="m6.34 17.66-1.41 1.41" /><path d="m19.07 4.93-1.41 1.41" />
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
                      </svg>
                    )}
                    {t}
                    {isSelected && (
                      <span className="absolute top-2 right-2">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Difficulty selector */}
          <div className="mb-6">
            <h3 className="text-body font-semibold text-ink dark:text-ink-dark mb-3">
              Difficulty
            </h3>
            <DifficultySelector
              selected={pendingDifficulty}
              onChange={setPendingDifficulty}
            />
          </div>

          {/* New game button (only show if difficulty changed or game in progress) */}
          {(hasChanged || mainGuessCount > 0) && (
            <div className="mb-4">
              <button
                type="button"
                onClick={handleNewGame}
                className="w-full px-6 py-3 bg-surface-raised dark:bg-surface-raised-dark text-ink dark:text-ink-dark border border-border dark:border-border-dark rounded-lg font-semibold text-body hover:bg-border/50 dark:hover:bg-border-dark/50 transition-colors active:scale-[0.97]"
              >
                {hasChanged ? "Start New Game" : "Restart Game"}
              </button>
              {hasChanged && mainGuessCount > 0 && (
                <p className="text-caption text-ink-tertiary dark:text-ink-tertiary-dark text-center mt-2">
                  Changing difficulty will reset your current game
                </p>
              )}
            </div>
          )}
        </div>

        {/* Done button at bottom */}
        <div className="mt-auto pt-6">
          <button
            type="button"
            onClick={handleClose}
            className="w-full px-6 py-3 bg-surface-raised/80 dark:bg-surface-raised-dark/80 backdrop-blur-sm text-ink dark:text-ink-dark border border-border dark:border-border-dark rounded-xl font-semibold text-body hover:bg-surface-raised dark:hover:bg-surface-raised-dark transition-all active:scale-[0.97]"
          >
            Done
          </button>
        </div>
      </div>
    </Modal>
  );
}
