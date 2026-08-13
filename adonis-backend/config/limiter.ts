import env from '@adonisjs/core/services/env'
import { defineConfig } from '@adonisjs/limiter'

export default defineConfig({
  store: 'redis',
  stores: {
    redis: {
      connection: 'local',
      duration: 60000,
      blockDuration: 0,
      max: 100,
    },
  },
})
