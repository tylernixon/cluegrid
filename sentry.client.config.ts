import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: process.env.NODE_ENV === "production",

  // Performance: sample 10% of transactions
  tracesSampleRate: 0.1,

  // Session Replay: only capture on errors
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 1.0,

  // Filter noisy browser errors
  ignoreErrors: [
    "ResizeObserver loop",
    "Non-Error promise rejection captured",
    // Safari extensions
    "webkit-masked-url",
    // Chrome extensions
    "chrome-extension://",
    // Firefox extensions
    "moz-extension://",
    // Generic network errors
    "Network request failed",
    "Failed to fetch",
    "Load failed",
  ],

  // Add custom tags for filtering in Sentry dashboard
  initialScope: {
    tags: {
      app: "cluegrid",
      component: "web",
    },
  },

  // Enrich error reports with additional context
  beforeSend(event, hint) {
    // Add browser info
    if (typeof navigator !== "undefined") {
      event.contexts = {
        ...event.contexts,
        browser: {
          name: navigator.userAgent,
          standalone: window.matchMedia("(display-mode: standalone)").matches,
          online: navigator.onLine,
        },
      };
    }

    // Check if this is a game-related error by looking at context
    const gameContext = event.contexts?.game;
    if (gameContext) {
      event.tags = {
        ...event.tags,
        puzzle_id: gameContext.puzzle_id as string | undefined,
        game_state: gameContext.game_state as string | undefined,
      };
    }

    return event;
  },
});
