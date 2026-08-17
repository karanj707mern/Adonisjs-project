import type { HttpContext } from '@adonisjs/core/http';
import type { NextFn } from '@adonisjs/core/types/http';
import { UnauthorizedException } from '@adonisjs/core/http';
import jwt from 'jsonwebtoken';
import env from '@adonisjs/core/services/env';

/**
 * Replicates the NestJS JwtAuthGuard. Verifies the access token from the
 * `accessToken` cookie or `Authorization: Bearer` header and attaches the
 * decoded user to `ctx.auth`.
 */
export default class AuthMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const token =
      ctx.request.cookie('accessToken') ||
      (ctx.request.header('authorization') || '')
        .replace(/^Bearer\s+/i, '')
        .trim() ||
      null;

    if (!token) {
      throw new UnauthorizedException('Authentication required');
    }

    try {
      const payload = jwt.verify(token, env.get('JWT_SECRET')) as any;
      ctx.auth = {
        user: {
          id: payload.sub ?? payload.id,
          role: payload.role,
          ...payload,
        },
      };
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }

    await next();
  }
}
