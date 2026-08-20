import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import { pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const appRoot = pathToFileURL(__dirname).href;

// Replicate what RcFileManager does
const rcTSFile = new URL('adonisrc.js', appRoot);
console.log('Looking for adonisrc.js at:', rcTSFile.href);

try {
  const rcExports = await import(rcTSFile.href);
  console.log('Loaded successfully');
  console.log('default type:', typeof rcExports.default);
  console.log('providers:', rcExports.default?.providers?.length || 0);
} catch (error) {
  console.error('Error:', error.message);
}
