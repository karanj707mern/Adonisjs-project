import { Ignitor } from '@adonisjs/core';

const appRoot = process.cwd();
const importer = (filePath) => import(filePath);

const ignitor = new Ignitor(appRoot, importer);
const app = ignitor.createApp('console');
await app.init();
await app.boot();
await app.start(async () => {
  const router = await app.container.make('router');
  console.log('routes loaded');
  console.log('routes count:', router.routes.length);
  console.log('routes:', router.routes.map(r => ({ method: r.method, pattern: r.pattern })));
});
