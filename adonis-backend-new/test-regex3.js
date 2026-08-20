const content = "        () => import('../app/providers/prisma_provider'),";
const regex1 = /(import\(['"])([^'"]+?)(\1)/g;
const regex2 = /(import\()(['"])([^'"]+?)\2(\))/g;

console.log('regex1 test:', regex1.test(content));
console.log('regex2 test:', regex2.test(content));
console.log('regex2 match:', content.match(regex2));
console.log(
  'regex2 replace:',
  content.replace(regex2, (match, p1, p2, p3, p4) => {
    console.log('groups:', p1, p2, p3, p4);
    return `${p1}${p2}${p3}.js${p4}`;
  }),
);
