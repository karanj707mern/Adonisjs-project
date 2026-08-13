import { defineConfig } from '@adonisjs/session'

export default defineConfig({
  driver: 'cookie',
  cookieName: 'moringa_session',
  clearWithBrowser: false,
  age: '2h',
  cookie: {
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  },
})
