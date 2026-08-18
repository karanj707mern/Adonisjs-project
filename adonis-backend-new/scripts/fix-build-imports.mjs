import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';

const ROOT = process.cwd();
const BUILD_DIR = join(ROOT, 'build');

function getPrefix(filePath) {
  const relative = dirname(filePath.replace(BUILD_DIR, '')).replace(/^\/+/, '');
  const parts = relative.split('/').filter(Boolean);
  const depth = parts.length;
  return '../'.repeat(depth) || './';
}

function rewriteFile(filePath) {
  let content = readFileSync(filePath, 'utf8');
  let changed = false;
  const prefix = getPrefix(filePath);

  // Fix #alias imports to relative imports
  const ALIAS_MAP = {
    '#start/env': `${prefix}start/env.js`,
    '#controllers/': `${prefix}app/controllers/`,
    '#services/': `${prefix}app/services/`,
    '#middleware/': `${prefix}app/middleware/`,
    '#validators/': `${prefix}app/validators/`,
    '#exceptions/': `${prefix}app/exceptions/`,
    '#providers/': `${prefix}app/providers/`,
    '#lib/': `${prefix}app/lib/`,
    '#contracts/': `${prefix}app/contracts/`,
    '#config/': `${prefix}config/`,
    '#models/': `${prefix}app/models/`,
  };

  for (const [alias, replacement] of Object.entries(ALIAS_MAP)) {
    const escapedAlias = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (alias.endsWith('/')) {
      const regex = new RegExp(`('|")${escapedAlias}([^'"]+)\\1`, 'g');
      if (regex.test(content)) {
        changed = true;
        content = content.replace(regex, (match, quote, path) => {
          const ext = path.endsWith('.js') ? '' : '.js';
          return `${quote}${replacement}${path}${ext}${quote}`;
        });
      }
    } else {
      const regex = new RegExp(`('|")${escapedAlias}\\1`, 'g');
      if (regex.test(content)) {
        changed = true;
        content = content.replace(regex, `$1${replacement}$1`);
      }
    }
  }

  // Fix imports that are missing ./ prefix (e.g., import('app/providers/...'))
  content = content.replace(
    /(import\()(?!(\.\.?\/|@|http|\#)['"])([^'"]+?)(\1)/g,
    (match, p1, p2, path, p4) => {
      if (path.startsWith('app/') || path.startsWith('config/') || path.startsWith('start/')) {
        changed = true;
        return `${p1}'./${path}${p4}`;
      }
      return match;
    }
  );

  if (changed) {
    writeFileSync(filePath, content);
    console.log('Fixed:', filePath);
  }
}

function walk(dir) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch (e) {
    return;
  }
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      walk(fullPath);
    } else if (entry.endsWith('.js')) {
      rewriteFile(fullPath);
    }
  }
}

walk(BUILD_DIR);

// Fix adonisrc.js separately
const adonisrcPath = join(BUILD_DIR, 'adonisrc.js');
if (statSync(adonisrcPath).isFile()) {
  let content = readFileSync(adonisrcPath, 'utf8');
  content = content.replace(/import\('#start\/preloads'\)/g, "import('./start/preloads.js')");
  content = content.replace(/import\('#providers\/(prisma_provider|websocket_provider)'\)/g, (match, name) => {
    return `import('./app/providers/${name}.js')`;
  });
  writeFileSync(adonisrcPath, content);
  console.log('Fixed adonisrc.js');
}

console.log('Done fixing imports in build output');
