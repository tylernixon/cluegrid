"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Badge } from "@/types";

interface BadgeNotificationProps {
  badges: Badge[];
  onDismiss: () => void;
}

export function BadgeNotification({ badges, onDismiss }: BadgeNotificationProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const currentBadge = badges[currentIndex];

  // Auto-dismiss after 4 seconds per badge, then advance or close
  useEffect(() => {
    if (badges.length === 0) return;

    const timer = setTimeout(() => {
      if (currentIndex < badges.length - 1) {
        setCurrentIndex((i) => i + 1);
      } else {
        onDismiss();
      }
    }, 4000);

    return () => clearTimeout(timer);
  }, [currentIndex, badges.length, onDismiss]);

  // Reset index when new badges arrive
  useEffect(() => {
    setCurrentIndex(0);
  }, [badges]);

  return (
    <AnimatePresence>
      {currentBadge && (
        <motion.div
          key={currentBadge.id}
          initial={{ opacity: 0, y: -40, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="fixed top-16 left-1/2 z-[60] -translate-x-1/2"
        >
          <button
            type="button"
            onClick={onDismiss}
            className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-gradient-to-r from-correct/90 to-correct-dark/90 dark:from-correct-dark/90 dark:to-correct/90 text-white shadow-lg shadow-correct/30 dark:shadow-correct-dark/30 backdrop-blur-sm border border-white/20 cursor-pointer hover:brightness-110 transition-all"
          >
            <motion.span
              className="text-3xl"
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 15, delay: 0.15 }}
            >
              {currentBadge.icon}
            </motion.span>
            <div className="text-left">
              <p className="text-body-small font-bold tracking-wide uppercase opacity-80">
                Badge Earned!
              </p>
              <p className="text-body font-semibold">{currentBadge.name}</p>
              <p className="text-caption opacity-80">{currentBadge.description}</p>
            </div>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
