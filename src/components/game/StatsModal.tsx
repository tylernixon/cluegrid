"use client";

import { Modal } from "@/components/ui/Modal";
import { BadgeDisplay } from "@/components/game/BadgeDisplay";
import { useStatsStore } from "@/stores/statsStore";

interface StatsModalProps {
  open: boolean;
  onClose: () => void;
}

export function StatsModal({ open, onClose }: StatsModalProps) {
  const gamesPlayed = useStatsStore((s) => s.gamesPlayed);
  const gamesWon = useStatsStore((s) => s.gamesWon);
  const currentStreak = useStatsStore((s) => s.currentStreak);
  const maxStreak = useStatsStore((s) => s.maxStreak);
  const guessDistribution = useStatsStore((s) => s.guessDistribution);
  const badges = useStatsStore((s) => s.badges);

  const winPercentage =
    gamesPlayed > 0 ? Math.round((gamesWon / gamesPlayed) * 100) : 0;

  // Check if there's any data in the guess distribution
  const hasGuessData = Object.values(guessDistribution).some((v) => v > 0);

  // Find max value in distribution for bar scaling
  const maxDistributionValue = Math.max(
    1,
    ...Object.values(guessDistribution)
  );

  return (
    <Modal open={open} onClose={onClose} title="Statistics">
      <div className="text-center">
        {/* Title */}
        <h2 className="text-heading-2 text-ink dark:text-ink-dark mb-6">
          Statistics
        </h2>

        {/* Stats grid */}
        <div
          className="grid grid-cols-4 gap-4 mb-8"
          role="group"
          aria-label="Game statistics"
        >
          <StatItem value={gamesPlayed} label="Played" />
          <StatItem value={winPercentage} label="Win %" />
          <StatItem value={currentStreak} label="Current Streak" />
          <StatItem value={maxStreak} label="Max Streak" />
        </div>

        {/* Guess Distribution - only show if there's data */}
        {hasGuessData && (
          <div className="mb-6">
            <h3 className="text-heading-3 text-ink dark:text-ink-dark mb-4 text-left">
              Guess Distribution
            </h3>
            <div
              className="space-y-2"
              role="group"
              aria-label="Guess distribution chart"
            >
              {([1, 2, 3, 4, 5, 6] as const).map((guessNum) => {
                const count = guessDistribution[guessNum] ?? 0;
                const percentage =
                  maxDistributionValue > 0
                    ? (count / maxDistributionValue) * 100
                    : 0;
                // Minimum width of 8% for visibility when there's at least one
                const barWidth = count > 0 ? Math.max(8, percentage) : 0;

                return (
                  <div
                    key={guessNum}
                    className="flex items-center gap-2"
                    role="row"
                    aria-label={`${count} games won in ${guessNum} guesses`}
                  >
                    <span className="w-4 text-body-small font-semibold text-ink dark:text-ink-dark">
                      {guessNum}
                    </span>
                    <div className="flex-1 flex items-center">
                      <div
                        className={`h-6 rounded-sm flex items-center justify-end px-2 transition-all duration-300 ${
                          count > 0
                            ? "bg-correct dark:bg-correct-dark"
                            : "bg-border dark:bg-border-dark"
                        }`}
                        style={{ width: `${barWidth}%`, minWidth: count > 0 ? "24px" : "4px" }}
                      >
                        <span
                          className={`text-caption font-semibold ${
                            count > 0
                              ? "text-white"
                              : "text-ink-tertiary dark:text-ink-tertiary-dark"
                          }`}
                        >
                          {count}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Badges */}
        <div className="mb-6">
          <h3 className="text-heading-3 text-ink dark:text-ink-dark mb-4 text-left">
            Badges
          </h3>
          <BadgeDisplay earnedBadges={badges} />
        </div>

        {/* Close button */}
        <button
          type="button"
          className="w-full px-6 py-3 bg-accent dark:bg-accent-dark text-white rounded-lg font-semibold text-body hover:bg-accent-hover dark:hover:bg-accent-hover-dark transition-colors active:scale-[0.98]"
          onClick={onClose}
          aria-label="Close statistics"
        >
          Close
        </button>
      </div>
    </Modal>
  );
}

interface StatItemProps {
  value: number;
  label: string;
}

function StatItem({ value, label }: StatItemProps) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-stat text-ink dark:text-ink-dark">{value}</span>
      <span className="text-caption text-ink-secondary dark:text-ink-secondary-dark leading-tight">
        {label}
      </span>
    </div>
  );
}
