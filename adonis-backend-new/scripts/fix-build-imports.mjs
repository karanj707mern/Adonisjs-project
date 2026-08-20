#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

const buildDir = path.join(process.cwd(), 'build');

if (!fs.existsSync(buildDir)) {
  console.error('build directory not found');
  process.exit(1);
}

// Map of alias prefixes to their target directories relative to build/
const aliasMap = {
  '#controllers/': 'app/controllers/',
  '#services/': 'app/services/',
  '#middleware/': 'app/middleware/',
  '#validators/': 'app/validators/',
  '#exceptions/': 'app/exceptions/',
  '#providers/': 'app/providers/',
  '#lib/': 'app/lib/',
  '#contracts/': 'app/contracts/',
  '#start/': 'start/',
  '#models/': 'app/models/',
};

function getRelativePrefix(filePath) {
  const relative = path.relative(buildDir, filePath);
  const parts = relative.split(path.sep).filter(Boolean);
  const depth = parts.length - 1;
  return '../'.repeat(depth) || './';
}

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;
  const prefix = getRelativePrefix(filePath);

  // Replace alias imports with relative paths
  for (const [alias, targetDir] of Object.entries(aliasMap)) {
    const escapedAlias = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    if (alias.endsWith('/')) {
      // Match imports like: import Foo from '#controllers/auth/login';
      const regex = new RegExp(`('|")${escapedAlias}([^'"]+)\\1`, 'g');
      if (content.match(regex)) {
        changed = true;
        content = content.replace(regex, (match, quote, filePath) => {
          const ext = filePath.endsWith('.js') ? '' : '.js';
          return `${quote}${prefix}${targetDir}${filePath}${ext}${quote}`;
        });
      }
    } else {
      // Match exact alias like: import env from '#start/env';
      const regex = new RegExp(`('|")${escapedAlias.replace('#', '').replace('/', '')}\\1`, 'g');
      if (content.match(regex)) {
        changed = true;
        const targetFile = targetDir.replace(/\/$/, '');
        content = content.replace(regex, `$1${prefix}${targetFile}.js$1`);
      }
    }
  }

  // Add .js extension to relative imports if missing (only for ./ and ../)
  content = content.replace(
    /from\s+['"](\.{1,2}\/[^'"]+?)(?<!\.js)(?<!\.ts)['"]/g,
    (match, importPath) => {
      if (importPath.endsWith('.js') || importPath.endsWith('/')) return match;
      changed = true;
      return `from '${importPath}.js'`;
    }
  );

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Fixed:', filePath);
  }
}

function walk(dir) {
  let entries;
  try {
    entries = fs.readdirSync(dir);
  } catch (e) {
    return;
  }
  for (const entry of entries) {
    const fullPath = path.join(dir, entry);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      walk(fullPath);
    } else if (entry.endsWith('.js')) {
      processFile(fullPath);
    }
  }
}

walk(buildDir);

// Fix adonisrc.js imports
const adonisrcPath = path.join(buildDir, 'adonisrc.js');
if (fs.existsSync(adonisrcPath)) {
  let content = fs.readFileSync(adonisrcPath, 'utf8');
  content = content.replace(/\(\) => import\('#start\/routes'\)/g, "() => import('./start/routes.js')");
  content = content.replace(/\(\) => import\('#start\/preloads'\)/g, "() => import('./start/preloads.js')");
  content = content.replace(/\(\) => import\('#providers\/(prisma_provider|websocket_provider)'\)/g, (match, name) => {
    return `() => import('./app/providers/${name}.js')`;
  });
  fs.writeFileSync(adonisrcPath, content, 'utf8');
  console.log('Fixed adonisrc.js');
}

console.log('Done fixing imports in build output');
