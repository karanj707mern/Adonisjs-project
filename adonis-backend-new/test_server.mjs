import { Ignitor } from '@adonisjs/core';

const appRoot = new URL('.', import.meta.url);

const ignitor = new Ignitor(appRoot, {
  importer: (filePath) => import(filePath),
});

try {
  const app = ignitor.createApp('web');
  await app.init();
  await app.boot();
  
  console.log('Providers registered:');
  
  await app.start(async () => {
    console.log('App started!');
    const server = await app.container.make('server');
    console.log('Server:', typeof server);
    process.exit(0);
  });
} catch (error) {
  console.error('Error:', error.message);
  console.error(error.stack);
  process.exit(1);
}
