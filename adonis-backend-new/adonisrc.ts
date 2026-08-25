import { defineConfig } from '@adonisjs/application';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  preloads: [() => import('#start/routes'), () => import('#start/preloads')],

  providers: [
    () => import('@adonisjs/core/providers/app_provider'),
    () => import('@adonisjs/core/providers/hash_provider'),
    () => import('@adonisjs/core/providers/vinejs_provider'),
    () => import('@adonisjs/core/providers/repl_provider'),
    () => import('@adonisjs/core/providers/app_provider'),
    () => import('@adonisjs/static/static_provider'),
    () => import('@adonisjs/cors/cors_provider'),
    () => import('@adonisjs/shield/shield_provider'),
    () => import('@adonisjs/redis/redis_provider'),

    () => import('#providers/prisma_provider'),
    () => import('#providers/websocket_provider'),
    () => import('#providers/api_provider'),
    () => import('#providers/app_provider'),
  ],

  commands: [() => import('@adonisjs/core/commands')],

  metaFiles: [
    { pattern: 'uploads/**', reloadServer: false },
    { pattern: 'resources/**', reloadServer: false },
  ],

  tests: {
    suites: [],
  },
});
