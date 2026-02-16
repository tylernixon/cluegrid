"use client";

import { useEffect, useRef } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  showBackButton?: boolean;
}

function ChevronLeftIcon() {
  return (
    <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

export function Modal({ open, onClose, children, title, showBackButton = true }: ModalProps) {
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
      className="fixed inset-0 z-50 w-screen min-h-[100dvh] max-w-none max-h-none m-0 p-0 bg-transparent backdrop:bg-transparent overflow-y-auto"
      aria-label={title}
    >
      {/* Background layer with blur - covers full viewport including safe zones */}
      <div className="fixed inset-0 bg-canvas/80 dark:bg-canvas-dark/80 backdrop-blur-xl" />
      {/* Content layer with safe area padding */}
      <div className="relative min-h-dvh w-full flex flex-col pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]">
        {/* Header with centered title */}
        <header className="relative flex items-center justify-center h-14 px-4 shrink-0">
          {showBackButton && (
            <button
              type="button"
              className="absolute left-4 w-10 h-10 flex items-center justify-center text-ink-secondary dark:text-ink-secondary-dark hover:text-ink dark:hover:text-ink-dark transition-colors focus:outline-none"
              onClick={onClose}
              aria-label="Go back"
            >
              <ChevronLeftIcon />
            </button>
          )}
          {title && (
            <h1 className="text-heading-3 font-serif text-ink dark:text-ink-dark">
              {title}
            </h1>
          )}
        </header>
        {/* Content */}
        <div className="flex-1 px-4 py-6">
          {children}
        </div>
      </div>
    </dialog>
  );
}
