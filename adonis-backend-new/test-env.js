import 'ts-node/esm';

(async () => {
  try {
    const mod = await import('./start/env.ts');
    console.log('env loaded:', typeof mod.default);
  } catch (e) {
    console.log('error:', e.message);
  }
  
  try {
    const mod = await import('#start/env');
    console.log('#start/env loaded:', typeof mod.default);
  } catch (e) {
    console.log('#start/env error:', e.message);
  }
})();
