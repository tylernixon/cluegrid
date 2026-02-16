"use client";

import { motion } from "framer-motion";

interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  badge?: string;
}

export function MenuItem({ icon, label, onClick, badge }: MenuItemProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      className="w-full flex items-center justify-center gap-4 px-4 py-4 rounded-xl text-heading-3 font-medium text-ink dark:text-ink-dark hover:bg-surface-raised dark:hover:bg-surface-raised-dark transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4A8B8D] focus-visible:ring-offset-2"
      whileTap={{ scale: 0.98 }}
      aria-label={label}
    >
      <span className="w-7 h-7 flex items-center justify-center text-[#4A8B8D]">
        {icon}
      </span>
      <span>{label}</span>
      {badge && (
        <span className="text-caption text-ink-tertiary dark:text-ink-tertiary-dark bg-surface-raised dark:bg-surface-raised-dark px-2 py-0.5 rounded-full">
          {badge}
        </span>
      )}
    </motion.button>
  );
}
