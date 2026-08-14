import { Exception } from '@adonisjs/core/exceptions'
import logger from '#start/logger'

/**
 * Global exception handler. AdonisJS routes exceptions here when they bubble up
 * from controllers/middleware. Mirrors the previous NestJS GlobalExceptionFilter.
 */
export default class ExceptionHandler {
  async handle(error: Exception, ctx: HttpContext) {
    const status = error.status || 500
    const code = (error as any).code

    if (status >= 500) {
      logger.error(
        { err: error.message, stack: error.stack },
        `Unhandled error in ${ctx.request.url()}`
      )
    }

    return ctx.response.status(status).json({
      status,
      message: error.message || 'Internal Server Error',
      ...(code ? { code } : {}),
      ...(process.env.NODE_ENV !== 'production' && status >= 500 ? { stack: error.stack } : {}),
    })
  }

  async report(error: unknown, ctx: HttpContext) {
    logger.error({ err: (error as Error).message, url: ctx.request.url() }, 'Exception reported')
  }
}
