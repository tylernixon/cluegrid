"use client";

import { useState, useCallback } from "react";
import { MenuDrawer } from "./MenuDrawer";
import { EdgeSwipeDetector } from "./EdgeSwipeDetector";

interface HamburgerMenuProps {
  onOpenSettings: () => void;
  onOpenStats: () => void;
  onOpenHistory?: () => void;
}

export function HamburgerMenu({ onOpenSettings, onOpenStats, onOpenHistory }: HamburgerMenuProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const openDrawer = useCallback(() => setDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  const handleOpenHistory = useCallback(() => {
    onOpenHistory?.();
  }, [onOpenHistory]);

  return (
    <>
      <button
        type="button"
        className="w-10 h-10 flex items-center justify-center rounded-lg text-[#4A8B8D] hover:text-[#3D5A5E] hover:bg-surface-raised dark:hover:bg-surface-raised-dark transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4A8B8D] focus-visible:ring-offset-2"
        onClick={openDrawer}
        aria-label="Open menu"
        aria-expanded={drawerOpen}
        aria-haspopup="dialog"
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      <EdgeSwipeDetector onSwipeOpen={openDrawer} disabled={drawerOpen} />

      <MenuDrawer
        open={drawerOpen}
        onClose={closeDrawer}
        onOpenSettings={onOpenSettings}
        onOpenStats={onOpenStats}
        onOpenHistory={handleOpenHistory}
      />
    </>
  );
}
