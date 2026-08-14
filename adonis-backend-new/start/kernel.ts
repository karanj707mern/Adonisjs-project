import router from '@adonisjs/core/services/router'
import server from '@adonisjs/core/services/server'

server.errorHandler(() => import('#exceptions/handler'))

server.use([
  () => import('#middleware/force_json_response_middleware'),
  () => import('@adonisjs/cors/cors_middleware'),
  () => import('#middleware/bodyparser_middleware_wrapper'),
  () => import('@adonisjs/shield/shield_middleware'),
  () => import('#middleware/request_context_middleware'),
  () => import('#middleware/guest_token_middleware'),
  () => import('#middleware/csrf_middleware'),
])

router.use([() => import('@adonisjs/session/session_middleware')])

export const middleware = router.named({
  auth: () => import('#middleware/auth_middleware'),
  admin: () => import('#middleware/role_middleware'),
})

export { throttle, authLimiter } from '#start/limiter'
