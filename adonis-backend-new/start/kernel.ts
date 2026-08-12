import { defineConfig } from '#adonisjs/core/http'

export default defineConfig({
  server: {
    middleware: [
      'Adonis/Core/ShieldMiddleware',
      'Adonis/Cors/Middleware',
      'Adonis/Session/Middleware',
      'App/Middleware/GuestTokenMiddleware',
      'App/Middleware/CsrfMiddleware',
      'App/Middleware/RequestContextMiddleware',
      'Adonis/Logger/Middleware',
      'Adonis/BodyParser/Middleware',
    ],
    middlewareGroups: {
      guest: [
        'Adonis/Core/ShieldMiddleware',
        'Adonis/Cors/Middleware',
        'App/Middleware/GuestTokenMiddleware',
      ],
      auth: [
        'Adonis/Core/ShieldMiddleware',
        'Adonis/Cors/Middleware',
        'Adonis/Session/Middleware',
        'App/Middleware/AuthMiddleware',
        'App/Middleware/GuestTokenMiddleware',
        'App/Middleware/CsrfMiddleware',
      ],
      admin: [
        'Adonis/Core/ShieldMiddleware',
        'Adonis/Cors/Middleware',
        'Adonis/Session/Middleware',
        'App/Middleware/AuthMiddleware',
        'App/Middleware/AdminMiddleware',
        'App/Middleware/GuestTokenMiddleware',
        'App/Middleware/CsrfMiddleware',
      ],
    },
  },
})
