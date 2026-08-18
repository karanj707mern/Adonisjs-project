export const serverMiddleware: (() => Promise<{ default: any }>)[] = [
  () => import('@adonisjs/static/static_middleware'),
  () => import('@adonisjs/cors/cors_middleware'),
  () => import('@adonisjs/shield/shield_middleware'),
  () => import('@adonisjs/bodyparser/bodyparser_middleware'),
];

export const middleware = {
  auth: () => import('#middleware/auth_middleware'),
  admin: () => import('#middleware/role_middleware'),
};
