import { Ignitor } from '@adonisjs/core';

const appRoot = new URL('.', import.meta.url);

const ignitor = new Ignitor(appRoot, {
  importer: (filePath) => import(filePath),
});

try {
  const app = ignitor.createApp('web');
  await app.init();
  console.log('After init, state:', app.state); // Check if accessible
  console.log('Container exists:', !!app.container);
  
  await app.boot();
  console.log('After boot, state:', app.state);
  console.log('Has server binding:', await app.container.has('server'));
  
  process.exit(0);
} catch (error) {
  console.error('Error:', error.message);
  console.error(error.stack);
  process.exit(1);
}
