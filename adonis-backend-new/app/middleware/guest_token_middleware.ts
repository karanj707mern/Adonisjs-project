import type { HttpContext } from '@adonisjs/core/http';
import type { NextFn } from '@adonisjs/core/types/http';
import { randomUUID } from 'node:crypto';

const COOKIE_NAME = 'guest_token';
const MAX_AGE = 365 * 24 * 60 * 60 * 1000;

/**
 * Replicates the NestJS GuestTokenMiddleware. Guarantees every request has a
 * stable guest token (cookie or `x-guest-token` header) used to attribute
 * cart/wishlist data for anonymous users.
 */
export async function guestTokenMiddleware(ctx: HttpContext, next: NextFn) {
  const headerToken = ctx.request.header('x-guest-token');
  const cookieToken = ctx.request.cookie(COOKIE_NAME);

  const guestToken = (headerToken || cookieToken || randomUUID()) as string;
  (ctx as any).guestToken = guestToken;

  if (!cookieToken && !headerToken) {
    ctx.response.cookie(COOKIE_NAME, guestToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: MAX_AGE,
    });
  }

  await next();
}
