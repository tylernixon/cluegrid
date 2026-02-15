"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { DifficultySelector } from "@/components/game/DifficultySelector";
import { useGameStore } from "@/stores/gameStore";
import type { Difficulty } from "@/types";

type Theme = "light" | "dark" | "system";

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "system";
  return (localStorage.getItem("gist-theme") as Theme) || "system";
}

function applyTheme(theme: Theme) {
  const isDark =
    theme === "dark" ||
    (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", isDark);
  if (theme === "system") {
    localStorage.removeItem("gist-theme");
  } else {
    localStorage.setItem("gist-theme", theme);
  }
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

  const [theme, setTheme] = useState<Theme>("system");

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
      <div>
        <h2 className="text-heading-2 text-ink dark:text-ink-dark mb-6">
          Settings
        </h2>

        {/* Theme selector */}
        <div className="mb-6">
          <h3 className="text-body font-semibold text-ink dark:text-ink-dark mb-3">
            Theme
          </h3>
          <div className="flex gap-2">
            {(["light", "dark", "system"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => handleThemeChange(t)}
                className={`flex-1 px-4 py-2.5 rounded-lg text-body-small font-medium capitalize transition-all ${
                  theme === t
                    ? "bg-accent dark:bg-accent-dark text-white"
                    : "bg-surface-raised dark:bg-surface-raised-dark text-ink-secondary dark:text-ink-secondary-dark hover:bg-border dark:hover:bg-border-dark"
                }`}
              >
                {t === "system" ? "Auto" : t}
              </button>
            ))}
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

        {/* New game button */}
        <button
          type="button"
          onClick={handleNewGame}
          className="w-full px-6 py-3 bg-correct dark:bg-correct-dark text-white rounded-lg font-semibold text-body hover:opacity-90 transition-colors active:scale-[0.97]"
        >
          {hasChanged ? "Start New Game" : mainGuessCount > 0 ? "Restart Game" : "Close"}
        </button>

        {hasChanged && mainGuessCount > 0 && (
          <p className="text-caption text-ink-tertiary dark:text-ink-tertiary-dark text-center mt-2">
            Changing difficulty will reset your current game
          </p>
        )}
      </div>
    </Modal>
  );
}
