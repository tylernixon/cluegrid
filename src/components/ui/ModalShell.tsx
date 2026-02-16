"use client";

import { useEffect, useRef } from "react";

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
      className="fixed inset-0 z-50 m-0 p-0 w-full h-full max-w-none max-h-none bg-canvas/80 dark:bg-canvas-dark/80 backdrop-blur-xl backdrop:bg-black/50"
      aria-label={title}
    >
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
            <div className="w-full">{children}</div>
          </div>

          {/* Footer pinned bottom - no border */}
          {footer && (
            <div className="py-3 shrink-0">
              {footer}
            </div>
          )}
        </div>
      </div>
    </dialog>
  );
}
