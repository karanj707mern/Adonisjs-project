# AdonisJS Migration Conventions

This project is being migrated from **NestJS → AdonisJS v6**. The original NestJS
source is preserved in `legacy-nest-src/` for reference. Read it to port logic 1:1.

## Project layout (already created — DO NOT modify these)

```
adonis-backend/
  adonisrc.ts            # providers + alias map (#controllers, #services, ...)
  env.ts                 # Env validation schema (uses @adonisjs/core Env)
  bin/server.ts          # httpServer entry
  ace.ts                 # ace entry
  config/                # app, bodyparser, cors, static, shield, redis, limiter, session
  start/
    routes.ts            # imports your `register<Module>(router)` fns inside `api/v1` group
    kernel.ts            # serverMiddleware + named middleware: auth, admin
    preloads.ts
  app/
    providers/
      prisma_provider.ts   # binds 'Prisma' (PrismaClient singleton)
      app_provider.ts      # binds 'Storage', 'RedisCache'
      websocket_provider.ts
    contracts/prisma.ts     # ContainerBindings types
    exceptions/handler.ts  # global handler
    middleware/             # auth, role, guest_token, request_context, csrf
    services/               # storage_service, redis_cache_service (shared)
```

## How to map NestJS → AdonisJS

| NestJS | AdonisJS v6 |
| --- | --- |
| `@Module` | a folder `app/controllers/<module>/` + a `register<Module>(router)` route fn |
| `@Controller('prefix')` | route definitions registered under that `prefix` |
| `@Injectable() Service` | `@injectable() class` in same folder; inject deps via constructor `@inject('Prisma')` |
| `constructor(private prisma: PrismaService)` | `constructor(@inject('Prisma') private prisma: PrismaClient)` |
| `private storage: StorageService` | `constructor(@inject('Storage') private storage: StorageService)` |
| `private cache: RedisCacheService` | `@inject('RedisCache') private cache: RedisCacheService` |
| `@Get('x') getX()` | `router.get('x', [Controller, 'getX'])` (inside register fn) |
| `@Post('x')` | `router.post('x', [Controller, 'method'])` |
| `@Param('id', ParseIntPipe)` | `const id = Number(params.id)` (or `router.param`) |
| `@Body() dto` | `const data = await request.validateUsing(schema)` |
| `class-validator DTO` | Vine schema: `export const storeValidator = vine.compile(vine.object({...}))` |
| `@UseGuards(JwtAuthGuard)` | `router.get('x', [Controller,'m']).middleware('auth')` |
| `@Roles('ADMIN')` / admin guard | `.middleware('admin')` |
| `UnauthorizedException` | `throw new UnauthorizedException('msg')` from `@adonisjs/core/http` |
| `BadRequestException` / `NotFoundException` / `ForbiddenException` / `ConflictException` | same import from `@adonisjs/core/http` |
| `Request, Response` (express) | `HttpContext` → `ctx.request`, `ctx.response` |
| `res.cookie(...)` | `ctx.response.cookie(name, value, opts)` / `ctx.response.clearCookie(name, opts)` |
| `req.cookies.x` | `ctx.request.cookie('x')` |
| `req.headers['x']` | `ctx.request.header('x')` |
| `return res.json({...})` | `return ctx.response.json({...})` OR `return {...}` (auto JSON) |
| `res.status(204).send()` | `return ctx.response.status(204).send('')` |

## HttpContext augmentation (already declared)

`ctx.auth = { user: { id, role, ... } }` (set by auth_middleware),
`ctx.guestToken` (guest_token_middleware), `ctx.requestId`.

## Your route registration function (REQUIRED signature)

Create `app/controllers/<module>/<module>_routes.ts`:

```ts
import type { Router } from '@adonisjs/core/http'
import AuthController from './auth_controller'

export default function registerAuth(router: Router) {
  router.post('auth/login', [AuthController, 'login'])
  router.group(() => {
    router.get('auth/profile', [AuthController, 'getProfile'])
  }).middleware('auth')
}
```

`start/routes.ts` already imports your default export as `register<Module>` and calls
it inside `router.group(..., { prefix: 'api/v1' })`. Keep the EXACT prefix string that
the legacy `@Controller('...')` used (e.g. `auth`, `product`, `users`, `blog`, `cart`,
`order`, `coupon`, `admin`, `review`, `wishlist`, `settings`, `hero`, `new-arrival`,
`gift-card`, `notification`, `email-template`, `audit`, `analytics`, `health`).

## Controllers

```ts
import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/fold'
import type { PrismaClient } from '@prisma/client'

@inject()
export default class AuthController {
  constructor(@inject('Prisma') private prisma: PrismaClient) {}
  async login({ request, response }: HttpContext) { ... }
}
```

Use `@inject()` on the controller class so the container resolves constructor deps.
Inject `Prisma`, `Storage`, `RedisCache` by string binding. For module-to-module
service reuse, import the other service class directly and let the container resolve it
(also `@injectable()`).

## Validators (Vine)

```ts
import vine from '@vinejs/vine'
export const loginValidator = vine.compile(
  vine.object({ email: vine.string().email(), password: vine.string().minLength(6) })
)
// in controller: const data = await request.validateUsing(loginValidator)
```

If a DTO had no validation (e.g. just types), you may skip the validator and read the
body via `request.all()` / `request.body()` — but prefer Vine when the original used
`class-validator` rules.

## File uploads

Multer `FileInterceptor('avatar')` → Adonis bodyparser. In controller:
```ts
const file = request.file('avatar', { size: '5mb', extnames: ['jpg','png','webp','avif','gif'] })
const buffer = await file.toBuffer()
await storage.uploadFile({ buffer, mimetype: file.type, originalname: file.clientName }, 'avatars')
```

## Throttling / captcha

Skip `@Throttle`/`@UseGuards(AuthThrottlerGuard)` mapping (optional). Keep captcha flow
logic (call `captchaService`). Do not add new throttler guards.

## Hard rules

1. DO NOT edit any file outside your assigned `app/controllers/<module>/` folder and its
   subfiles. Do not touch `start/routes.ts`, `config/`, `app/middleware/`, `app/providers/`.
2. Reuse the existing `StorageService` and `RedisCacheService` via `@inject('Storage')` /
   `@inject('RedisCache')`. Do NOT re-create them.
3. Reuse `prisma` models exactly as in `legacy-nest-src/prisma/schema.prisma`.
4. Keep response shapes (JSON) identical to the NestJS controller so the frontend still works.
5. Keep the same HTTP method + path. Group protected routes with `.middleware('auth')` and
   admin routes with `.middleware('admin')`.
6. Use TypeScript, `strict` is on but `noImplicitAny` is off — still avoid `any` where easy.
7. Add a short `@injectable()` to every service and `@inject()` to every controller.

## Reference map of modules to legacy folders

- auth → legacy-nest-src/src/auth/*
- user → legacy-nest-src/src/user/*
- product → legacy-nest-src/src/product/*
- cart → legacy-nest-src/src/cart/*
- order → legacy-nest-src/src/order/*
- settings → legacy-nest-src/src/settings/*
- review → legacy-nest-src/src/review/*
- blog → legacy-nest-src/src/blog/*
- wishlist → legacy-nest-src/src/wishlist/*
- coupon → legacy-nest-src/src/coupon/*
- admin → legacy-nest-src/src/admin/*
- health → legacy-nest-src/src/health/*
- audit → legacy-nest-src/src/audit/*
- analytics → legacy-nest-src/src/analytics/*
- hero → legacy-nest-src/src/hero/*
- new-arrival → legacy-nest-src/src/new-arrival/*
- gift-card → legacy-nest-src/src/gift-card/*
- notification/email-template → legacy-nest-src/src/notification/*
- common utils (sanitize, redirect) → legacy-nest-src/src/common/*
