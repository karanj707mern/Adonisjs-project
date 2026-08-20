import { readFileSync, writeFileSync, globSync } from 'node:fs';

const files = globSync('app/controllers/*/*_routes.ts');

for (const file of files) {
  let content = readFileSync(file, 'utf8');
  const original = content;

  // Extract the function body
  const match = content.match(/export default function register\w+\(router[^)]*\)\s*\{([\s\S]*)\n\}/);
  if (!match) continue;

  const funcName = content.match(/register(\w+)/)?.[1] || '';
  // Convert CamelCase to kebab-case
  const prefix = funcName
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/^(?:\w)-(?:\w)/, (m) => m.toLowerCase());

  const body = match[1].trim();

  // Check if already has a prefix group
  if (content.includes('.prefix(')) continue;

  const newContent = content.replace(
    /export default function register\w+\(router[^)]*\)\s*\{[\s\S]*\n\}/,
    `export default function register${funcName}(router) {
  router.group(() => {
${body.split('\n').map(line => '    ' + line).join('\n')}
  }).prefix('${prefix}');
}`
  );

  if (newContent !== original) {
    writeFileSync(file, newContent);
    console.log('Fixed:', file, '->', prefix);
  }
}

console.log('Done fixing route prefixes');
