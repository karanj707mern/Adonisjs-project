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

ignitor.httpServer().start();
