const content = "        () => import('../app/providers/prisma_provider'),";
const regex = /(import\(['"])([^'"]+?)(\1)/g;
console.log('regex:', regex);
console.log('test:', regex.test(content));
console.log('match:', content.match(regex));
console.log('replace:', content.replace(regex, (match, start, path, end) => {
  console.log('groups:', start, path, end);
  return `${start}${path}.js${end}`;
}));
