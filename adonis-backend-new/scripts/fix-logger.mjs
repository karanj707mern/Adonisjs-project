import { readFileSync, writeFileSync, globSync } from 'node:fs';

const files = globSync('app/**/*.ts');

for (const file of files) {
  let content = readFileSync(file, 'utf8');
  const original = content;

  // Remove logger import from '@adonisjs/core/services/logger'
  content = content.replace("import logger from '@adonisjs/core/services/logger';\n", '');

  // Replace logger calls with console equivalents
  content = content.replace(/logger\.(info|warn|error|debug)\(/g, (match, method) => {
    const consoleMethod = method === 'warn' ? 'warn' : method;
    return `console.${consoleMethod}(`;
  });

  if (content !== original) {
    writeFileSync(file, content);
    console.log('Fixed logger in:', file);
  }
}

console.log('Done fixing logger imports');
