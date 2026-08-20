import 'reflect-metadata';
import { Ignitor } from '@adonisjs/core';
import { fileURLToPath, pathToFileURL } from 'node:url';

const importer = (filePath: string) => import(filePath);

const appRootFromMeta = new URL('../', import.meta.url);
const appRoot = appRootFromMeta.pathname.endsWith('/build/') || appRootFromMeta.pathname.endsWith('\\build\\')
  ? appRootFromMeta
  : new URL('../../', import.meta.url);

new Ignitor(appRoot, importer).httpServer().start();
