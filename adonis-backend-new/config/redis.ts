import env from '#adonisjs/env'
import { defineConfig } from '#adonisjs/redis'

export default defineConfig({
  default: 'local',
  connections: {
    local: {
      host: 'localhost',
      port: 6379,
      password: env.get('REDIS_PASSWORD'),
      db: 0,
      keyPrefix: 'moringa:',
    },
  },
})
