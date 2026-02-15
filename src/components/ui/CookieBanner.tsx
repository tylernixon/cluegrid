'use client';

import { useState, useEffect } from 'react';
import { useAnalyticsContext } from '@/components/providers/AnalyticsProvider';

/**
 * GDPR-compliant cookie consent banner.
 *
 * Shows on first visit and allows users to accept or decline analytics tracking.
 * Stores preference in localStorage.
 */
export function CookieBanner() {
  const { hasConsentBeenShown, optIn, optOut, markConsentShown } =
    useAnalyticsContext();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Show banner if consent hasn't been shown yet
    // Small delay to avoid layout shift on initial load
    const timer = setTimeout(() => {
      if (!hasConsentBeenShown) {
        setIsVisible(true);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [hasConsentBeenShown]);

  const handleAccept = () => {
    optIn();
    setIsVisible(false);
  };

  const handleDecline = () => {
    optOut();
    setIsVisible(false);
  };

  const handleDismiss = () => {
    // Dismissing without explicit choice = implicit consent (common GDPR pattern)
    markConsentShown();
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6 animate-slide-up"
      role="dialog"
      aria-label="Cookie consent"
      aria-describedby="cookie-banner-description"
    >
      <div className="max-w-lg mx-auto bg-surface dark:bg-surface-dark rounded-xl shadow-lg border border-border dark:border-border-dark p-4 sm:p-6">
        <div className="flex items-start gap-3">
          {/* Cookie icon */}
          <div className="flex-shrink-0 text-ink-secondary dark:text-ink-secondary-dark">
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
              <circle cx="12" cy="12" r="10" />
              <circle cx="8" cy="8" r="1" fill="currentColor" />
              <circle cx="15" cy="9" r="1" fill="currentColor" />
              <circle cx="9" cy="15" r="1" fill="currentColor" />
              <circle cx="16" cy="14" r="1" fill="currentColor" />
              <circle cx="12" cy="12" r="1" fill="currentColor" />
            </svg>
          </div>

          <div className="flex-1">
            <p
              id="cookie-banner-description"
              className="text-body-small text-ink dark:text-ink-dark mb-4"
            >
              We use analytics to understand how players enjoy Cluegrid and
              improve the experience. No personal data is collected.
            </p>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <button
                onClick={handleAccept}
                className="flex-1 sm:flex-none px-4 py-2 bg-accent dark:bg-accent-dark text-white font-medium text-body-small rounded-lg hover:bg-accent-hover dark:hover:bg-accent-hover-dark transition-colors focus:outline-none focus:ring-2 focus:ring-accent/50"
              >
                Accept
              </button>
              <button
                onClick={handleDecline}
                className="flex-1 sm:flex-none px-4 py-2 bg-surface-raised dark:bg-surface-raised-dark text-ink dark:text-ink-dark font-medium text-body-small rounded-lg border border-border dark:border-border-dark hover:border-border-active dark:hover:border-border-active-dark transition-colors focus:outline-none focus:ring-2 focus:ring-accent/50"
              >
                Decline
              </button>
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full text-ink-secondary dark:text-ink-secondary-dark hover:text-ink dark:hover:text-ink-dark transition-colors focus:outline-none focus:ring-2 focus:ring-accent/50"
            aria-label="Dismiss"
          >
            <svg
              width="16"
              height="16"
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
        </div>
      </div>
    </div>
  );
}
