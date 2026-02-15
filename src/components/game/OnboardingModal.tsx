"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence, type PanInfo } from "framer-motion";

interface OnboardingModalProps {
  open: boolean;
  onClose: () => void;
}

// Mini cell component for demo grids
function DemoCell({
  letter,
  status,
  highlight,
  size = "normal",
}: {
  letter?: string;
  status?: "empty" | "correct" | "present" | "revealed" | "main";
  highlight?: boolean;
  size?: "small" | "normal";
}) {
  const sizeClass = size === "small" ? "w-8 h-8 text-sm" : "w-10 h-10 text-base";

  const statusClasses: Record<string, string> = {
    empty: "bg-surface-raised dark:bg-surface-raised-dark border-border dark:border-border-dark",
    correct: "bg-correct dark:bg-correct-dark border-correct dark:border-correct-dark text-white",
    present: "bg-present dark:bg-present-dark border-present dark:border-present-dark text-white",
    revealed: "bg-surface dark:bg-surface-dark border-accent dark:border-accent-dark text-accent dark:text-accent-dark",
    main: "bg-surface-raised dark:bg-surface-raised-dark border-border-active dark:border-border-active-dark font-bold",
  };

  return (
    <div
      className={`${sizeClass} flex items-center justify-center rounded-sm border-2 font-mono select-none transition-all duration-300 ${
        statusClasses[status || "empty"]
      } ${highlight ? "ring-2 ring-accent dark:ring-accent-dark ring-offset-2" : ""}`}
    >
      {letter}
    </div>
  );
}

// The onboarding slides
const slides = [
  {
    id: "welcome",
    title: "Welcome to gist",
    subtitle: "A daily word puzzle",
  },
  {
    id: "goal",
    title: "Find the Main Word",
    subtitle: "The highlighted row is your goal",
  },
  {
    id: "hints",
    title: "Use the Hints",
    subtitle: "Solve crossing words to reveal letters",
  },
  {
    id: "play",
    title: "Ready to Play!",
    subtitle: "Tap hints to switch, swipe to navigate",
  },
];

export function OnboardingModal({ open, onClose }: OnboardingModalProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState<"left" | "right">("left");

  const goToSlide = useCallback((index: number) => {
    if (index < 0 || index >= slides.length) return;
    setDirection(index > currentSlide ? "left" : "right");
    setCurrentSlide(index);
  }, [currentSlide]);

  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const threshold = 50;
      if (info.offset.x < -threshold && currentSlide < slides.length - 1) {
        goToSlide(currentSlide + 1);
      } else if (info.offset.x > threshold && currentSlide > 0) {
        goToSlide(currentSlide - 1);
      }
    },
    [currentSlide, goToSlide]
  );

  const handleComplete = useCallback(() => {
    localStorage.setItem("gist-onboarding-seen", "true");
    onClose();
  }, [onClose]);

  // Close on escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleComplete();
      } else if (e.key === "ArrowRight" && currentSlide < slides.length - 1) {
        goToSlide(currentSlide + 1);
      } else if (e.key === "ArrowLeft" && currentSlide > 0) {
        goToSlide(currentSlide - 1);
      }
    };
    if (open) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [open, currentSlide, goToSlide, handleComplete]);

  if (!open) return null;

  const slideVariants = {
    enter: (dir: "left" | "right") => ({
      x: dir === "left" ? 100 : -100,
      opacity: 0,
    }),
    center: { x: 0, opacity: 1 },
    exit: (dir: "left" | "right") => ({
      x: dir === "left" ? -100 : 100,
      opacity: 0,
    }),
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/80">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-[calc(100%-32px)] max-w-[360px] bg-surface dark:bg-surface-dark rounded-2xl shadow-xl overflow-hidden"
      >
        {/* Swipeable content area */}
        <motion.div
          className="relative h-[380px] overflow-hidden touch-pan-y"
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragEnd={handleDragEnd}
        >
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentSlide}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="absolute inset-0 flex flex-col items-center justify-center px-6"
            >
              {/* Slide 0: Welcome */}
              {currentSlide === 0 && (
                <div className="text-center">
                  <div className="flex gap-1 justify-center mb-6">
                    <DemoCell letter="g" status="correct" />
                    <DemoCell letter="i" status="present" />
                    <DemoCell letter="s" status="present" />
                    <DemoCell letter="t" status="correct" />
                  </div>
                  <h2 className="text-heading-2 text-ink dark:text-ink-dark mb-2">
                    {slides[0]?.title}
                  </h2>
                  <p className="text-body-small text-ink-secondary dark:text-ink-secondary-dark">
                    {slides[0]?.subtitle}
                  </p>
                </div>
              )}

              {/* Slide 1: Goal - Show main word row */}
              {currentSlide === 1 && (
                <div className="text-center">
                  <div className="flex flex-col gap-1 items-center mb-6">
                    <div className="flex gap-1">
                      <DemoCell letter="" status="empty" size="small" />
                      <DemoCell letter="B" status="revealed" size="small" />
                      <DemoCell letter="" status="empty" size="small" />
                    </div>
                    <div className="flex gap-1">
                      <DemoCell letter="" status="empty" size="small" />
                      <DemoCell letter="R" status="revealed" size="small" />
                      <DemoCell letter="" status="empty" size="small" />
                    </div>
                    <div className="flex gap-1">
                      <DemoCell letter="?" status="main" highlight />
                      <DemoCell letter="A" status="correct" highlight />
                      <DemoCell letter="?" status="main" highlight />
                    </div>
                    <div className="flex gap-1">
                      <DemoCell letter="" status="empty" size="small" />
                      <DemoCell letter="I" status="revealed" size="small" />
                      <DemoCell letter="" status="empty" size="small" />
                    </div>
                    <div className="flex gap-1">
                      <DemoCell letter="" status="empty" size="small" />
                      <DemoCell letter="N" status="revealed" size="small" />
                      <DemoCell letter="" status="empty" size="small" />
                    </div>
                  </div>
                  <h2 className="text-heading-2 text-ink dark:text-ink-dark mb-2">
                    {slides[1]?.title}
                  </h2>
                  <p className="text-body-small text-ink-secondary dark:text-ink-secondary-dark">
                    {slides[1]?.subtitle}
                  </p>
                </div>
              )}

              {/* Slide 2: Hints explanation */}
              {currentSlide === 2 && (
                <div className="text-center">
                  <div className="mb-6 space-y-3">
                    <div className="flex items-center gap-3 bg-surface-raised dark:bg-surface-raised-dark px-4 py-2 rounded-lg">
                      <span className="text-caption font-semibold text-present dark:text-present-dark bg-present/15 dark:bg-present-dark/15 px-2 py-0.5 rounded">
                        Hint 1
                      </span>
                      <span className="text-body-small text-ink dark:text-ink-dark font-serif">
                        &quot;Gray matter organ&quot;
                      </span>
                    </div>
                    <div className="flex justify-center">
                      <svg className="w-5 h-5 text-ink-tertiary dark:text-ink-tertiary-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                      </svg>
                    </div>
                    <div className="flex gap-1 justify-center">
                      <DemoCell letter="B" status="correct" />
                      <DemoCell letter="R" status="correct" />
                      <DemoCell letter="A" status="correct" />
                      <DemoCell letter="I" status="correct" />
                      <DemoCell letter="N" status="correct" />
                    </div>
                    <p className="text-xs text-correct dark:text-correct-dark">
                      Reveals the &quot;A&quot; in the main word!
                    </p>
                  </div>
                  <h2 className="text-heading-2 text-ink dark:text-ink-dark mb-2">
                    {slides[2]?.title}
                  </h2>
                  <p className="text-body-small text-ink-secondary dark:text-ink-secondary-dark">
                    {slides[2]?.subtitle}
                  </p>
                </div>
              )}

              {/* Slide 3: Ready to play */}
              {currentSlide === 3 && (
                <div className="text-center">
                  <div className="mb-6 text-6xl">
                    🎯
                  </div>
                  <h2 className="text-heading-2 text-ink dark:text-ink-dark mb-2">
                    {slides[3]?.title}
                  </h2>
                  <p className="text-body-small text-ink-secondary dark:text-ink-secondary-dark mb-4">
                    {slides[3]?.subtitle}
                  </p>
                  <div className="flex items-center justify-center gap-4 text-caption text-ink-tertiary dark:text-ink-tertiary-dark">
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                      </svg>
                      <span>Tap grid</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                      <span>Swipe hints</span>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* Bottom section with dots and button */}
        <div className="px-6 pb-6 pt-2 bg-surface dark:bg-surface-dark">
          {/* Dot indicators */}
          <div className="flex items-center justify-center gap-2 mb-4">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => goToSlide(i)}
                className={`w-2 h-2 rounded-full transition-all duration-200 ${
                  i === currentSlide
                    ? "bg-accent dark:bg-accent-dark w-4"
                    : "bg-border-active dark:bg-border-active-dark hover:bg-ink-tertiary dark:hover:bg-ink-tertiary-dark"
                }`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>

          {/* Action button */}
          <button
            type="button"
            onClick={currentSlide === slides.length - 1 ? handleComplete : () => goToSlide(currentSlide + 1)}
            className="w-full py-3 bg-accent dark:bg-accent-dark text-white rounded-lg font-semibold text-body hover:opacity-90 transition-opacity active:scale-[0.98]"
          >
            {currentSlide === slides.length - 1 ? "Let's Play" : "Next"}
          </button>

          {/* Skip link */}
          {currentSlide < slides.length - 1 && (
            <button
              type="button"
              onClick={handleComplete}
              className="w-full mt-2 py-2 text-body-small text-ink-tertiary dark:text-ink-tertiary-dark hover:text-ink-secondary dark:hover:text-ink-secondary-dark transition-colors"
            >
              Skip tutorial
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
