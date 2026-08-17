import { BaseSchema } from '@adonisjs/lucid/schema'

export default class AddReviewsAndCommentsSchema extends BaseSchema {
  protected tableName = 'reviews'

  async up() {
    this.schema.createTable('reviews', (table) => {
      table.increments('id')
      table.integer('user_id').notNullable().unsigned()
      table.integer('product_id').notNullable().unsigned()
      table.integer('order_id').unsigned().nullable()
      table.integer('rating').notNullable()
      table.string('title').nullable()
      table.text('content').notNullable()
      table.string('admin_note').nullable()
      table.specificType('status', "varchar(20)").notNullable().defaultTo('PENDING')
      table.timestamp('created_at').notNullable().defaultTo(this.now())
      table.timestamp('updated_at').notNullable().defaultTo(this.now())

      table.unique(['user_id', 'product_id'])
      table.index(['product_id', 'created_at'])
      table.index(['status'])
      table.index(['user_id'])
      table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE')
      table.foreign('product_id').references('id').inTable('products').onDelete('CASCADE')
      table.foreign('order_id').references('id').inTable('orders').onDelete('SET NULL')
    })

    this.schema.createTable('review_comments', (table) => {
      table.increments('id')
      table.integer('review_id').notNullable().unsigned()
      table.integer('user_id').notNullable().unsigned()
      table.text('content').notNullable()
      table.timestamp('created_at').notNullable().defaultTo(this.now())
      table.timestamp('updated_at').notNullable().defaultTo(this.now())

      table.index(['review_id', 'created_at'])
      table.foreign('review_id').references('id').inTable('reviews').onDelete('CASCADE')
      table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE')
    })
  }

  async down() {
    this.schema.dropTable('review_comments')
    this.schema.dropTable('reviews')
  }
}
