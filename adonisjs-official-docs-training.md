# AdonisJS Official Docs Training

> Source: docs.adonisjs.com fetched on 2026-08-18
> Purpose: Quick reference when working on AdonisJS-related prompts.

## Framework Overview

- **Version**: AdonisJS v7
- **Language**: TypeScript, ESM-only
- **Philosophy**: Backend-first, type-safe, batteries-included, conventions over configuration
- **Pattern**: MVC with configurable view layer (Edge, Inertia, Vue/React, or API-only)

## Routing

- Define routes in `start/routes.ts` using `router` service
- Methods: `get`, `post`, `put`, `patch`, `delete`, `any`, `route`
- Params: `:id`, `:slug?` (optional), `*` (wildcard)
- Validation via `.where()`:
  - Built-in: `router.matchers.number()`, `router.matchers.uuid()`, `router.matchers.slug()`
  - Global: `router.where('id', router.matchers.uuid())`
- Groups: `.prefix()`, `.as()`, `.use(middleware)`, `.domain()`
- Resources: `router.resource('posts', controllers.Posts)` with modifiers:
  - `.apiOnly()`, `.only([...])`, `.except([...])`
  - `.params({ posts: 'post' })` to rename params
  - `.use(['store', 'update'], middleware.auth())` per action
- Nested: `router.resource('posts.comments', controllers.Comments)`
- Shallow: `router.shallowResource(...)` omits parent ID where child is globally unique
- Shortcuts: `router.on('/').render('home')`, `router.on('/').renderInertia('home')`
- Redirects: `redirectToRoute()`, `redirectToPath()`, support `qs` for query strings
- Order matters: static routes must be defined before dynamic routes

## Controllers

- Location: `app/controllers/` (configurable via `adonisrc.ts`)
- Barrel file: `#generated/controllers` auto-generated; never manually import controllers in routes
- Lifecycle: instantiated per request by IoC container
- Resource-driven actions:
  - `index`, `create`, `store`, `show`, `edit`, `update`, `destroy`
- Dependency injection:
  - Constructor: `@inject()` decorator + type-hinted constructor params
  - Method: `@inject()` on individual methods; first param is always `HttpContext`
- Example:
  ```ts
  @inject()
  export default class UsersController {
    constructor(protected userService: UserService) {}
    async index(ctx: HttpContext) { ... }
  }
  ```

## Validation

- Library: VineJS (`@vinejs/vine`)
- Location: `app/validators/`
- Define schemas with `vine.create({...})`
- Usage in controller: `const payload = await request.validateUsing(createPostValidator)`
- Auto error handling via content negotiation:
  - Web: redirect with flash messages
  - Inertia: redirect with shared state
  - API: JSON 422 with `errors` array
- Validate multiple sources:
  ```ts
  vine.create({
    username: vine.string(),
    params: vine.object({ id: vine.number() }),
    headers: vine.object({ 'x-api-key': vine.string() })
  })
  ```
- Metadata: `vine.withMetaData<{ userId: number }>().create({...})`, pass via `validateUsing(schema, { meta: { userId } })`
- Custom messages: `start/validator.ts` with `SimpleMessagesProvider` or i18n
- Outside HTTP: `await validator.validate(data)` in jobs/commands

## Lucid ORM

- Built on Knex; supports MySQL, PostgreSQL, SQLite, MSSQL, Turso
- Config: `config/database.ts`

### Migrations
- Generate: `node ace make:migration posts`
- Timestamped files in `database/migrations/`
- `up()` / `down()` methods; run with `node ace migration:run`
- Auto-generates `database/schema.ts` with typed schema classes

### Models
- Generate: `node ace make:model Post`
- Extend auto-generated schema class
- CRUD:
  - Create: `await Post.create({ title, content })`
  - Read: `await Post.findOrFail(id)`, `Post.query().where(...).firstOrFail()`
  - Update: `await post.merge({...}).save()`
  - Delete: `await post.delete()`
- Query builder: `Post.query().where(...).orderBy(...).paginate(page, limit)`

### Relationships
- `hasMany(() => Post)`, `belongsTo(() => User)`, `manyToMany(() => Team)`
- Eager loading: `Post.query().preload('user', (q) => q.preload('profile'))`
- Pivot columns: `@manyToMany(() => Team, { pivotColumns: ['role'] })`

### Hooks
- `@beforeSave()`, `@beforeCreate()`, `@afterCreate()`, `@beforeFind()`, etc.
- Access dirty fields via `user.$dirty.password`
- Warning: direct query builder updates bypass hooks

### Transactions
- `await db.transaction(async (trx) => { ... })`
- Auto-commit on success, rollback on exception

### Serialization
- `response.json(user.serialize({ fields: { omit: ['password'] }, relations: { ... } }))`
- Column-level: `@column({ serializeAs: null })` to omit; `@column({ serializeAs: 'firstName' })` to rename

### Factories
- Generate: `node ace make:factory Post`
- `PostFactory.create()`, `PostFactory.createMany(10)`, `.merge({...})`, `.apply('published')`

## Middleware
- Register in `start/kernel.ts`
- Apply per route: `.use(middleware.auth())`
- Group-level middleware runs before route-level

## Exception Handling
- Global handler: `app/exceptions/handler.ts`
- Handle `E_ROUTE_NOT_FOUND` for custom 404 pages

## Testing
- Framework: Japa
- Tests: `tests/` directory
- Database assertions, test doubles available

## Key Commands
- `node ace make:controller posts`
- `node ace make:controller posts --resource`
- `node ace make:validator post`
- `node ace make:migration posts`
- `node ace make:model Post`
- `node ace make:factory Post`
- `node ace serve --hmr` (dev)
- `node ace list:routes`

## Important Conventions
- TypeScript everywhere; no plain JS
- ESM modules (`import`/`export`)
- Barrel files for controllers, validators, etc.
- `#imports` aliases: `#controllers`, `#models`, `#validators`, `#services`, `#start/*`
- Database-first schema via migrations; never edit `database/schema.ts` directly
- Hooks do not fire on query builder mass updates
