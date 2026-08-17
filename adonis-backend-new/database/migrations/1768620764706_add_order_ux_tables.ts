import { BaseSchema } from '@adonisjs/lucid/schema'

export default class AddOrderUxTablesSchema extends BaseSchema {
  protected tableName = 'recently_viewed'

  async up() {
    this.schema.createTable('recently_viewed', (table) => {
      table.increments('id')
      table.integer('user_id').notNullable().unsigned()
      table.integer('product_id').notNullable().unsigned()
      table.timestamp('viewed_at').notNullable().defaultTo(this.now())

      table.index(['user_id', 'viewed_at'])
      table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE')
      table.foreign('product_id').references('id').inTable('products').onDelete('CASCADE')
    })

    this.schema.createTable('abandoned_carts', (table) => {
      table.increments('id')
      table.integer('user_id').unsigned().nullable()
      table.string('guest_token').nullable()
      table.integer('product_id').notNullable().unsigned()
      table.integer('quantity').notNullable().defaultTo(1)
      table.boolean('recovered').notNullable().defaultTo(false)
      table.timestamp('recovered_at').nullable()
      table.timestamp('created_at').notNullable().defaultTo(this.now())
      table.timestamp('expires_at').notNullable()

      table.index(['user_id', 'expires_at'])
      table.index(['guest_token', 'expires_at'])
      table.foreign('product_id').references('id').inTable('products').onDelete('CASCADE')
    })
  }

  async down() {
    this.schema.dropTable('abandoned_carts')
    this.schema.dropTable('recently_viewed')
  }
}
