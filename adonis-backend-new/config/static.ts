import { defineConfig } from '@adonisjs/static';

export default defineConfig({
  enabled: true,
  etag: true,
  lastModified: true,
  dotFiles: 'deny',
  maxAge: 0,
  headers: () => ({}),
});
