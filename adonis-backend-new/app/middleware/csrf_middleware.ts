import type { HttpContext } from '@adonisjs/core/http';
import type { NextFn } from '@adonisjs/core/types/http';
import { randomUUID } from 'node:crypto';

/**
 * CSRF protection middleware — ported from Moringa-Backend (NestJS).
 * Issues a `csrf-token` cookie and validates `X-CSRF-Token` header
 * on state-changing requests. Public/guest paths are exempt.
 */

const CSRF_EXEMPT_PATHS = [
  '/auth',
  '/wishlist',
  '/cart',
  '/order/guest',
  '/gift-card',
];

function normalizePath(path: string): string {
  return path.replace(/^\/api\/v1(?=\/|$)/, '') || '/';
}

function isExemptPath(path: string): boolean {
  const normalizedPath = normalizePath(path);
  return CSRF_EXEMPT_PATHS.some(
    (prefix) =>
      normalizedPath === prefix || normalizedPath.startsWith(`${prefix}/`),
  );
}

export default class CsrfMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const tokenCookie = ctx.request.cookie('csrf-token');
    const method = ctx.request.method();
    const isStateChanging = method !== 'GET' && method !== 'HEAD';

    // Issue CSRF cookie if not present
    if (!tokenCookie) {
      ctx.response.cookie('csrf-token', randomUUID().replace(/-/g, ''), {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
    }

    // Validate CSRF token on state-changing requests (skip exempt paths)
    if (isStateChanging && !isExemptPath(ctx.request.url())) {
      const headerToken = ctx.request.header('x-csrf-token');
      const currentCookie = ctx.request.cookie('csrf-token');
      if (currentCookie && headerToken && currentCookie !== headerToken) {
        return ctx.response.status(403).json({ message: 'Invalid CSRF token' });
      }
    }

    return next();
  }
}
