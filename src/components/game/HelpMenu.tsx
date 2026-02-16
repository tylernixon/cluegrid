"use client";

import { useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";

interface HelpMenuProps {
  open: boolean;
  onClose: () => void;
  onViewTutorial: () => void;
  onStartWalkthrough: () => void;
}

export function HelpMenu({ open, onClose, onViewTutorial, onStartWalkthrough }: HelpMenuProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  // Close on escape and trap focus
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }

      if (e.key === "Tab" && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
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
    };
    window.addEventListener("keydown", handleKeyDown);

    // Focus the first button after opening
    const timer = setTimeout(() => {
      const firstBtn = dialogRef.current?.querySelector<HTMLElement>("button");
      firstBtn?.focus();
    }, 100);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      clearTimeout(timer);
    };
  }, [open, onClose]);

  const handleViewTutorial = useCallback(() => {
    onClose();
    onViewTutorial();
  }, [onClose, onViewTutorial]);

  const handleStartWalkthrough = useCallback(() => {
    onClose();
    onStartWalkthrough();
  }, [onClose, onStartWalkthrough]);

  if (!open) return null;

  const helpContent = (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-50 bg-black/40 dark:bg-black/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Action sheet */}
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-50 px-4"
            style={{
              paddingBottom: 'max(env(safe-area-inset-bottom), 16px)',
            }}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          >
            <div
              ref={dialogRef}
              className="w-full max-w-[400px] mx-auto bg-surface dark:bg-surface-dark rounded-2xl shadow-lg overflow-hidden"
              role="dialog"
              aria-modal="true"
              aria-label="Help options"
            >
              {/* Handle bar */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-border-active dark:bg-border-active-dark" />
              </div>

              {/* Title */}
              <div className="px-5 pt-2 pb-3">
                <h2 className="text-heading-3 text-ink dark:text-ink-dark text-center">
                  Help
                </h2>
              </div>

              {/* Options */}
              <div className="px-4 pb-4 space-y-2">
                <button
                  type="button"
                  onClick={handleViewTutorial}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-surface-raised dark:bg-surface-raised-dark hover:bg-border/30 dark:hover:bg-border-dark/30 transition-colors text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4A8B8D]"
                >
                  <span className="w-10 h-10 flex items-center justify-center rounded-lg bg-accent/10 dark:bg-accent-dark/10 text-accent dark:text-accent-dark shrink-0">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                    </svg>
                  </span>
                  <div>
                    <div className="text-body-small font-semibold text-ink dark:text-ink-dark">
                      View Tutorial
                    </div>
                    <div className="text-caption text-ink-secondary dark:text-ink-secondary-dark">
                      Review how to play
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={handleStartWalkthrough}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-surface-raised dark:bg-surface-raised-dark hover:bg-border/30 dark:hover:bg-border-dark/30 transition-colors text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4A8B8D]"
                >
                  <span className="w-10 h-10 flex items-center justify-center rounded-lg bg-present/10 dark:bg-present-dark/10 text-present dark:text-present-dark shrink-0">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <polygon points="10 8 16 12 10 16 10 8" />
                    </svg>
                  </span>
                  <div>
                    <div className="text-body-small font-semibold text-ink dark:text-ink-dark">
                      Interactive Walkthrough
                    </div>
                    <div className="text-caption text-ink-secondary dark:text-ink-secondary-dark">
                      Practice with a sample puzzle
                    </div>
                  </div>
                </button>
              </div>

              {/* Cancel */}
              <div className="px-4 pb-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-3 text-body-small font-semibold text-ink-secondary dark:text-ink-secondary-dark hover:text-ink dark:hover:text-ink-dark transition-colors rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4A8B8D]"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  // Portal to body to escape any parent transforms/constraints
  return createPortal(helpContent, document.body);
}
