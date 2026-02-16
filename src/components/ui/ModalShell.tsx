"use client";

import { useEffect, useCallback } from "react";
import { createPortal } from "react-dom";

interface ModalShellProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  /** Center content vertically when it doesn't fill the body (default: true) */
  centerContent?: boolean;
}

function ChevronLeftIcon() {
  return (
    <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

export function ModalShell({
  open,
  onClose,
  title,
  children,
  footer,
  centerContent = true,
}: ModalShellProps) {
  // Handle escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    },
    [onClose]
  );

  // Lock body scroll and listen for escape
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      document.addEventListener("keydown", handleKeyDown);
      return () => {
        document.body.style.overflow = "";
        document.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [open, handleKeyDown]);

  if (!open) return null;

  const modalContent = (
    <div
      className="fixed inset-0 z-50"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      {/* Edge-to-edge blurred backdrop - directly on body via portal */}
      <div
        className="fixed inset-0 bg-canvas/80 dark:bg-canvas-dark/80 backdrop-blur-xl"
        onClick={onClose}
        style={{
          // Extend into safe areas
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
      />

      {/* Full-screen modal surface with safe area padding */}
      <div
        className="fixed inset-0 h-[100dvh] px-4"
        style={{
          paddingTop: 'max(16px, env(safe-area-inset-top))',
          paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
        }}
      >
        <div className="h-full w-full grid grid-rows-[auto_minmax(0,1fr)_auto]">
          {/* Header pinned top - no border */}
          <header className="relative flex items-center justify-center py-3 shrink-0">
            <button
              type="button"
              className="absolute left-0 w-10 h-10 flex items-center justify-center text-ink-secondary dark:text-ink-secondary-dark hover:text-ink dark:hover:text-ink-dark transition-colors focus:outline-none"
              onClick={onClose}
              aria-label="Go back"
            >
              <ChevronLeftIcon />
            </button>
            {title && (
              <h1 className="text-heading-3 font-serif text-ink dark:text-ink-dark">
                {title}
              </h1>
            )}
          </header>

          {/* Content - scrolls if needed, centered when short */}
          <div className={`overflow-y-auto ${centerContent ? "grid place-items-center" : ""}`}>
            <div className="w-full max-w-lg mx-auto">{children}</div>
          </div>

          {/* Footer pinned bottom - no border */}
          {footer && (
            <div className="py-3 shrink-0 max-w-lg mx-auto w-full">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Portal to body to escape any parent transforms/constraints
  return createPortal(modalContent, document.body);
}
