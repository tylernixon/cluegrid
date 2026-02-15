import posthog from 'posthog-js';

class Analytics {
  private initialized = false;

  init() {
    if (typeof window === 'undefined') return;
    if (this.initialized) return;

    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (!key) return;

    posthog.init(key, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
      capture_pageview: false,
      capture_pageleave: true,
      persistence: 'localStorage',
      autocapture: false,
    });

    this.initialized = true;
  }

  track(event: string, properties?: Record<string, unknown>) {
    if (!this.initialized) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[Analytics]', event, properties);
      }
      return;
    }
    posthog.capture(event, properties);
  }

  setUserProperty(property: string, value: unknown) {
    if (!this.initialized) return;
    posthog.people.set({ [property]: value });
  }

  reset() {
    if (!this.initialized) return;
    posthog.reset();
  }

  optOut() {
    this.track('analytics_opted_out');
    if (this.initialized) {
      posthog.opt_out_capturing();
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem('cluegrid:analytics_opt_out', 'true');
    }
  }

  isOptedOut(): boolean {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('cluegrid:analytics_opt_out') === 'true';
  }
}

export const analytics = new Analytics();
