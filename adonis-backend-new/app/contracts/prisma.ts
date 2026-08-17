import type { Database } from '@adonisjs/lucid/database'

declare module '@adonisjs/core/types' {
  interface ContainerBindings {
    Database: Database
    RedisCache: any
    Storage: any
  }
}
