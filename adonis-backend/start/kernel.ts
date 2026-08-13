import router from '@adonisjs/core/services/router'
import server from '@adonisjs/core/services/server'
import { requestContextMiddleware } from '#middleware/request_context_middleware'
import { guestTokenMiddleware } from '#middleware/guest_token_middleware'
import { csrfMiddleware } from '#middleware/csrf_middleware'

export const serverMiddleware: (() => Promise<{ default: any }>)[] = [
  () => import('@adonisjs/static/static_middleware'),
  () => import('@adonisjs/cors/cors_middleware'),
  () => import('@adonisjs/shield/shield_middleware'),
  () => import('@adonisjs/bodyparser/bodyparser_middleware'),
]

export const middleware = {
  auth: () => import('#middleware/auth_middleware'),
  admin: () => import('#middleware/role_middleware'),
}
