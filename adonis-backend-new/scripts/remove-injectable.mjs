import { readFileSync, writeFileSync } from 'node:fs';
import { globSync } from 'node:fs';

const files = globSync('app/**/*.ts');

for (const file of files) {
  let content = readFileSync(file, 'utf8');
  const original = content;

  // Remove import of injectable
  content = content.replace("import { injectable } from '@adonisjs/fold';\n", '');
  content = content.replace("import { inject, injectable } from '@adonisjs/fold';\n", "import { inject } from '@adonisjs/fold';\n");

  // Remove @injectable() decorator
  content = content.replace('@injectable()\n', '');

  if (content !== original) {
    writeFileSync(file, content);
    console.log('Fixed:', file);
  }
}

console.log('Done removing @injectable()');
