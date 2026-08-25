import * as Sentry from '@sentry/node';
import type { HttpContext } from '@adonisjs/core/http';
import env from '#start/env';

/**
 * Sentry error tracking bootstrap.
 *
 - Disabled unless SENTRY_DSN is set AND SENTRY_ENABLED !== 'false'.
 - Safe no-op in local dev so nothing is sent anywhere by default.
 - Scrubs sensitive fields (PII, auth material) from every event before it
   leaves the process — required by the project's PCI/RBI + DPDP posture.
 */

let initialized = false;

/** Keys whose values are replaced with "[REDACTED]" wherever they appear. */
const REDACTED_KEYS = new Set([
  'email',
  'password',
  'passwordconfirmation',
  'confirmpassword',
  'newpassword',
  'oldpassword',
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
  'razorpaykeyid',
  'razorpaykeysecret',
]);

function redactKey(key: string): boolean {
  return REDACTED_KEYS.has(key.toLowerCase().replace(/[_\-]/g, ''));
}

function scrubValue(value: unknown, depth = 0): unknown {
  if (value === null || value === undefined || depth > 6) return depth > 6 ? '[TRUNCATED]' : value;

  if (Array.isArray(value)) {
    return value.slice(0, 50).map((item) => scrubValue(item, depth + 1));
  }

  if (value instanceof Date) return value.toISOString();

  if (typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      out[key] = redactKey(key) ? '[REDACTED]' : scrubValue(val, depth + 1);
    }
    return out;
  }

  return value;
}

function scrubEventInPlace(event: unknown): void {
  const e = event as Record<string, any>;
  if (!e || typeof e !== 'object') return;
  if (e.contexts) {
    e.contexts = scrubValue(e.contexts);
  }
  if (e.extra) {
    e.extra = scrubValue(e.extra);
  }
  if (e.user) {
    // Keep only an opaque identifier; drop email/username/IP.
    const id = e.user?.id;
    e.user = id ? { id } : undefined;
  }
  if (e.request && typeof e.request === 'object') {
    const request = e.request as Record<string, unknown>;
    if (request.headers) request.headers = '[REDACTED]';
    if (request.cookies) request.cookies = '[REDACTED]';
    if (request.query_string) request.query_string = '[REDACTED]';
    if (request.data) request.data = scrubValue(request.data);
  }
}

/**
 * Initialize Sentry once. Called from AppProvider.boot().
 */
export function initSentry(): void {
  if (initialized) return;

  const dsn = env.get('SENTRY_DSN');
  const enabled = env.get('SENTRY_ENABLED');

  if (!dsn || enabled === false) {
    console.info('[sentry] disabled (SENTRY_DSN unset or SENTRY_ENABLED=false)');
    return;
  }

  try {
    Sentry.init({
      dsn,
      environment: env.get('SENTRY_ENVIRONMENT') || env.get('NODE_ENV') || 'development',
      beforeSend(event) {
        try {
          scrubEventInPlace(event);
          return event;
        } catch {
          return null; // never let scrubbing failures break reporting
        }
      },
    });
    initialized = true;
    console.info(`[sentry] initialized (environment=${String(env.get('SENTRY_ENVIRONMENT') || env.get('NODE_ENV'))})`);
  } catch (error) {
    console.error('[sentry] init failed', error);
  }
}

export function isSentryEnabled(): boolean {
  return initialized;
}

/**
 * Capture a server-side exception enriched with safe request context.
 * Intended for the global exception handler; no-op while uninitialized.
 */
export function captureRequestError(error: unknown, ctx?: HttpContext): void {
  if (!initialized) return;

  const url = ctx?.request?.url?.(true) ?? undefined;
  const method = ctx?.request?.method?.();

  try {
    Sentry.captureException(error, {
      tags: {
        ...(url ? { path: url.split('?')[0] } : {}),
        ...(method ? { method } : {}),
        handled: 'exception_handler',
      },
      contexts: {
        request: {
          ...(url ? { url } : {}),
          ...(method ? { method } : {}),
          ...(ctx?.request?.ip() ? { ip_address: '{{auto}}' } : {}),
        },
      },
      level: 'error',
    });
  } catch (captureError) {
    console.error('[sentry] capture failed', captureError);
  }
}
