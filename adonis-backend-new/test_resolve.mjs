async function test() {
  try {
    const providerExports = await import('@adonisjs/core/providers/app_provider');
    console.log('Provider exports:', Object.keys(providerExports));
    console.log('Has default:', !!providerExports.default);
    console.log('Default is class:', typeof providerExports.default === 'function');
  } catch (error) {
    console.error('Import error:', error.message);
  }
}
test();
