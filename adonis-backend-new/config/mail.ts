import env from '#adonisjs/env'
import { defineConfig } from '#adonisjs/mail'

export default defineConfig({
  default: 'smtp',
  from: {
    address: env.get('EMAIL_FROM'),
    name: env.get('EMAIL_FROM_NAME'),
  },
  mailers: {
    smtp: {
      driver: 'smtp',
      host: env.get('SMTP_HOST'),
      port: env.get('SMTP_PORT'),
      secure: env.get('SMTP_SECURE'),
      auth: {
        user: env.get('SMTP_USER'),
        pass: env.get('SMTP_PASS'),
      },
    },
    log: {
      driver: 'log',
    },
    memory: {
      driver: 'memory',
    },
  },
})
