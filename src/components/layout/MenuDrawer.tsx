"use client";

import { useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, type PanInfo } from "framer-motion";
import { MenuItem } from "./MenuItem";
import { GistLogo } from "@/components/GistLogo";

interface MenuDrawerProps {
  open: boolean;
  onClose: () => void;
  onOpenSettings: () => void;
  onOpenStats: () => void;
  onOpenHistory: () => void;
}

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const drawerVariants = {
  hidden: { x: "-100%" },
  visible: {
    x: 0,
    transition: { type: "spring" as const, damping: 30, stiffness: 300 },
  },
  exit: {
    x: "-100%",
    transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
};

// SVG icons as components for cleanliness
function GearIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="12" width="4" height="9" rx="1" />
      <rect x="10" y="7" width="4" height="14" rx="1" />
      <rect x="17" y="3" width="4" height="18" rx="1" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

const DRAWER_WIDTH = 288; // w-72
const CLOSE_THRESHOLD = 100; // px drag left to trigger close

export function MenuDrawer({
  open,
  onClose,
  onOpenSettings,
  onOpenStats,
  onOpenHistory,
}: MenuDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);
  const dragX = useMotionValue(0);
  const drawerOpacity = useTransform(dragX, [-DRAWER_WIDTH, 0], [0, 1]);

  const handleDrawerDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      if (info.offset.x < -CLOSE_THRESHOLD || info.velocity.x < -300) {
        onClose();
      }
      dragX.set(0);
    },
    [onClose, dragX],
  );

  // Close on Escape key
  useEffect(() => {
    if (!open) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  // Focus management: focus the drawer and trap focus when open
  useEffect(() => {
    if (!open) return;

    const timer = setTimeout(() => {
      drawerRef.current?.focus();
    }, 50);

    function handleFocusTrap(e: KeyboardEvent) {
      if (e.key !== "Tab" || !drawerRef.current) return;

      const focusable = drawerRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;

      const first = focusable[0]!;
      const last = focusable[focusable.length - 1]!;

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleFocusTrap);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("keydown", handleFocusTrap);
    };
  }, [open]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50">
          {/* Overlay */}
          <motion.div
            className="absolute inset-0 bg-black/50 dark:bg-black/70"
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{ duration: 0.2 }}
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Drawer */}
          <motion.div
            ref={drawerRef}
            className="absolute top-0 left-0 h-full w-72 max-w-[80vw] bg-surface dark:bg-surface-dark shadow-lg flex flex-col touch-pan-y"
            variants={drawerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            style={{ x: dragX, opacity: drawerOpacity }}
            drag="x"
            dragConstraints={{ left: -DRAWER_WIDTH, right: 0 }}
            dragElastic={0.1}
            dragMomentum={false}
            onDragEnd={handleDrawerDragEnd}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
            tabIndex={-1}
          >
            {/* Drawer header */}
            <div className="flex items-center justify-between h-14 px-4 border-b border-border dark:border-border-dark">
              <GistLogo />
              <button
                type="button"
                onClick={onClose}
                className="w-10 h-10 flex items-center justify-center rounded-lg text-ink-secondary dark:text-ink-secondary-dark hover:text-ink dark:hover:text-ink-dark hover:bg-surface-raised dark:hover:bg-surface-raised-dark transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4A8B8D]"
                aria-label="Close menu"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Menu items */}
            <nav className="flex-1 py-2 px-2" aria-label="Main navigation">
              <MenuItem
                icon={<GearIcon />}
                label="Settings"
                onClick={() => {
                  onClose();
                  onOpenSettings();
                }}
              />
              <MenuItem
                icon={<ChartIcon />}
                label="Stats"
                onClick={() => {
                  onClose();
                  onOpenStats();
                }}
              />
              <MenuItem
                icon={<CalendarIcon />}
                label="History"
                onClick={() => {
                  onClose();
                  onOpenHistory();
                }}
              />
            </nav>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
