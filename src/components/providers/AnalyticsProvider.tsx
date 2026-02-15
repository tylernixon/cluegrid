'use client';

import { useEffect } from 'react';
import { analytics } from '@/lib/analytics';

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    analytics.init();

    analytics.track('app_opened', {
      source: getTrafficSource(),
      returning_user: hasVisitedBefore(),
      days_since_last_visit: getDaysSinceLastVisit(),
    });

    localStorage.setItem('cluegrid:last_visit', new Date().toISOString());
  }, []);

  return <>{children}</>;
}

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
