# Cluegrid - Analytics Plan & Event Schema

## 1. Analytics Strategy

### 1.1 Goals

1. **Validate retention** - Are players coming back?
2. **Measure engagement** - How are players interacting?
3. **Identify friction** - Where do players get stuck?
4. **Guide content** - What difficulty level works?
5. **Inform roadmap** - What features matter?

### 1.2 Tool Selection

**Primary:** PostHog (Self-serve, privacy-focused, generous free tier)

**Why PostHog:**
- Event tracking + session replay
- Funnel analysis
- Cohort retention
- Feature flags (future)
- Self-hostable if needed

**Alternatives considered:**
- Mixpanel (more expensive)
- Amplitude (more complex)
- Simple custom analytics (less insight)

### 1.3 Privacy Principles

1. **No PII collection** - Anonymous user IDs only
2. **Minimal data** - Only what's needed for decisions
3. **Transparent** - Users can see what's tracked
4. **GDPR-ready** - Consent-aware, deletable
5. **No ad tracking** - No third-party pixels

---

## 2. Event Schema

### 2.1 Event Naming Convention

```
{category}_{action}_{target?}

Examples:
- puzzle_started
- guess_submitted
- share_copied
- settings_theme_changed
```

### 2.2 Core Events

#### Session Events

```typescript
// User opens the app
{
  event: 'app_opened',
  properties: {
    source: 'direct' | 'share_link' | 'bookmark' | 'pwa',
    has_active_puzzle: boolean,
    returning_user: boolean,
    days_since_last_visit: number | null,
  }
}

// User closes/leaves the app
{
  event: 'app_closed',
  properties: {
    session_duration_seconds: number,
    puzzle_in_progress: boolean,
  }
}
```

#### Puzzle Events

```typescript
// User starts today's puzzle
{
  event: 'puzzle_started',
  properties: {
    puzzle_id: string,
    puzzle_date: string, // YYYY-MM-DD
    is_first_puzzle: boolean,
    crosser_count: number,
  }
}

// User submits a guess
{
  event: 'guess_submitted',
  properties: {
    puzzle_id: string,
    guess_number: number, // 1-6
    target_word: 'main' | 'crosser',
    word_length: number,
    result: 'valid' | 'invalid_word' | 'invalid_length',
    letters_correct: number,
    letters_present: number,
    solved_word: boolean,
  }
}

// User solves a crossing word
{
  event: 'crosser_solved',
  properties: {
    puzzle_id: string,
    crosser_index: number, // which crosser (1st, 2nd, etc.)
    guess_number: number, // on which guess
    letters_revealed: number, // how many letters revealed for main
  }
}

// User completes puzzle (win or loss)
{
  event: 'puzzle_completed',
  properties: {
    puzzle_id: string,
    puzzle_date: string,
    result: 'won' | 'lost',
    guess_count: number,
    crossers_solved: number,
    total_crossers: number,
    duration_seconds: number,
    streak_current: number,
    streak_extended: boolean, // did this win extend streak?
  }
}

// User abandons puzzle (closes without finishing)
{
  event: 'puzzle_abandoned',
  properties: {
    puzzle_id: string,
    guess_count: number,
    crossers_solved: number,
    time_spent_seconds: number,
  }
}
```

#### Interaction Events

```typescript
// User views clue
{
  event: 'clue_viewed',
  properties: {
    puzzle_id: string,
    crosser_index: number,
    guess_number: number, // when they viewed it
  }
}

// User switches word selection
{
  event: 'word_selected',
  properties: {
    puzzle_id: string,
    from_word: 'main' | 'crosser',
    to_word: 'main' | 'crosser',
    guess_number: number,
  }
}

// User uses physical keyboard
{
  event: 'keyboard_type',
  properties: {
    type: 'physical' | 'virtual',
  }
}
```

#### Share Events

```typescript
// User copies share text
{
  event: 'share_copied',
  properties: {
    puzzle_id: string,
    result: 'won' | 'lost',
    guess_count: number,
    method: 'button_click' | 'keyboard_shortcut',
  }
}

// User uses native share
{
  event: 'share_native',
  properties: {
    puzzle_id: string,
    result: 'won' | 'lost',
    share_target: string | null, // if available
  }
}
```

#### Stats Events

```typescript
// User views stats modal
{
  event: 'stats_viewed',
  properties: {
    games_played: number,
    win_rate: number,
    current_streak: number,
    trigger: 'completion' | 'header_button',
  }
}
```

#### Onboarding Events

```typescript
// User sees tutorial
{
  event: 'tutorial_started',
  properties: {
    is_first_visit: boolean,
  }
}

// User completes tutorial
{
  event: 'tutorial_completed',
  properties: {
    duration_seconds: number,
    skipped: boolean,
  }
}
```

#### Settings Events

```typescript
// User changes theme
{
  event: 'settings_theme_changed',
  properties: {
    from_theme: 'light' | 'dark' | 'system',
    to_theme: 'light' | 'dark' | 'system',
  }
}

// User toggles accessibility setting
{
  event: 'settings_accessibility_changed',
  properties: {
    setting: 'colorblind_mode' | 'reduced_motion',
    enabled: boolean,
  }
}
```

#### Error Events

```typescript
// API error occurs
{
  event: 'error_api',
  properties: {
    endpoint: string,
    status_code: number,
    error_code: string,
    puzzle_id?: string,
  }
}

// Client-side error
{
  event: 'error_client',
  properties: {
    error_type: string,
    error_message: string,
    component?: string,
  }
}
```

### 2.3 User Properties

Set once per user (anonymous ID):

```typescript
{
  // Set on first visit
  first_seen: timestamp,
  first_puzzle_date: string,
  acquisition_source: string,

  // Updated over time
  total_games_played: number,
  total_games_won: number,
  longest_streak: number,
  last_active: timestamp,

  // Preferences
  theme_preference: 'light' | 'dark' | 'system',
  colorblind_mode: boolean,
}
```

---

## 3. Implementation

### 3.1 Analytics Wrapper

```typescript
// lib/analytics.ts

import posthog from 'posthog-js';

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

class Analytics {
  private initialized = false;

  init() {
    if (this.initialized || !IS_PRODUCTION || !POSTHOG_KEY) return;

    posthog.init(POSTHOG_KEY, {
      api_host: 'https://app.posthog.com',
      capture_pageview: false, // Manual control
      capture_pageleave: true,
      persistence: 'localStorage',
      autocapture: false, // Manual events only
      disable_session_recording: false,
      session_recording: {
        maskAllInputs: true,
        maskTextSelector: '*', // Privacy: mask all text
      },
    });

    this.initialized = true;
  }

  identify(userId: string) {
    if (!this.initialized) return;
    posthog.identify(userId);
  }

  track(event: string, properties?: Record<string, any>) {
    if (!this.initialized) {
      console.log('[Analytics]', event, properties);
      return;
    }
    posthog.capture(event, properties);
  }

  setUserProperty(property: string, value: any) {
    if (!this.initialized) return;
    posthog.people.set({ [property]: value });
  }

  reset() {
    if (!this.initialized) return;
    posthog.reset();
  }
}

export const analytics = new Analytics();
```

### 3.2 React Integration

```typescript
// hooks/useAnalytics.ts

import { useEffect } from 'react';
import { analytics } from '@/lib/analytics';

export function useAnalytics() {
  return {
    track: analytics.track.bind(analytics),
    setUserProperty: analytics.setUserProperty.bind(analytics),
  };
}

// Track page views
export function usePageView(pageName: string) {
  useEffect(() => {
    analytics.track('page_viewed', { page: pageName });
  }, [pageName]);
}
```

### 3.3 Event Hooks

```typescript
// hooks/usePuzzleAnalytics.ts

export function usePuzzleAnalytics(puzzleId: string) {
  const startTime = useRef(Date.now());
  const guessCount = useRef(0);

  const trackGuess = useCallback((guess: Guess) => {
    guessCount.current++;
    analytics.track('guess_submitted', {
      puzzle_id: puzzleId,
      guess_number: guessCount.current,
      target_word: guess.target === 'main' ? 'main' : 'crosser',
      word_length: guess.word.length,
      result: guess.valid ? 'valid' : 'invalid_word',
      letters_correct: guess.feedback.filter(f => f.status === 'correct').length,
      letters_present: guess.feedback.filter(f => f.status === 'present').length,
      solved_word: guess.solved,
    });
  }, [puzzleId]);

  const trackCompletion = useCallback((result: 'won' | 'lost', stats: UserStats) => {
    const duration = Math.round((Date.now() - startTime.current) / 1000);

    analytics.track('puzzle_completed', {
      puzzle_id: puzzleId,
      result,
      guess_count: guessCount.current,
      duration_seconds: duration,
      streak_current: stats.currentStreak,
      streak_extended: result === 'won',
    });

    // Update user properties
    analytics.setUserProperty('total_games_played', stats.gamesPlayed);
    analytics.setUserProperty('total_games_won', stats.gamesWon);
    analytics.setUserProperty('longest_streak', stats.maxStreak);
    analytics.setUserProperty('last_active', new Date().toISOString());
  }, [puzzleId]);

  return { trackGuess, trackCompletion };
}
```

---

## 4. Key Metrics & Dashboards

### 4.1 Executive Dashboard

**Daily Health:**
- DAU (Daily Active Users)
- New users
- Returning users
- Games started
- Games completed
- Win rate

**Trends (7-day rolling):**
- DAU trend
- Completion rate trend
- Share rate trend

### 4.2 Retention Dashboard

**Cohort Analysis:**
```
         D0    D1    D7    D14   D30
Week 1   100%  45%   28%   20%   15%
Week 2   100%  48%   30%   22%   --
Week 3   100%  42%   --    --    --
```

**Streak Distribution:**
| Streak Length | Users |
|---------------|-------|
| 0 days        | 40%   |
| 1-3 days      | 25%   |
| 4-7 days      | 15%   |
| 8-14 days     | 10%   |
| 15-30 days    | 7%    |
| 30+ days      | 3%    |

### 4.3 Engagement Dashboard

**Session Metrics:**
- Avg session length
- Avg guesses per game
- Crossers solved per game
- Share rate

**Funnel:**
```
App Open           100%
├─ Puzzle Started   85%
├─ Guess Made       80%
├─ Completed        65%
└─ Shared           12%
```

### 4.4 Content Dashboard

**Puzzle Difficulty:**
| Puzzle Date | Win Rate | Avg Guesses | Difficulty |
|-------------|----------|-------------|------------|
| Jan 15      | 78%      | 3.8         | Easy       |
| Jan 16      | 62%      | 4.5         | Medium     |
| Jan 17      | 45%      | 5.2         | Hard       |

**Clue Effectiveness:**
- Which clues lead to quicker solves?
- Which crossers are solved first?

---

## 5. Alerts & Monitoring

### 5.1 Health Alerts

| Metric | Warning | Critical | Action |
|--------|---------|----------|--------|
| Error rate | >2% | >5% | Page on-call |
| API latency p95 | >500ms | >2s | Investigate |
| DAU drop | -20% | -40% | Review changes |
| Win rate | <50% | <40% | Review puzzle |
| Win rate | >90% | >95% | Review puzzle |

### 5.2 PostHog Actions

```javascript
// PostHog Action: High Error Rate
{
  name: 'High Error Rate',
  trigger: 'event_count',
  event: 'error_api',
  threshold: 100,
  period: '1h',
  action: 'slack_notification',
}

// PostHog Action: New User Drop
{
  name: 'Tutorial Abandonment Spike',
  trigger: 'conversion_rate',
  funnel: ['tutorial_started', 'tutorial_completed'],
  threshold_below: 50,
  period: '1d',
  action: 'email_notification',
}
```

---

## 6. Privacy & Compliance

### 6.1 Data Collection Notice

```typescript
// components/PrivacyNotice.tsx

function PrivacyNotice() {
  return (
    <div className="text-sm text-gray-500">
      <p>
        We collect anonymous usage data to improve the game.
        No personal information is stored.
        <Link href="/privacy">Learn more</Link>
      </p>
    </div>
  );
}
```

### 6.2 Opt-Out Mechanism

```typescript
// lib/analytics.ts

export function optOut() {
  analytics.track('analytics_opted_out');
  posthog.opt_out_capturing();
  localStorage.setItem('analytics_opt_out', 'true');
}

export function isOptedOut(): boolean {
  return localStorage.getItem('analytics_opt_out') === 'true';
}
```

### 6.3 Data Retention

- **Event data:** 12 months
- **Session recordings:** 30 days
- **User properties:** Until opt-out or deletion request

### 6.4 GDPR Endpoints

```typescript
// app/api/privacy/delete/route.ts

export async function POST(request: Request) {
  const { userId } = await request.json();

  // Delete from PostHog
  await posthog.api.delete(`/api/person/${userId}`);

  // Clear local storage
  return NextResponse.json({ success: true });
}
```

---

## 7. A/B Testing (Future)

### 7.1 Feature Flags

```typescript
// Potential experiments
const EXPERIMENTS = {
  clue_reveal_timing: ['all_visible', 'progressive', 'on_demand'],
  completion_celebration: ['confetti', 'simple', 'none'],
  streak_forgiveness: ['none', 'one_day', 'two_days'],
};
```

### 7.2 Implementation

```typescript
// hooks/useExperiment.ts

export function useExperiment<T extends string>(
  experimentName: string,
  variants: T[],
  defaultVariant: T
): T {
  const variant = posthog.getFeatureFlag(experimentName);

  if (!variant || !variants.includes(variant as T)) {
    return defaultVariant;
  }

  return variant as T;
}

// Usage
function CompletionModal() {
  const celebration = useExperiment(
    'completion_celebration',
    ['confetti', 'simple', 'none'],
    'simple'
  );

  return (
    <Modal>
      {celebration === 'confetti' && <Confetti />}
      {/* ... */}
    </Modal>
  );
}
```

---

## 8. Implementation Checklist

### Phase 1: MVP Analytics

- [ ] Set up PostHog project
- [ ] Implement analytics wrapper
- [ ] Add core events:
  - [ ] app_opened
  - [ ] puzzle_started
  - [ ] guess_submitted
  - [ ] puzzle_completed
  - [ ] share_copied
- [ ] Create basic dashboard
- [ ] Set up error tracking

### Phase 2: Retention Focus

- [ ] Implement user properties
- [ ] Add cohort analysis
- [ ] Create retention dashboard
- [ ] Set up health alerts

### Phase 3: Optimization

- [ ] Add session recording
- [ ] Create funnels
- [ ] Implement A/B testing
- [ ] Advanced segmentation
