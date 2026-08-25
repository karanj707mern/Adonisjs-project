import 'reflect-metadata';
import { HttpResponse } from '@adonisjs/http-server';
// Ensure JSON serializer is always available on responses
const AnyHttpResponse = HttpResponse as unknown as {
  prototype: Record<string, unknown>;
};
if (typeof AnyHttpResponse.prototype.serializeJSON !== 'function') {
  AnyHttpResponse.prototype.serializeJSON = (payload: unknown): string => {
    if (payload === null || payload === undefined) return '';
    if (typeof payload === 'string') return payload;
    if (payload instanceof Date) return payload.toISOString();
    return JSON.stringify(payload, (_key, value) =>
      typeof value === 'bigint' ? value.toString() : value,
    );
  };
}

import { Ignitor } from '@adonisjs/core';
import { fileURLToPath, pathToFileURL } from 'node:url';

const importer = (filePath: string) => import(filePath);

console.log('[DEBUG] bin/server.ts process.execArgv:', process.execArgv);
console.log('[DEBUG] bin/server.ts import.meta.url:', import.meta.url);
const appRootFromMeta = new URL('../', import.meta.url);
const isBuildBin =
  import.meta.url.includes('/build/bin/') ||
  import.meta.url.includes('\\build\\bin\\');
const appRoot = isBuildBin
  ? new URL('../', import.meta.url)
  : appRootFromMeta.pathname.endsWith('/build/') ||
      appRootFromMeta.pathname.endsWith('\\build\\')
    ? new URL('../../', import.meta.url)
    : appRootFromMeta;

process.on('uncaughtException', (err) => {
  console.error('[GLOBAL uncaughtException]', err);
});
process.on('unhandledRejection', (reason) => {
  console.error('[GLOBAL unhandledRejection]', reason);
});

new Ignitor(appRoot, { importer }).httpServer().start();
