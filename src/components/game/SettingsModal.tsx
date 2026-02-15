"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { DifficultySelector } from "@/components/game/DifficultySelector";
import { useGameStore } from "@/stores/gameStore";
import type { Difficulty } from "@/types";

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
