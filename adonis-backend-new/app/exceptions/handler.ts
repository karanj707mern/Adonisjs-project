import type { HttpContext } from '@adonisjs/core/http';
import { type Exception } from '@adonisjs/core/exceptions';

/**
 * Global exception handler. AdonisJS routes exceptions here when they bubble up
 * from controllers/middleware. Mirrors the previous NestJS GlobalExceptionFilter.
 */
export default class ExceptionHandler {
  async handle(error: Exception, ctx?: HttpContext) {
    const status = error.status || 500;
    const code = (error as any).code;

    console.error('ExceptionHandler.handle called', {
      errorMessage: error.message,
      errorStack: error.stack,
      ctxExists: !!ctx,
      ctxType: ctx?.constructor?.name,
      requestExists: !!ctx?.request,
      responseExists: !!ctx?.response,
    });

    if (status >= 500) {
      const url = ctx?.request?.url?.() || 'unknown';
      console.error(
        { err: error.message, stack: error.stack, url },
        `Unhandled error in ${url}`,
      );
    }

    if (!ctx?.response) {
      return { status, message: error.message || 'Internal Server Error' };
    }

    return ctx.response.status(status).json({
      status,
      message: error.message || 'Internal Server Error',
      ...(code ? { code } : {}),
      ...(process.env.NODE_ENV !== 'production' && status >= 500
        ? { stack: error.stack }
        : {}),
    });
  }

  async report(error: unknown, ctx?: HttpContext) {
    const url = ctx?.request?.url?.() || 'unknown';
    console.error(
      { err: (error as Error).message, url },
      'Exception reported',
    );
  }
}
