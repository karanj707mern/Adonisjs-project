import type { ApplicationService } from '@adonisjs/core/types';
import PrismaService from '#services/prisma_service';

export default class DatabaseProvider {
  constructor(protected app: ApplicationService) {}

  register() {
    this.app.container.singleton('Database', () => {
      return new PrismaService().getClient();
    });
    this.app.container.singleton(PrismaService, () => new PrismaService());
  }

  async boot() {
    const prisma = await this.app.container.make('Database');
    const logger = await this.app.container.make('logger');
    try {
      await prisma.$connect();
      console.info('Prisma database connection established');
    } catch (error) {
      console.warn(
        { message: (error as Error).message },
        'Prisma connection check failed',
      );
    }
  }

  async shutdown() {
    const prisma = await this.app.container.make('Database');
    const logger = await this.app.container.make('logger');
    try {
      await prisma.$disconnect();
      console.info('Prisma client disconnected');
    } catch (error) {
      console.warn(
        { message: (error as Error).message },
        'Prisma disconnect failed',
      );
    }
  }
}
