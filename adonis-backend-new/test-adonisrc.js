import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import { pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

try {
  const mod = await import('./adonisrc.ts');
  console.log('adonisrc loaded:', typeof mod.default);
  console.log('adonisrc keys:', Object.keys(mod.default || {}));
  console.log('providers:', mod.default?.providers?.length || 0);
} catch (error) {
  console.error('Error:', error.message);
  console.error(error.stack);
}
