import { defineConfig } from '@adonisjs/application';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  tsconfigPath: 'tsconfig.json',

  preloads: [() => import('#start/routes'), () => import('#start/preloads')],

  providers: [
    () => import('@adonisjs/core/providers/app_provider'),
    () => import('@adonisjs/static/static_provider'),
    () => import('@adonisjs/cors/cors_provider'),
    () => import('@adonisjs/shield/shield_provider'),
    () => import('@adonisjs/redis/redis_provider'),

    () => import('#providers/prisma_provider'),
    () => import('#providers/websocket_provider'),
  ],

  commands: [() => import('@adonisjs/core/commands')],

  alias: {
    '#controllers': 'app/controllers',
    '#services': 'app/services',
    '#middleware': 'app/middleware',
    '#validators': 'app/validators',
    '#exceptions': 'app/exceptions',
    '#providers': 'app/providers',
    '#lib': 'app/lib',
    '#contracts': 'app/contracts',
    '#start': 'start',
    '#config': 'config',
  },

  metaFiles: [
    { pattern: 'uploads/**', reloadServer: false },
    { pattern: 'resources/**', reloadServer: false },
  ],

  tests: {
    suites: [],
  },
});
