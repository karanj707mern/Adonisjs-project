import env from '#adonisjs/env'

export default defineConfig({
  appKey: env.get('APP_KEY'),

  http: {
    allowMethods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    etag: true,
    subdomainOffset: 2,
    trustProxy: env.get('NODE_ENV') === 'production',
  },

  baseURL: env.get('APP_URL'),
  static: {
    dotFiles: 'ignore',
    etag: true,
    lastModified: true,
  },
})
