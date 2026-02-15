'use client';

import { useEffect, useState, createContext, useContext, useCallback } from 'react';
import { analytics } from '@/lib/analytics';

// ---------------------------------------------------------------------------
// Analytics Context
// ---------------------------------------------------------------------------

interface AnalyticsContextValue {
  isOptedOut: boolean;
  hasConsentBeenShown: boolean;
  optIn: () => void;
  optOut: () => void;
  markConsentShown: () => void;
}

const AnalyticsContext = createContext<AnalyticsContextValue | null>(null);

export function useAnalyticsContext() {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error('useAnalyticsContext must be used within AnalyticsProvider');
  }
  return context;
}

// ---------------------------------------------------------------------------
// Analytics Provider
// ---------------------------------------------------------------------------

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const [isOptedOut, setIsOptedOut] = useState(false);
  const [hasConsentBeenShown, setHasConsentBeenShown] = useState(true); // Default true to avoid flash

  useEffect(() => {
    // Check current opt-out status
    const optedOut = analytics.isOptedOut();
    setIsOptedOut(optedOut);
    setHasConsentBeenShown(analytics.hasConsentBeenShown());

    // Only initialize if not opted out
    if (!optedOut) {
      const initialized = analytics.init();

      if (initialized) {
        analytics.track('app_opened', {
          source: getTrafficSource(),
          returning_user: hasVisitedBefore(),
          days_since_last_visit: getDaysSinceLastVisit(),
        });
      }
    }

    // Always update last visit time
    localStorage.setItem('cluegrid:last_visit', new Date().toISOString());
  }, []);

  const optIn = useCallback(() => {
    analytics.optIn();
    setIsOptedOut(false);
    analytics.markConsentShown();
    setHasConsentBeenShown(true);
  }, []);

  const optOut = useCallback(() => {
    analytics.optOut();
    setIsOptedOut(true);
    analytics.markConsentShown();
    setHasConsentBeenShown(true);
  }, []);

  const markConsentShown = useCallback(() => {
    analytics.markConsentShown();
    setHasConsentBeenShown(true);
  }, []);

  const contextValue: AnalyticsContextValue = {
    isOptedOut,
    hasConsentBeenShown,
    optIn,
    optOut,
    markConsentShown,
  };

  return (
    <AnalyticsContext.Provider value={contextValue}>
      {children}
    </AnalyticsContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Helper Functions
// ---------------------------------------------------------------------------

function getTrafficSource(): string {
  if (typeof window === 'undefined') return 'direct';
  const params = new URLSearchParams(window.location.search);
  if (params.has('ref')) return 'share_link';
  if (document.referrer) return 'referral';
  if (window.matchMedia('(display-mode: standalone)').matches) return 'pwa';
  return 'direct';
}

function hasVisitedBefore(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('cluegrid:last_visit') !== null;
}

function getDaysSinceLastVisit(): number | null {
  if (typeof window === 'undefined') return null;
  const lastVisit = localStorage.getItem('cluegrid:last_visit');
  if (!lastVisit) return null;
  const ms = Date.now() - new Date(lastVisit).getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}
