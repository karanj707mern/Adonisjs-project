import { readdirSync, statSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';

let fixed = 0;

function fixFile(filePath) {
  const content = readFileSync(filePath, 'utf8');
  // Match relative imports: from './x' or '../x' without extension
  const updated = content.replace(
    /(from\s+['"])(\.\.?\/[^'"]+?)(['"])/g,
    (match, prefix, importPath, suffix) => {
      // Skip if already has extension or is a package import
      if (/\.[a-z]+$/i.test(importPath)) return match;
      // Resolve the target file
      const dir = dirname(filePath);
      const target = join(dir, importPath + '.js');
      try {
        if (statSync(target).isFile()) {
          fixed++;
          return prefix + importPath + '.js' + suffix;
        }
      } catch {}
      return match;
    }
  );
  if (updated !== content) {
    writeFileSync(filePath, updated);
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
console.log(`Fixed ${fixed} relative imports`);
