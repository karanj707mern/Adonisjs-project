import { Ignitor } from '@adonisjs/core';
import { dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const appRoot = pathToFileURL(__dirname).href + '/';

const ignitor = new Ignitor(appRoot, {
  importer: (filePath) => import(filePath),
});

ignitor.httpServer().start();
