import { defineConfig } from '@adonisjs/limiter'

export default defineConfig({
  default: 'redis',
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
