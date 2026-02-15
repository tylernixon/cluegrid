import * as Sentry from "@sentry/nextjs";

/**
 * Capture an error with optional extra context.
 */
export function captureError(
  error: unknown,
  context?: Record<string, unknown>,
) {
  Sentry.captureException(error, { extra: context });
}

/**
 * Capture a warning-level message.
 */
export function captureMessage(
  message: string,
  context?: Record<string, unknown>,
) {
  Sentry.captureMessage(message, { extra: context, level: "warning" });
}

/**
 * Set user-level context (anonymous ID only, no PII).
 */
export function setUser(anonymousId: string) {
  Sentry.setUser({ id: anonymousId });
}

/**
 * Clear user context (e.g. on opt-out).
 */
export function clearUser() {
  Sentry.setUser(null);
}

/**
 * Add breadcrumb for debugging context.
 */
export function addBreadcrumb(
  message: string,
  category: string,
  data?: Record<string, unknown>,
) {
  Sentry.addBreadcrumb({ message, category, data, level: "info" });
}
