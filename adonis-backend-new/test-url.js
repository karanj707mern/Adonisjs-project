import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import { pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('__dirname:', __dirname);
console.log('pathToFileURL:', pathToFileURL(__dirname).href);
console.log('pathToFileURL + /:', pathToFileURL(__dirname).href + '/');

const appRoot1 = pathToFileURL(__dirname).href;
const appRoot2 = pathToFileURL(__dirname).href + '/';

console.log('new URL("adonisrc.js", appRoot1):', new URL("adonisrc.js", appRoot1).href);
console.log('new URL("adonisrc.js", appRoot2):', new URL("adonisrc.js", appRoot2).href);
