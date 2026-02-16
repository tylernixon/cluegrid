"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

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

  return (
    <AnimatePresence>
      {message && (
        <motion.div
          className="fixed top-16 left-1/2 z-50"
          initial={{ opacity: 0, y: -12, x: "-50%" }}
          animate={{ opacity: 1, y: 0, x: "-50%" }}
          exit={{ opacity: 0, y: -12, x: "-50%" }}
          transition={{ duration: 0.15, ease: "easeOut" }}
        >
          <div className="bg-ink dark:bg-ink-dark text-canvas dark:text-canvas-dark text-body-small font-medium px-4 py-2 rounded-lg shadow-md">
            {message}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
