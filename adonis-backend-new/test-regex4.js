const content = "    preloads: [() => import('#start/preloads.js)],";
const regex = /(import\()(['"])([^'"]+?)\2(\))/g;
console.log('content:', content);
console.log('regex:', regex);
console.log('test:', regex.test(content));
console.log('match:', content.match(regex));
console.log('replace:', content.replace(regex, (match, p1, p2, path, p4) => {
  console.log('groups:', p1, p2, path, p4);
  return `${p1}${p2}${path}${p2}${p4}`;
}));
