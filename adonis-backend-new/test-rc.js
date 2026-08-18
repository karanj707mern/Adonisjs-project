import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import { pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const appRoot = pathToFileURL(__dirname).href;

const rcPath = new URL("adonisrc.js", appRoot);
console.log('adonisrc.js path:', rcPath.href);

try {
  const mod = await import(rcPath.href);
  console.log('loaded:', typeof mod.default);
  console.log('providers:', mod.default?.providers?.length || 0);
} catch (e) {
  console.log('error:', e.message);
}
