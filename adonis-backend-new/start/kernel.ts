import router from '@adonisjs/core/services/router';

export const serverMiddleware: (() => Promise<{ default: any }>)[] = [
  () => import('#middleware/json_response_middleware'),
  () => import('@adonisjs/static/static_middleware'),
  () => import('@adonisjs/cors/cors_middleware'),
  async () => {
    const m = await import('@adonisjs/bodyparser/bodyparser_middleware');
    return { default: m.BodyParserMiddleware };
  },
];

/**
 * Named middleware store (AdonisJS v7 pattern).
 * Usage in routes: .middleware(middleware.auth())
 */
export const middleware = router.named({
  auth: () => import('#middleware/auth_middleware'),
  admin: () => import('#middleware/role_middleware'),
});
