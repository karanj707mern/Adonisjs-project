import { defineConfig } from '@adonisjs/redis'

export default defineConfig({
  connection: 'local',
  connections: {
    local: {
      host: process.env.REDIS_URL || 'redis://localhost:6379',
      password: '',
      port: 6379,
      db: 0,
      keyPrefix: '',
      retryStrategy: (times: number) => Math.min(times * 50, 2000),
    },
  },
})
