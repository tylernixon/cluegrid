"use client";

import { useEffect, useRef } from "react";

interface ModalShellProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  /** Center content vertically when it doesn't fill the body */
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
  centerContent = false,
}: ModalShellProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open) {
      if (!dialog.open) dialog.showModal();
    } else {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    function handleClose() {
      onClose();
    }

    dialog.addEventListener("close", handleClose);
    return () => dialog.removeEventListener("close", handleClose);
  }, [onClose]);

  if (!open) return null;

  return (
    <dialog
      ref={dialogRef}
      className="fixed inset-0 z-50 m-0 p-0 w-full h-full max-w-none max-h-none bg-canvas/80 dark:bg-canvas-dark/80 backdrop:bg-black/50"
      aria-label={title}
    >
      {/* Fixed container */}
      <div className="fixed inset-0 z-50">
        {/* Backdrop with blur */}
        <div className="fixed inset-0 bg-canvas/80 dark:bg-canvas-dark/80 backdrop-blur-xl" />

        {/* Centered modal panel */}
        <div
          className="fixed inset-0 flex items-center justify-center p-4"
          style={{
            paddingTop: 'max(1rem, env(safe-area-inset-top))',
            paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
            paddingLeft: 'max(1rem, env(safe-area-inset-left))',
            paddingRight: 'max(1rem, env(safe-area-inset-right))',
          }}
        >
          {/* Modal panel - bounded height, grid layout */}
          <div className="w-full max-w-lg rounded-2xl bg-surface dark:bg-surface-dark shadow-xl max-h-[min(85dvh,42rem)] overflow-hidden border border-border/50 dark:border-border-dark/50">
            <div className="grid h-full grid-rows-[auto_minmax(0,1fr)_auto]">
              {/* Header */}
              <header className="relative flex items-center justify-center h-14 px-4 border-b border-border/50 dark:border-border-dark/50 shrink-0">
                <button
                  type="button"
                  className="absolute left-4 w-10 h-10 flex items-center justify-center text-ink-secondary dark:text-ink-secondary-dark hover:text-ink dark:hover:text-ink-dark transition-colors focus:outline-none"
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

              {/* Body - only scrollable region */}
              <div className={`overflow-y-auto ${centerContent ? "flex items-center" : ""}`}>
                <div className={`w-full p-4 ${centerContent ? "my-auto" : ""}`}>
                  {children}
                </div>
              </div>

              {/* Footer - pinned to bottom */}
              {footer && (
                <div className="p-4 border-t border-border/50 dark:border-border-dark/50 shrink-0">
                  {footer}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </dialog>
  );
}
