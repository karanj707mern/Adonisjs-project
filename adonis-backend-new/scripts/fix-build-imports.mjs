#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

const buildDir = path.join(process.cwd(), 'build');
const routesPath = path.join(buildDir, 'start', 'routes.js');

if (!fs.existsSync(routesPath)) {
  console.error('routes.js not found at', routesPath);
  process.exit(1);
}

let content = fs.readFileSync(routesPath, 'utf8');

// Fix #alias imports to relative paths
content = content.replace(/#([a-zA-Z0-9_]+)/g, (match, alias) => {
  const aliasPath = path.join(buildDir, 'start', `${alias}.js`);
  if (fs.existsSync(aliasPath)) {
    return path.relative(path.dirname(routesPath), aliasPath).replace(/\\/g, '/');
  }
  return match;
});

// Fix relative imports to have .js extension
content = content.replace(/from\s+['"]([^"']+)\.([cm]?)ts[^;]*/g, (match, path, ext) => {
  const newExt = ext === 'ts' ? '.ts' : '.js';
  return `${match.split('.')[0]}:${path.join(path.dirname(path), path.split('.')[1] + '.' + newExt)}`;
});

fs.writeFileSync(routesPath, content, 'utf8');
console.log('Fixed imports in', routesPath);
