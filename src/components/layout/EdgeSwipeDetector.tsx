"use client";

import { useRef, useCallback } from "react";
import { motion, useMotionValue, useTransform, type PanInfo } from "framer-motion";

interface EdgeSwipeDetectorProps {
  onSwipeOpen: () => void;
  disabled?: boolean;
}

const EDGE_THRESHOLD = 20; // px from left edge to initiate swipe
const SWIPE_TRIGGER = 80; // px drag distance to trigger open
const DRAWER_WIDTH = 288; // w-72 = 18rem = 288px

/**
 * Invisible overlay along the left edge of the screen that detects
 * swipe-right gestures to open the menu drawer.
 */
export function EdgeSwipeDetector({ onSwipeOpen, disabled }: EdgeSwipeDetectorProps) {
  const startX = useRef<number | null>(null);
  const isEdgeSwipe = useRef(false);
  const x = useMotionValue(0);
  const opacity = useTransform(x, [0, SWIPE_TRIGGER], [0, 0.15]);

  const handleDragStart = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      // Only allow swipes that originated near the left edge
      const originX = info.point.x - info.offset.x;
      if (originX <= EDGE_THRESHOLD) {
        isEdgeSwipe.current = true;
        startX.current = originX;
      } else {
        isEdgeSwipe.current = false;
      }
    },
    [],
  );

  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      if (!isEdgeSwipe.current) {
        x.set(0);
        return;
      }

      const shouldOpen =
        info.offset.x > SWIPE_TRIGGER || info.velocity.x > 300;

      if (shouldOpen) {
        onSwipeOpen();
      }

      x.set(0);
      isEdgeSwipe.current = false;
      startX.current = null;
    },
    [onSwipeOpen, x],
  );

  if (disabled) return null;

  return (
    <>
      {/* Invisible hit area along the left edge */}
      <motion.div
        className="fixed top-0 left-0 w-6 h-full z-40 touch-pan-y"
        style={{ x }}
        drag="x"
        dragConstraints={{ left: 0, right: DRAWER_WIDTH }}
        dragElastic={0}
        dragMomentum={false}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        aria-hidden="true"
      />
      {/* Subtle visual hint during swipe */}
      <motion.div
        className="fixed top-0 left-0 w-1 h-full z-40 bg-[#4A8B8D] rounded-r-full pointer-events-none"
        style={{ opacity }}
        aria-hidden="true"
      />
    </>
  );
}
