import type { HttpContext } from '@adonisjs/core/http';
import type { NextFn } from '@adonisjs/core/types/http';
import { randomUUID } from 'node:crypto';
import RequestContextService from '#services/request_context_service';

declare module '@adonisjs/core/http' {
  interface HttpContext {
    requestId: string;
    auth?: {
      user: {
        id: number;
        role: string;
        [key: string]: any;
      };
    };
    guestToken?: string;
  }
}

export async function requestContextMiddleware(ctx: HttpContext, next: NextFn) {
  const requestId = (ctx.request.header('x-request-id') ||
    randomUUID()) as string;
  const user = (ctx as any).auth?.user;
  const ip = ctx.request.ip();
  const userAgent = ctx.request.header('user-agent');

  RequestContextService.run(
    {
      requestId,
      userId: user?.id,
      ip,
      userAgent,
    },
    () => next(),
  );
}
