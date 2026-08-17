import type { ApplicationService } from '@adonisjs/core/types'
import { Database } from '@adonisjs/lucid/database'
import logger from '@adonisjs/core/services/logger'

export default class DatabaseProvider {
  #db: Database | null = null

  constructor(protected app: ApplicationService) {}

  register() {
    this.app.container.singleton('Database', () => {
      return this.app.container.use('adonis/lucid').connection()
    })
  }

  async boot() {
    this.#db = this.app.container.make('Database')
    const isConnected = await this.#db.canConnect()
    if (isConnected) {
      logger.info('Lucid database connection established')
    } else {
      logger.warn('Lucid database connection check failed')
    }

    this.app.container.withExitHandler(async () => {
      await this.#db?.manager?.getPrimaryConnection()?.disconnect()
    })
  }

  async shutdown() {
    const db = this.app.container.make<Database>('Database')
    await db.manager.getPrimaryConnection().disconnect()
  }
}
