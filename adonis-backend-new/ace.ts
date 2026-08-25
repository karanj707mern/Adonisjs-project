import { Ignitor } from '@adonisjs/core';
import { dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

// eslint-disable-next-line @typescript-eslint/naming-convention
const __filename = fileURLToPath(import.meta.url);
// eslint-disable-next-line @typescript-eslint/naming-convention
const __dirname = dirname(__filename);
const appRoot = new URL(pathToFileURL(__dirname).href + '/');

const ignitor = new Ignitor(appRoot, {
  importer: (filePath) => import(filePath),
});

ignitor.httpServer().start();
