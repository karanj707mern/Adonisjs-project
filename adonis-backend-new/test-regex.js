const alias = '#providers/';
const escapedAlias = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
console.log('escapedAlias:', escapedAlias);
const regex = new RegExp(`('|")${escapedAlias}([^'"]+)\\1`, 'g');
const str = "() => import('#providers/prisma_provider')";
console.log('regex:', regex);
console.log('match:', str.match(regex));
console.log(
  'replace:',
  str.replace(regex, (match, quote, path) => {
    console.log('match:', match, 'quote:', quote, 'path:', path);
    return `${quote}../app/providers/${path}.js${quote}`;
  }),
);
