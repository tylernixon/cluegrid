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
  ],
});
