import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import { pathToFileURL } from 'node:url';
import { Ignitor } from '@adonisjs/core';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const appRoot = pathToFileURL(__dirname).href + '/';

const ignitor = new Ignitor(appRoot, {
  importer: (filePath) => import(filePath),
});

try {
  const app = ignitor.createApp('web');
  await app.init();
  console.log('init complete');
  console.log('providers count:', app.rcFile?.providers?.length || 0);
  console.log('providers:', app.rcFile?.providers?.map((p, i) => `[${i}] ${typeof p}`) || []);
  
  await app.boot();
  console.log('boot complete');
  
  const bindings = app.container.bindings || {};
  console.log('bindings count:', Object.keys(bindings).length);
  
  try {
    const server = await app.container.make('server');
    console.log('server resolved:', typeof server);
  } catch (e) {
    console.log('server resolve error:', e.message);
  }
} catch (error) {
  console.error('Error:', error.message);
  console.error(error.stack);
}
