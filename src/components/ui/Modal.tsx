"use client";

import { useEffect, useRef } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
}

function ChevronLeftIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

export function Modal({ open, onClose, children, title }: ModalProps) {
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
      className="fixed inset-0 z-50 w-full h-full m-0 p-0 bg-canvas dark:bg-canvas-dark backdrop:bg-black/50 dark:backdrop:bg-black/70 overflow-y-auto"
      aria-label={title}
    >
      <div className="min-h-full flex flex-col">
        {/* Header with back button */}
        <header className="flex items-center h-14 px-4 border-b border-border dark:border-border-dark shrink-0">
          <button
            type="button"
            className="w-10 h-10 flex items-center justify-center rounded-lg text-[#4A8B8D] hover:text-[#3D5A5E] hover:bg-surface-raised dark:hover:bg-surface-raised-dark transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4A8B8D]"
            onClick={onClose}
            aria-label="Go back"
          >
            <ChevronLeftIcon />
          </button>
          {title && (
            <h1 className="ml-2 text-heading-3 font-serif text-ink dark:text-ink-dark">
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
