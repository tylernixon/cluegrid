"use client";

import { useEffect } from "react";

interface ToastProps {
  message: string | null;
  onDismiss: () => void;
}

export function Toast({ message, onDismiss }: ToastProps) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onDismiss, 2000);
    return () => clearTimeout(timer);
  }, [message, onDismiss]);

  if (!message) return null;

  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50">
      <div className="bg-ink dark:bg-ink-dark text-canvas dark:text-canvas-dark text-body-small font-medium px-4 py-2 rounded-lg shadow-md">
        {message}
      </div>
    </div>
  );
}
