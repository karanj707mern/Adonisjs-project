import type { ApplicationService } from '@adonisjs/core/types'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import logger from '@adonisjs/core/services/logger'

export default class PrismaProvider {
  constructor(protected app: ApplicationService) {}

  async boot() {
    const connectionString = process.env.DATABASE_URL
    if (!connectionString) {
      throw new Error('DATABASE_URL is not defined')
    }

    const pool = new Pool({
      connectionString,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
      allowExitOnIdle: true,
      keepAlive: true,
    })

    const adapter = new PrismaPg(pool)
    const client = new PrismaClient({ adapter })
    await client.$connect()

    this.app.container.singleton('Prisma', () => client)
    logger.info('Prisma connected to PostgreSQL')

    this.app.container.withExitHandler(async () => {
      await client.$disconnect()
    })
  }

  async shutdown() {
    const client = await this.app.container.make('Prisma')
    await client.$disconnect()
  }
}
