import env from '#start/env'
import app from '@adonisjs/core/services/app'
import { defineConfig } from '@adonisjs/cors'

const corsOrigins = (env.get('CORS_ORIGIN') as string | undefined)
  ?.split(',')
  .map((origin) => origin.trim())
  .filter(Boolean) ?? []

/**
 * Configuration options to tweak the CORS policy. The following
 * options are documented on the official documentation website.
 *
 * https://docs.adonisjs.com/guides/security/cors
 */
const corsConfig = defineConfig({
  /**
   * Enable or disable CORS handling globally.
   */
  enabled: true,

  /**
   * Allow origins from the CORS_ORIGIN environment variable.
   * In development, fall back to localhost origins for convenience.
   * In production, require explicit configuration.
   */
  origin: (origin: string) => {
    if (!corsOrigins.length) {
      return app.inDev ? true : false
    }
    return corsOrigins.includes(origin)
  },

  /**
   * HTTP methods accepted for cross-origin requests.
   */
  methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE'],

  /**
   * Reflect request headers by default. Use a string array to restrict
   * allowed headers.
   */
  headers: true,

  /**
   * Response headers exposed to the browser.
   */
  exposeHeaders: [],

  /**
   * Allow cookies/authorization headers on cross-origin requests.
   */
  credentials: true,

  /**
   * Cache CORS preflight response for N seconds.
   */
  maxAge: 90,
})

export default corsConfig
