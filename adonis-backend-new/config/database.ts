import env from '#adonisjs/env'
import { defineConfig } from '#adonisjs/lucid/database'

export default defineConfig({
  connection: 'pg',
  connections: {
    pg: {
      client: 'pg',
      connection: {
        connectionString: env.get('DATABASE_URL'),
      },
      pool: {
        min: 2,
        max: 20,
      },
      migrations: {
        naturalSort: true,
        disableTransactions: false,
      },
      healthCheck: true,
    },
  },
  healthCheck: {
    enabled: true,
    healthCheckInterval: 30000,
  },
})
