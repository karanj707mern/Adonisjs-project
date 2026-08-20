import type { HttpContext } from '@adonisjs/core/http';
import type { NextFn } from '@adonisjs/core/types/http';
import { UnauthorizedException } from '#exceptions/http_exceptions';
import { inject } from '@adonisjs/fold';
import jwt from 'jsonwebtoken';
import env from '#start/env';
import type { PrismaClient } from '@prisma/client';
import PrismaService from '#services/prisma_service';

export default class AuthMiddleware {
  constructor(private prisma: PrismaClient = new PrismaService().getClient()) {}

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
      const userId = payload.sub ?? payload.id;

      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, role: true, name: true },
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      ctx.auth = {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          name: user.name,
          ...payload,
        },
      };
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }

    await next();
  }
}
