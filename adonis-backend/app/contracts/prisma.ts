import type { PrismaClient } from '@prisma/client'

declare module '@adonisjs/core/types' {
  interface ContainerBindings {
    Prisma: PrismaClient
    'RedisCache': any
    Storage: any
  }
}
