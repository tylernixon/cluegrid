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
      {/* LAYER 1: Blurred backdrop - absolute full-bleed, NO safe area padding */}
      <div
        className="absolute inset-0 bg-canvas/80 dark:bg-canvas-dark/80 backdrop-blur-xl"
        onClick={onClose}
      />

      {/* Edge gradients to blend any safe-area seams */}
      <div
        className="absolute inset-x-0 top-0 h-8 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.4), transparent)' }}
      />
      <div
        className="absolute inset-x-0 bottom-0 h-8 pointer-events-none"
        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.4), transparent)' }}
      />

      {/* LAYER 2: Content wrapper - absolute full-bleed with safe area padding */}
      <div
        className="absolute inset-0 flex flex-col"
        style={{
          paddingTop: 'env(safe-area-inset-top)',
          paddingBottom: 'env(safe-area-inset-bottom)',
          paddingLeft: 'env(safe-area-inset-left)',
          paddingRight: 'env(safe-area-inset-right)',
        }}
      >
        {/* Inner content with additional app padding */}
        <div className="flex-1 flex flex-col px-4 py-4 min-h-0">
          <div className="flex-1 grid grid-rows-[auto_minmax(0,1fr)_auto] min-h-0 max-w-lg mx-auto w-full">
            {/* Header pinned top */}
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
            <div className={`overflow-y-auto min-h-0 ${centerContent ? "grid place-items-center" : ""}`}>
              <div className="w-full">{children}</div>
            </div>

            {/* Footer pinned bottom */}
            {footer && (
              <div className="py-3 shrink-0">
                {footer}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // Portal to body to escape any parent transforms/constraints
  return createPortal(modalContent, document.body);
}
