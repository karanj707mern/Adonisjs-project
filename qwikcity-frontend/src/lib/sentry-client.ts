import * as Sentry from '@sentry/browser';

/**
 * Client-side error tracking (Sentry protocol — Sentry SaaS or GlitchTip).
 *
 - No-op unless PUBLIC_SENTRY_DSN is set, or when PUBLIC_SENTRY_ENABLED=false.
 - Must only run in the browser; call from root.tsx module scope.
 - Scrubs sensitive fields from events before they leave the browser,
   matching the backend scrubber's PCI/RBI + DPDP posture.
 */

const REDACTED_KEYS = new Set([
  'email',
  'password',
  'passwordconfirmation',
  'confirmpassword',
  'token',
  'accesstoken',
  'refreshtoken',
  'guesttoken',
  'authorization',
  'cookie',
  'csrf',
  'captcha',
  'captchaInput',
  'otp',
  'phone',
  'phonenumber',
  'mobile',
  'fullname',
  'firstname',
  'lastname',
  'addressline1',
  'addressline2',
  'address',
  'street',
  'city',
  'pincode',
  'zipcode',
  'cardnumber',
  'card',
  'cvv',
]);

function redactKey(key: string): boolean {
  return REDACTED_KEYS.has(key.toLowerCase().replace(/[_\-]/g, ''));
}

function scrubValue(value: unknown, depth = 0): unknown {
  if (value === null || value === undefined || depth > 6) return depth > 6 ? '[TRUNCATED]' : value;

  if (Array.isArray(value)) {
    return value.slice(0, 50).map((item) => scrubValue(item, depth + 1));
  }

  if (typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      out[key] = redactKey(key) ? '[REDACTED]' : scrubValue(val, depth + 1);
    }
    return out;
  }

  return value;
}

let initialized = false;

export function initSentryClient(): void {
  if (initialized || typeof window === 'undefined') return;

  const dsn = import.meta.env.PUBLIC_SENTRY_DSN;
  if (!dsn || import.meta.env.PUBLIC_SENTRY_ENABLED === 'false') return;

  try {
    Sentry.init({
      dsn,
      environment:
        import.meta.env.PUBLIC_SENTRY_ENVIRONMENT ||
        (import.meta.env.DEV ? 'development' : 'production'),
      // Ignore noise that carries no diagnostic value for a storefront.
      ignoreErrors: [
        /ResizeObserver loop/i,
        /Non-Error promise rejection captured/i,
        /Failed to fetch dynamically imported module/i,
        'Network Error',
        'Load failed',
        'Failed to fetch',
      ],
      beforeSend(event) {
        try {
          if (event.contexts) {
            event.contexts = scrubValue(event.contexts) as Sentry.Event['contexts'];
          }
          if (event.extra) {
            event.extra = scrubValue(event.extra) as Sentry.Event['extra'];
          }
          if (event.user) {
            const id = event.user.id;
            event.user = id ? { id } : undefined;
          }
          if (event.request && typeof event.request === 'object') {
            const request = event.request as Record<string, unknown>;
            if (request.headers) request.headers = '[REDACTED]';
            if (request.cookies) request.cookies = '[REDACTED]';
          }
          return event;
        } catch {
          return null; // never let scrubbing failures break the app
        }
      },
    });
    initialized = true;
  } catch (error) {
    console.error('[sentry] client init failed', error);
  }
}
