# Cluegrid - Analytics Implementation Guide

## 1. Prioritized Event List

Events are prioritized into three tiers. P0 events must ship with launch. P1 events should follow within the first sprint post-launch. P2 events are instrumented when relevant features land.

### P0 Events (Launch Blockers)

These events answer the three existential questions: Are players showing up? Are they playing? Are they coming back?

| # | Event | Why It Matters | Key Properties |
|---|-------|---------------|----------------|
| 1 | `app_opened` | Measures DAU, returning vs new, acquisition source | `source`, `returning_user`, `days_since_last_visit` |
| 2 | `puzzle_started` | Measures intent; start-rate is the first conversion step | `puzzle_id`, `puzzle_date`, `is_first_puzzle` |
| 3 | `guess_submitted` | Core engagement signal; feeds difficulty analysis | `puzzle_id`, `guess_number`, `target_word`, `result`, `solved_word` |
| 4 | `puzzle_completed` | Win/loss, duration, streak -- the money metric | `puzzle_id`, `result`, `guess_count`, `duration_seconds`, `streak_current`, `streak_extended` |
| 5 | `share_copied` | Virality signal; primary organic growth lever | `puzzle_id`, `result`, `guess_count` |
| 6 | `error_api` | Reliability signal; broken puzzles kill retention | `endpoint`, `status_code`, `error_code` |
| 7 | `error_client` | JS crashes that silently destroy sessions | `error_type`, `error_message`, `component` |

**So what?** With just these 7 events you can compute DAU, retention (D1/D7/D30), completion rate, win rate, share rate, avg session duration, error rate, and the full core funnel. That is everything needed to answer "is this product working?"

### P1 Events (First Sprint Post-Launch)

| # | Event | Why It Matters |
|---|-------|---------------|
| 8 | `puzzle_abandoned` | Friction signal -- where do players give up? |
| 9 | `crosser_solved` | Difficulty decomposition -- are clues working? |
| 10 | `tutorial_started` | Onboarding funnel top |
| 11 | `tutorial_completed` | Onboarding funnel bottom; `skipped` flag is critical |
| 12 | `stats_viewed` | Engagement depth -- do players care about progress? |
| 13 | `share_native` | Distinguish clipboard copy from native share |

### P2 Events (Feature-Gated)

| # | Event | Ships With |
|---|-------|-----------|
| 14 | `clue_viewed` | Clue interaction redesign |
| 15 | `word_selected` | Multi-word UX iteration |
| 16 | `settings_theme_changed` | When themes ship |
| 17 | `settings_accessibility_changed` | Accessibility settings |
| 18 | `keyboard_type` | Physical keyboard detection |

---

## 2. Dashboard Specifications

### 2.1 Executive Dashboard -- "Is the product alive?"

Check this daily. Time range: Today vs yesterday vs 7-day avg.

```
+------------------------------------------------------------------+
|  CLUEGRID -- EXECUTIVE DASHBOARD              Date: [Today]      |
+------------------------------------------------------------------+
|                                                                    |
|  DAU          New Users      Returning       Return Rate          |
|  [####]       [####]         [####]          [##.#%]              |
|  vs 7d avg    vs 7d avg      vs 7d avg       vs 7d avg           |
|  [+/-##%]     [+/-##%]       [+/-##%]        [+/-##%]            |
|                                                                    |
+------------------------------------------------------------------+
|                                                                    |
|  Games        Completion     Win Rate        Share Rate           |
|  Started      Rate                                                |
|  [####]       [##.#%]        [##.#%]         [##.#%]             |
|  target: --   target: 60%    target: 70-80%  target: 15%         |
|                                                                    |
+------------------------------------------------------------------+
|                                                                    |
|  Avg Duration   Error Rate   Bounce Rate     Streak > 7d         |
|  [#m ##s]       [#.##%]      [##.#%]         [##.#%]            |
|  target: 3-6m   target: <2%  target: <50%    target: 40%        |
|                                                                    |
+------------------------------------------------------------------+
|                                                                    |
|  DAU TREND (7 DAYS)                                               |
|  ----*                                                            |
|  ---*-*                                                           |
|  --*----*                                                         |
|  -* .. rolling sparkline ..                                       |
|                                                                    |
+------------------------------------------------------------------+
```

**Definitions:**
- **DAU** = Distinct users firing `app_opened` in a calendar day
- **Return Rate** = Returning users / DAU
- **Completion Rate** = `puzzle_completed` / `puzzle_started` (same day)
- **Win Rate** = `puzzle_completed` where result=won / all `puzzle_completed`
- **Share Rate** = `share_copied` or `share_native` / `puzzle_completed`
- **Bounce Rate** = Users with `app_opened` but no `puzzle_started`
- **Avg Duration** = Median `duration_seconds` on `puzzle_completed`
- **Error Rate** = Sessions with `error_api` or `error_client` / total sessions
- **Streak > 7d** = Users where `streak_current >= 7` / users with `puzzle_completed`

---

### 2.2 Retention Dashboard -- "Are players coming back?"

Check this weekly. This is the single most important dashboard.

```
+------------------------------------------------------------------+
|  RETENTION COHORT TABLE                                           |
+------------------------------------------------------------------+
|                                                                    |
|  Cohort (week)  | Size | D1   | D3   | D7   | D14  | D30        |
|  ---------------+------+------+------+------+------+------       |
|  Week 1         | 500  | 45%  | 35%  | 28%  | 20%  | 15%        |
|  Week 2         | 620  | 48%  | 37%  | 30%  |  --  |  --        |
|  Week 3         | 410  | 42%  | 33%  |  --  |  --  |  --        |
|  Week 4         | 580  | 46%  |  --  |  --  |  --  |  --        |
|                                                                    |
|  TARGETS:         45%+   --    25%+   --     15%+                |
|                                                                    |
+------------------------------------------------------------------+
|                                                                    |
|  STREAK DISTRIBUTION (current active users)                       |
|                                                                    |
|  0 days     ████████████████████  40%                             |
|  1-3 days   ████████████          25%                             |
|  4-7 days   ███████               15%                             |
|  8-14 days  █████                 10%                             |
|  15-30 days ███                    7%                             |
|  30+ days   ██                     3%                             |
|                                                                    |
+------------------------------------------------------------------+
|                                                                    |
|  RESURRECTION RATE                                                |
|  Users inactive > 7 days who returned this week: [##] ([#.#%])   |
|                                                                    |
+------------------------------------------------------------------+
```

**Cohort Definition:** A cohort = all users whose first `app_opened` occurred in a given calendar week. D1 retention = % of that cohort who fire `app_opened` again 1 day after their first visit.

**Resurrection Rate:** Users who had `days_since_last_visit > 7` on their most recent `app_opened`. This tells you whether lapsed users are recoverable.

---

### 2.3 Engagement Dashboard -- "How are players interacting?"

Check this weekly.

```
+------------------------------------------------------------------+
|  CORE FUNNEL (TODAY)                                              |
+------------------------------------------------------------------+
|                                                                    |
|  App Opened          [####]     100%    ████████████████████      |
|  Puzzle Started      [####]      ##%    █████████████████         |
|  First Guess Made    [####]      ##%    ████████████████          |
|  Puzzle Completed    [####]      ##%    ████████████              |
|  Result Shared       [####]      ##%    ███                       |
|                                                                    |
|  Drop-off points:                                                 |
|  Open -> Start:  [##%] drop  (friction: puzzle load / confusion)  |
|  Start -> Guess: [##%] drop  (friction: UI understanding)         |
|  Guess -> Done:  [##%] drop  (friction: difficulty)               |
|  Done -> Share:  [##%] drop  (friction: share UX / motivation)    |
|                                                                    |
+------------------------------------------------------------------+
|                                                                    |
|  GUESS DISTRIBUTION (completed games)                             |
|                                                                    |
|  1 guess  ██                  #%                                  |
|  2 guess  █████               #%                                  |
|  3 guess  ████████████        ##%                                 |
|  4 guess  ██████████████████  ##%    <-- ideal peak               |
|  5 guess  ███████████████     ##%                                 |
|  6 guess  █████████           ##%                                 |
|                                                                    |
+------------------------------------------------------------------+
|                                                                    |
|  SESSION METRICS (medians)                                        |
|  Duration: [#m ##s]  |  Guesses/Game: [#.#]  |  Crossers/Game: [#.#]|
|                                                                    |
+------------------------------------------------------------------+
```

**Ideal Guess Distribution Shape:** Bell curve peaking at guess 3-4. If it peaks at 1-2, puzzles are too easy. If it peaks at 5-6 with high loss rate, puzzles are too hard.

---

### 2.4 Content Dashboard -- "Are puzzles well-calibrated?"

Check per-puzzle after each day.

```
+------------------------------------------------------------------+
|  PUZZLE PERFORMANCE (last 7 days)                                 |
+------------------------------------------------------------------+
|                                                                    |
|  Date       | Puzzle # | Win% | Avg Guess | Abandon% | Verdict   |
|  -----------+----------+------+-----------+----------+----------  |
|  2024-01-15 | #47      | 78%  | 3.8       | 8%       | Easy      |
|  2024-01-16 | #48      | 62%  | 4.5       | 12%      | Good      |
|  2024-01-17 | #49      | 45%  | 5.2       | 22%      | Too Hard  |
|  2024-01-18 | #50      | 91%  | 2.9       | 3%       | Too Easy  |
|                                                                    |
|  Verdict logic:                                                   |
|    Win% > 85%  AND  avg_guess < 3.5  => Too Easy                  |
|    Win% 65-85% AND  avg_guess 3.5-5  => Good                     |
|    Win% < 55%  OR   abandon% > 18%   => Too Hard                 |
|                                                                    |
+------------------------------------------------------------------+
|                                                                    |
|  CROSSER SOLVE RATES (today's puzzle)                             |
|                                                                    |
|  Crosser 1 "Playing cards..."   Solved: 72%   Avg guess: 2.1     |
|  Crosser 2 "Capital of..."      Solved: 85%   Avg guess: 1.4     |
|  Crosser 3 "Morning drink"      Solved: 58%   Avg guess: 3.2     |
|                                                                    |
+------------------------------------------------------------------+
```

---

## 3. Success Criteria

### 3.1 Launch Gate Criteria (Week 1)

The product can be considered "alive" if ALL of the following hold after the first 7 days with 200+ DAU:

| Metric | Minimum | Target | Formula |
|--------|---------|--------|---------|
| D1 Retention | 35% | 45%+ | Cohort day-1 return rate |
| Completion Rate | 50% | 60%+ | puzzle_completed / puzzle_started |
| Win Rate | 55% | 70-80% | wins / completions |
| Error Rate | < 5% | < 2% | error sessions / total sessions |
| Bounce Rate | < 60% | < 50% | no-guess sessions / total sessions |

**If we miss minimums:** Stop feature work. Fix the gap before growing.

### 3.2 Growth Signal Criteria (Month 1)

The product has organic growth potential if ANY of the following hold:

| Signal | Threshold | Why |
|--------|-----------|-----|
| Share Rate | > 15% | Social proof is a growth engine |
| D7 Retention | > 25% | Habit is forming |
| Streak > 7d | > 30% of active users | Strong daily hook |
| Organic DAU growth | > 5% week-over-week (unpaid) | Word of mouth working |

### 3.3 Product-Market Fit Indicators (Month 3)

| Indicator | Signal | Interpretation |
|-----------|--------|----------------|
| D30 Retention > 15% | Users have formed a lasting habit | Core loop works |
| Share Rate > 20% | Players actively recruit others | Viral coefficient rising |
| DAU/MAU > 30% | High engagement frequency | Daily cadence is landing |
| Resurrection rate > 5% | Lapsed users self-return | Brand has recall value |
| Avg streak > 5 days | Players are building routines | Retention is earned, not accidental |

### 3.4 Red Flags -- Stop and Investigate

| Red Flag | Condition | Likely Cause |
|----------|-----------|-------------|
| D1 Retention < 30% | Massive first-day churn | Onboarding broken, puzzle confusing, or load failure |
| Win Rate < 50% | Most players lose | Puzzles too hard, clues unclear |
| Win Rate > 90% | Everyone wins easily | Puzzles too easy, no challenge |
| Bounce Rate > 60% | Majority never guess | Page load broken, UX confusion, bad first impression |
| Share Rate < 5% | Nobody shares | Share UX broken, or result not shareable |
| Error Rate > 5% | Frequent crashes | Critical client or API bug |
| Abandon Rate > 25% | Quarter of starters quit mid-game | Single puzzle is too hard, or UX friction |

---

## 4. Alerting Rules

### 4.1 Severity Levels

| Level | Response Time | Notification | Escalation |
|-------|--------------|--------------|------------|
| P0 Critical | < 15 min | Slack + SMS | Fix immediately |
| P1 Warning | < 2 hours | Slack | Investigate same day |
| P2 Informational | Next morning | Slack (daily digest) | Review in standup |

### 4.2 Alert Definitions

#### P0 Critical Alerts

```
ALERT: API Error Spike
  Condition: error_api count > 50 in any rolling 15-minute window
  OR: error_api rate > 10% of all requests in 15 minutes
  Channel: Slack #cluegrid-alerts + SMS on-call
  Action: Check API health, Supabase status, recent deploys
  Auto-resolve: Rate drops below 2% for 15 minutes

ALERT: Zero Puzzle Completions
  Condition: 0 puzzle_completed events in any 60-minute window
             during peak hours (8am-11pm local)
  Channel: Slack #cluegrid-alerts + SMS on-call
  Action: Verify puzzle is loadable, check API, check deploy
  Auto-resolve: Any puzzle_completed event fires

ALERT: Client Error Storm
  Condition: error_client count > 100 in 15 minutes
  Channel: Slack #cluegrid-alerts
  Action: Check error messages for common pattern, roll back if deploy-related
```

#### P1 Warning Alerts

```
ALERT: Win Rate Out of Band
  Condition: Daily win rate < 50% OR > 90% (evaluated at end of day, min 50 completions)
  Channel: Slack #cluegrid-content
  Action: Review today's puzzle difficulty, adjust upcoming puzzles

ALERT: DAU Drop
  Condition: DAU drops > 20% compared to same-day-of-week prior week
  Channel: Slack #cluegrid-alerts
  Action: Check for external factors, review recent changes

ALERT: Completion Rate Drop
  Condition: Daily completion rate < 45% (min 100 starts)
  Channel: Slack #cluegrid-content
  Action: Investigate puzzle difficulty and abandonment patterns

ALERT: Share Rate Collapse
  Condition: Daily share rate < 5% (min 50 completions)
  Channel: Slack #cluegrid-product
  Action: Check share functionality, review completion UX
```

#### P2 Informational Alerts (Daily Digest)

```
DIGEST ITEM: Tutorial completion rate
  Condition: tutorial_completed / tutorial_started < 60%
  Action: Review onboarding flow in next sprint

DIGEST ITEM: Bounce rate creep
  Condition: 7-day rolling bounce rate > 45%
  Action: Monitor trend, investigate if > 50%

DIGEST ITEM: Streak health
  Condition: % of active users with streak > 7 < 25%
  Action: Consider streak forgiveness feature
```

### 4.3 PostHog Alert Configuration

```javascript
// PostHog Actions to configure:

// 1. API Error Spike (P0)
{
  name: "P0: API Error Spike",
  trigger: "event_count",
  event: "error_api",
  threshold: 50,
  period: "15m",
  action: "webhook",  // -> Slack #cluegrid-alerts
}

// 2. Zero Completions (P0)
{
  name: "P0: Zero Completions",
  trigger: "event_absence",
  event: "puzzle_completed",
  absence_period: "60m",
  time_window: "08:00-23:00",
  action: "webhook",  // -> Slack #cluegrid-alerts
}

// 3. Tutorial Drop-Off (P2)
{
  name: "P2: Tutorial Abandonment",
  trigger: "conversion_rate",
  funnel: ["tutorial_started", "tutorial_completed"],
  threshold_below: 60,
  period: "1d",
  action: "webhook",  // -> Slack #cluegrid-product (daily digest)
}
```

---

## 5. Weekly Report Template

This report should be generated every Monday morning covering the prior Monday-Sunday. It takes 10 minutes to compile and answers: "Are we on track?"

---

```markdown
# Cluegrid Weekly Report
## Week of [DATE] - [DATE]

### TL;DR
[One sentence: Are we on track, ahead, or behind? What's the single biggest takeaway?]

---

### 1. Vital Signs

| Metric | This Week | Last Week | Delta | Target | Status |
|--------|-----------|-----------|-------|--------|--------|
| Avg DAU | | | | 5,000 (month 1) | |
| Peak DAU | | | | -- | |
| New Users (total) | | | | -- | |
| D1 Retention | | | | 45% | |
| D7 Retention | | | | 25% | |
| Completion Rate | | | | 60% | |
| Win Rate | | | | 70-80% | |
| Share Rate | | | | 15% | |
| Error Rate | | | | < 2% | |

Status key: [on-target] [at-risk] [off-track]

---

### 2. Retention Deep Dive

**Cohort Update:**
[Update cohort table with latest data. Call out best/worst performing cohort.]

**Streak Health:**
- Users with active streak: [##%]
- Median streak length: [# days]
- Users who broke streak this week: [##]

**Churn Signal:**
- Users who were active last week but not this week: [##] ([##%])
- Top reason (hypothesis): [e.g., "Monday puzzle was rated 'Too Hard'"]

---

### 3. Engagement Highlights

**Funnel This Week:**
```
App Opened:        [####]  (100%)
Puzzle Started:    [####]  (##%)   [change vs last week]
First Guess:       [####]  (##%)
Completed:         [####]  (##%)
Shared:            [####]  (##%)
```

**Notable Patterns:**
- [e.g., "Thursday puzzle had highest share rate (22%) -- investigate clue quality"]
- [e.g., "Bounce rate spiked on Tuesday after deploy at 2pm -- 502 errors"]

---

### 4. Content Performance

| Day | Puzzle # | Win% | Avg Guesses | Abandon% | Verdict |
|-----|----------|------|-------------|----------|---------|
| Mon | | | | | |
| Tue | | | | | |
| Wed | | | | | |
| Thu | | | | | |
| Fri | | | | | |
| Sat | | | | | |
| Sun | | | | | |

**Content Takeaways:**
- Hardest puzzle: [day] ([win%]) -- [why?]
- Easiest puzzle: [day] ([win%]) -- [too easy?]
- Recommendation: [e.g., "Increase crosser count for weekday puzzles"]

---

### 5. Incidents & Alerts

| When | Alert | Severity | Duration | Impact | Resolution |
|------|-------|----------|----------|--------|------------|
| | | | | | |

---

### 6. Decisions Needed

1. [Decision prompt, e.g., "D1 retention is 38%, below 45% target. Should we prioritize onboarding improvements or push notification reminders?"]
2. [Decision prompt]

---

### 7. Next Week Focus

- [ ] [Action item from this week's data]
- [ ] [Planned experiment or change]
- [ ] [Metric to watch closely]
```

---

## 6. Implementation Sequence

### Week 0 (Pre-Launch)

1. Set up PostHog project and get API key
2. Implement the `Analytics` wrapper class (see ANALYTICS.md Section 3.1)
3. Instrument all 7 P0 events
4. Verify events fire in dev by checking PostHog live events view
5. Create Executive Dashboard in PostHog with the metrics from Section 2.1
6. Configure P0 alerts (API error spike, zero completions)
7. Set up Slack webhook for alert delivery

### Week 1 (Launch Week)

1. Monitor live events hourly on launch day
2. Build Retention Dashboard (Section 2.2) once D1 data is available
3. Build Engagement Dashboard funnel (Section 2.3)
4. Instrument P1 events (tutorial, abandon, crosser_solved)
5. Publish first weekly report (even partial)
6. Configure P1 alerts (win rate, DAU drop)

### Week 2-4 (Post-Launch)

1. Build Content Dashboard (Section 2.4) as puzzle data accumulates
2. Refine alert thresholds based on actual baseline data
3. Add P2 events as features ship
4. First cohort retention analysis (D7 data available)
5. Weekly reports become standard cadence

---

## 7. Data Interpretation Cheat Sheet

For anyone reading dashboards, here is what the numbers mean:

| You See | It Means | You Do |
|---------|----------|--------|
| D1 Retention < 35% | First impression is failing | Fix onboarding, load time, or puzzle clarity |
| D1 Retention > 50% | Strong first impression | Invest in D7 hooks (streaks, notifications) |
| Win Rate < 55% | Puzzles too hard | Reduce crosser count, improve clue quality |
| Win Rate > 85% | Puzzles too easy | Add crossers, use harder words |
| Share Rate < 8% | Share flow broken or unmotivated | Fix share UX, make results more interesting |
| Share Rate > 20% | Viral loop is working | Double down on social features |
| Bounce Rate > 50% | UX or performance barrier | Check load time, first-paint, above-fold content |
| Abandon Rate > 20% | Mid-session friction | Check specific puzzle, review guess-6 loss UX |
| Error Rate > 2% | Reliability problem | Prioritize bug fixes over features |
| DAU/MAU > 40% | Exceptional daily engagement | Product-market fit signal |
| Streak median > 5 | Habit loop established | Protect the streak mechanic at all costs |
