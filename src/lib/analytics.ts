import posthog from 'posthog-js';

// ---------------------------------------------------------------------------
// Event Types
// ---------------------------------------------------------------------------

export interface GameStartedEvent {
  puzzleId: string;
  date: string;
}

export interface GuessSubmittedEvent {
  puzzleId: string;
  guessNumber: number;
  targetType: 'main' | 'crosser';
  correct: boolean;
}

export interface CrosserSolvedEvent {
  puzzleId: string;
  crosserId: string;
}

export interface GameCompletedEvent {
  puzzleId: string;
  won: boolean;
  totalGuesses: number;
  crossersSolved: number;
  timeSpent: number; // seconds
}

export interface ShareClickedEvent {
  puzzleId: string;
  method: 'clipboard' | 'native';
}

// ---------------------------------------------------------------------------
// Analytics Storage Keys
// ---------------------------------------------------------------------------

const STORAGE_KEYS = {
  OPT_OUT: 'cluegrid:analytics_opt_out',
  CONSENT_SHOWN: 'cluegrid:consent_shown',
  CONSENT_GIVEN: 'cluegrid:consent_given',
} as const;

// ---------------------------------------------------------------------------
// Analytics Class
// ---------------------------------------------------------------------------

class Analytics {
  private initialized = false;

  /**
   * Initialize PostHog. Respects user opt-out preference.
   * @returns true if initialized, false if skipped due to opt-out or missing key
   */
  init(): boolean {
    if (typeof window === 'undefined') return false;
    if (this.initialized) return true;

    // Check if user has opted out
    if (this.isOptedOut()) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[Analytics] Skipped init - user opted out');
      }
      return false;
    }

    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (!key) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[Analytics] Skipped init - no PostHog key');
      }
      return false;
    }

    posthog.init(key, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
      capture_pageview: false,
      capture_pageleave: true,
      persistence: 'localStorage',
      autocapture: false,
      respect_dnt: true,
    });

    this.initialized = true;
    return true;
  }

  /**
   * Track a generic event
   */
  track(event: string, properties?: Record<string, unknown>) {
    if (this.isOptedOut()) return;

    if (!this.initialized) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[Analytics]', event, properties);
      }
      return;
    }
    posthog.capture(event, properties);
  }

  // ---------------------------------------------------------------------------
  // Game-Specific Events
  // ---------------------------------------------------------------------------

  /**
   * Track when a game session starts
   */
  trackGameStarted(data: GameStartedEvent) {
    this.track('game_started', {
      puzzle_id: data.puzzleId,
      date: data.date,
    });
  }

  /**
   * Track when a guess is submitted
   */
  trackGuessSubmitted(data: GuessSubmittedEvent) {
    this.track('guess_submitted', {
      puzzle_id: data.puzzleId,
      guess_number: data.guessNumber,
      target_type: data.targetType,
      correct: data.correct,
    });
  }

  /**
   * Track when a crosser word is solved
   */
  trackCrosserSolved(data: CrosserSolvedEvent) {
    this.track('crosser_solved', {
      puzzle_id: data.puzzleId,
      crosser_id: data.crosserId,
    });
  }

  /**
   * Track when a game is completed (won or lost)
   */
  trackGameCompleted(data: GameCompletedEvent) {
    this.track('game_completed', {
      puzzle_id: data.puzzleId,
      won: data.won,
      total_guesses: data.totalGuesses,
      crossers_solved: data.crossersSolved,
      time_spent: data.timeSpent,
    });
  }

  /**
   * Track when share button is clicked
   */
  trackShareClicked(data: ShareClickedEvent) {
    this.track('share_clicked', {
      puzzle_id: data.puzzleId,
      method: data.method,
    });
  }

  // ---------------------------------------------------------------------------
  // User Properties & Session Management
  // ---------------------------------------------------------------------------

  setUserProperty(property: string, value: unknown) {
    if (this.isOptedOut()) return;
    if (!this.initialized) return;
    posthog.people.set({ [property]: value });
  }

  reset() {
    if (!this.initialized) return;
    posthog.reset();
  }

  // ---------------------------------------------------------------------------
  // Consent & Opt-Out Management
  // ---------------------------------------------------------------------------

  /**
   * Opt user out of all analytics tracking
   */
  optOut() {
    // Track opt-out before disabling (if possible)
    if (this.initialized) {
      posthog.capture('analytics_opted_out');
      posthog.opt_out_capturing();
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.OPT_OUT, 'true');
      localStorage.setItem(STORAGE_KEYS.CONSENT_GIVEN, 'false');
    }
  }

  /**
   * Opt user back in to analytics tracking
   */
  optIn() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEYS.OPT_OUT);
      localStorage.setItem(STORAGE_KEYS.CONSENT_GIVEN, 'true');
    }
    if (this.initialized) {
      posthog.opt_in_capturing();
    } else {
      // Re-initialize if was previously opted out
      this.init();
    }
    this.track('analytics_opted_in');
  }

  /**
   * Check if user has opted out of analytics
   */
  isOptedOut(): boolean {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(STORAGE_KEYS.OPT_OUT) === 'true';
  }

  /**
   * Check if consent banner has been shown
   */
  hasConsentBeenShown(): boolean {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(STORAGE_KEYS.CONSENT_SHOWN) === 'true';
  }

  /**
   * Mark consent banner as shown
   */
  markConsentShown() {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.CONSENT_SHOWN, 'true');
    }
  }

  /**
   * Check if user has given consent (either explicitly or implicitly)
   */
  hasConsent(): boolean {
    if (typeof window === 'undefined') return false;
    // User has consent if they haven't opted out and consent was shown
    return !this.isOptedOut() && this.hasConsentBeenShown();
  }
}

export const analytics = new Analytics();
