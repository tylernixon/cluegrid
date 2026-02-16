"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MenuItem } from "./MenuItem";
import { GistLogo } from "@/components/GistLogo";

interface MenuDrawerProps {
  open: boolean;
  onClose: () => void;
  onOpenSettings: () => void;
  onOpenStats: () => void;
  onOpenHistory: () => void;
}

const drawerVariants = {
  hidden: { opacity: 0, x: "-100%" },
  visible: {
    opacity: 1,
    x: 0,
    transition: { type: "spring" as const, damping: 30, stiffness: 300 },
  },
  exit: {
    opacity: 0,
    x: "-100%",
    transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
};

// SVG icons as components for cleanliness
function ChevronLeftIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function GearIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="12" width="4" height="9" rx="1" />
      <rect x="10" y="7" width="4" height="14" rx="1" />
      <rect x="17" y="3" width="4" height="18" rx="1" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

export function MenuDrawer({
  open,
  onClose,
  onOpenSettings,
  onOpenStats,
  onOpenHistory,
}: MenuDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    if (!open) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  // Focus management: focus the drawer and trap focus when open
  useEffect(() => {
    if (!open) return;

    const timer = setTimeout(() => {
      drawerRef.current?.focus();
    }, 50);

    function handleFocusTrap(e: KeyboardEvent) {
      if (e.key !== "Tab" || !drawerRef.current) return;

      const focusable = drawerRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;

      const first = focusable[0]!;
      const last = focusable[focusable.length - 1]!;

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleFocusTrap);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("keydown", handleFocusTrap);
    };
  }, [open]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={drawerRef}
          className="fixed inset-0 z-50 w-screen h-dvh bg-canvas/80 dark:bg-canvas-dark/80 backdrop-blur-xl flex flex-col pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]"
          variants={drawerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
          tabIndex={-1}
        >
          {/* Header */}
          <header className="relative flex items-center justify-center h-14 px-4 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="absolute left-4 w-10 h-10 flex items-center justify-center text-ink-secondary dark:text-ink-secondary-dark hover:text-ink dark:hover:text-ink-dark transition-colors focus:outline-none"
              aria-label="Close menu"
            >
              <ChevronLeftIcon />
            </button>
            <GistLogo />
          </header>

          {/* Menu items */}
          <nav className="flex-1 py-4 px-4" aria-label="Main navigation">
            <MenuItem
              icon={<GearIcon />}
              label="Settings"
              onClick={() => {
                onClose();
                onOpenSettings();
              }}
            />
            <MenuItem
              icon={<ChartIcon />}
              label="Stats"
              onClick={() => {
                onClose();
                onOpenStats();
              }}
            />
            <MenuItem
              icon={<CalendarIcon />}
              label="History"
              onClick={() => {
                onClose();
                onOpenHistory();
              }}
            />
          </nav>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
