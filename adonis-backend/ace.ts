import { Ignitor } from '@adonisjs/core';

const importer = (filePath: string) => import(filePath);

new Ignitor(import.meta.url, importer)
  .tap((app) => {
    app.useRuntimeEnv(process.env.NODE_ENV ?? 'development');
  })
  .httpServer()
  .start();
