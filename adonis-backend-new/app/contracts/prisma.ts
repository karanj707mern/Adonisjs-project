import type { PrismaClient } from '@prisma/client';

declare module '@adonisjs/core/types' {
  interface ContainerBindings {
    Database: PrismaClient;
    RedisCache: any;
    Storage: any;
  }
}
