import env from '#start/env'
import { defineConfig } from '@adonisjs/redis'

export default defineConfig({
  connection: 'local',
  connections: {
    local: {
      host: env.get('REDIS_HOST') || new URL(env.get('REDIS_URL') || 'redis://localhost:6379').hostname,
      password: env.get('REDIS_PASSWORD') || undefined,
      port: Number(env.get('REDIS_PORT')) || 6379,
      db: Number(env.get('REDIS_DB')) || 0,
      keyPrefix: env.get('REDIS_KEY_PREFIX') || '',
      retryStrategy: (times: number) => Math.min(times * 50, 2000),
    },
  },
})
