import * as Sentry from "npm:@sentry/deno@^8";

let initialized = false;

export function initSentry() {
  if (initialized) return;
  const dsn = Deno.env.get("SENTRY_DSN");
  if (!dsn) return;
  Sentry.init({
    dsn,
    defaultIntegrations: false,  // required: Deno isolates reuse scope
    tracesSampleRate: 1.0,
    environment: Deno.env.get("SENTRY_ENVIRONMENT") ?? "production",
  });
  initialized = true;
}

export function capturePaymentError(
  err: unknown,
  context: Record<string, unknown>,
) {
  const dsn = Deno.env.get("SENTRY_DSN");
  if (!dsn) {
    // No DSN — log structured JSON only.
    console.error(JSON.stringify({
      level: "error",
      stage: "payment",
      ...context,
      message: err instanceof Error ? err.message : String(err),
    }));
    return;
  }
  Sentry.withScope((scope) => {
    for (const [k, v] of Object.entries(context)) scope.setExtra(k, v);
    Sentry.captureException(err);
  });
}

export async function flushSentry(ms = 2000) {
  const dsn = Deno.env.get("SENTRY_DSN");
  if (!dsn) return;
  await Sentry.flush(ms);
}