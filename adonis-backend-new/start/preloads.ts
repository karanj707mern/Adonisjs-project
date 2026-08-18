import type { ApplicationService } from '@adonisjs/core/types';

export default async function preloads(_app: ApplicationService) {
  const prisma = _app.container.make('Database');
  const logger = await _app.container.make('logger');
  try {
    await prisma.$connect();
    logger.info('Prisma database connection established');
  } catch (error) {
    logger.warn(
      { message: (error as Error).message },
      'Prisma connection check failed',
    );
  }
}
