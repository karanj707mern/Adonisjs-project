/**
 * Guarantees JSON response serialization works.
 * Patches the response prototype to ensure serializeJSON is always available.
 */
import type { HttpContext } from '@adonisjs/core/http';
import type { NextFn } from '@adonisjs/core/types/http';

// Safe JSON serializer (same as Adonis safeStringify)
function safeStringify(payload: unknown): string {
  if (payload === null || payload === undefined) return '';
  if (typeof payload === 'string') return payload;
  if (payload instanceof Date) return payload.toISOString();
  return JSON.stringify(payload, (_key, value) => {
    if (typeof value === 'bigint') return value.toString();
    return value;
  });
}

export default class JsonResponseMiddleware {
  async handle(ctx: HttpContext, next: NextFn): Promise<void> {
    // Patch the response object's internal config via prototype
    const responseConstructor = ctx.response.constructor as unknown as {
      prototype: { serializeJSON?: (payload: unknown) => string };
    };

    if (typeof responseConstructor.prototype.serializeJSON !== 'function') {
      responseConstructor.prototype.serializeJSON = safeStringify;
    }

    await next();
  }
}
