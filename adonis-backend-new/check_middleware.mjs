import { getTsconfig, createPathsMatcher } from 'get-tsconfig';

const tsconfig = getTsconfig();
const matcher = createPathsMatcher(tsconfig.config);

const resolved = matcher('#middleware/guest_token_middleware');
console.log('resolved:', resolved);

if (resolved && resolved[0]) {
  const mod = await import(resolved[0]);
  console.log('module keys:', Object.keys(mod));
  console.log('default type:', typeof mod.default);
  console.log('default name:', mod.default?.name);
  console.log('default is async:', mod.default?.constructor?.name === 'AsyncFunction');
}
