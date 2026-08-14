import { defineConfig, stores } from '@adonisjs/session'

const sessionConfig = defineConfig({
  enabled: true,
  store: 'cookie',
  cookieName: 'moringa_session',
  clearWithBrowser: false,
  age: '2h',
  cookie: {
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  },
  stores: {
    cookie: stores.cookie(),
    database: stores.database(),
  },
})

export default sessionConfig
