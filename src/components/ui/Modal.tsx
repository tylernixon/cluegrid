"use client";

import { useEffect, useRef } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
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

  function handleBackdropClick(e: React.MouseEvent<HTMLDialogElement>) {
    // Close if clicking outside the modal content
    if (e.target === dialogRef.current) {
      onClose();
    }
  }

  if (!open) return null;

  return (
    <dialog
      ref={dialogRef}
      className="fixed inset-0 z-50 w-full h-full sm:m-auto sm:max-w-[400px] sm:w-[calc(100%-32px)] sm:h-auto sm:max-h-[calc(100%-64px)] rounded-none sm:rounded-xl bg-surface dark:bg-surface-dark p-6 sm:p-8 shadow-lg backdrop:bg-black/50 dark:backdrop:bg-black/70 overflow-y-auto"
      onClick={handleBackdropClick}
      aria-label={title}
    >
      <div className="relative min-h-full flex flex-col">
        <button
          type="button"
          className="absolute top-0 right-0 sm:-top-2 sm:-right-2 w-10 h-10 sm:w-8 sm:h-8 flex items-center justify-center rounded-full text-ink-secondary dark:text-ink-secondary-dark hover:text-ink dark:hover:text-ink-dark transition-colors"
          onClick={onClose}
          aria-label="Close"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
        <div className="flex-1">
          {children}
        </div>
      </div>
    </dialog>
  );
}
