import { defineConfig } from '#adonisjs/auth'

export default defineConfig({
  guard: 'web',
  guards: {
    web: {
      driver: 'session',
      provider: {
        driver: 'lucid',
        identifierKey: 'id',
        uids: ['email'],
        model: () => import('#models/user'),
      },
    },
    api: {
      driver: 'basic',
      provider: {
        driver: 'lucid',
        identifierKey: 'id',
        uids: ['email'],
        model: () => import('#models/user'),
      },
    },
  },
})
