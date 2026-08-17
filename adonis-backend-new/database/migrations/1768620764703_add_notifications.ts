import { BaseSchema } from '@adonisjs/lucid/schema'

export default class AddNotificationsSchema extends BaseSchema {
  protected tableName = 'notifications'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('user_id').unsigned().nullable()
      table.integer('order_id').unsigned().nullable()
      table.specificType('type', "varchar(30)").notNullable()
      table.specificType('channel', "varchar(20)").notNullable()
      table.string('recipient').notNullable()
      table.string('subject').nullable()
      table.text('body').notNullable()
      table.json('payload').nullable()
      table.specificType('status', "varchar(20)").notNullable().defaultTo('PENDING')
      table.integer('attempts').notNullable().defaultTo(0)
      table.integer('max_attempts').notNullable().defaultTo(3)
      table.string('last_error').nullable()
      table.string('provider_message_id').nullable()
      table.timestamp('scheduled_at').notNullable().defaultTo(this.now())
      table.timestamp('sent_at').nullable()
      table.timestamp('created_at').notNullable().defaultTo(this.now())
      table.timestamp('updated_at').notNullable().defaultTo(this.now())

      table.index(['status', 'scheduled_at'])
      table.index(['user_id', 'created_at'])
      table.index(['order_id', 'created_at'])
      table.index(['user_id', 'status'])
      table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE')
      table.foreign('order_id').references('id').inTable('orders').onDelete('SET NULL')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
