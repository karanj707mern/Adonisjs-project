import { defineConfig } from '@adonisjs/core/http';

const isProduction = process.env.NODE_ENV === 'production'

const app = defineConfig({
  appKey: process.env.APP_KEY,
  http: {
    allowMethodSpoofing: false,
    trustProxy: isProduction ? true : false,
    subdomainOffset: 2,
    cookie: {},
  },
  logger: {
    default: 'app',
    loggers: {
      app: {
        enabled: true,
        level: process.env.NODE_ENV === 'production' ? 'info' : 'trace',
        transport:
          process.env.NODE_ENV === 'production'
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
});

export default app;
