import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

// 1. Fix build/package.json imports field — add .js extension
const buildPkgPath = join(process.cwd(), 'build', 'package.json');
const pkg = JSON.parse(readFileSync(buildPkgPath, 'utf8'));

if (pkg.imports) {
  for (const key of Object.keys(pkg.imports)) {
    const val = pkg.imports[key];
    // Handle both string and array formats
    if (Array.isArray(val)) {
      pkg.imports[key] = val.map(p => {
        if (p.startsWith('./') && !p.endsWith('.js') && !p.includes('*.')) {
          return p.replace(/\*$/, '*.js');
        }
        return p;
      });
    } else if (typeof val === 'string') {
      if (val.startsWith('./') && !val.endsWith('.js') && !val.includes('*.')) {
        pkg.imports[key] = val.replace(/\*$/, '*.js');
      }
    }
  }
}
writeFileSync(buildPkgPath, JSON.stringify(pkg, null, 2) + '\n');

// 2. Fix relative imports in all .js files
let fixed = 0;

function fixFile(filePath) {
  let content = readFileSync(filePath, 'utf8');
  const original = content;
  content = content.replace(
    /(from\s+['"])(\.\.?\/[^'"]+?)(['"])/g,
    (match, prefix, importPath, suffix) => {
      if (/\.[a-z]+$/i.test(importPath)) return match;
      const dir = join(filePath, '..');
      const target = join(dir, importPath + '.js');
      try {
        if (statSync(target).isFile()) {
          fixed++;
          return prefix + importPath + '.js' + suffix;
        }
      } catch {}
      // Try as directory with index.js
      try {
        const idxTarget = join(dir, importPath, 'index.js');
        if (statSync(idxTarget).isFile()) {
          fixed++;
          return prefix + importPath + '/index.js' + suffix;
        }
      } catch {}
      return match;
    }
  );
  if (content !== original) {
    writeFileSync(filePath, content);
  }
}

function walk(dir) {
  let entries;
  try { entries = readdirSync(dir); } catch { return; }
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      walk(fullPath);
    } else if (fullPath.endsWith('.js')) {
      fixFile(fullPath);
    }
  }
}

walk(join(process.cwd(), 'build'));
console.log(`Fixed ${fixed} relative imports + package.json imports`);
