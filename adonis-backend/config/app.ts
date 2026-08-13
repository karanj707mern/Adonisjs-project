import env from '@adonisjs/core/services/env'
import { defineConfig } from '@adonisjs/core'

const app = defineConfig({
  appKey: env.get('APP_KEY'),
  http: {
    allowMethodSpoofing: false,
    trustProxy: () => true,
    subdomainOffset: 2,
    cookie: {},
  },
  logger: {
    default: 'app',
    loggers: {
      app: {
        enabled: true,
        level: env.get('NODE_ENV') === 'production' ? 'info' : 'trace',
        transport: env.get('NODE_ENV') === 'production'
          ? undefined
          : {
              targets: [
                {
                  target: 'pino-pretty',
                  options: { colorize: true },
                },
              ],
            },
      },
    },
  },
})

export default app
