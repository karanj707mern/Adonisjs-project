import { BaseSchema } from '@adonisjs/lucid/schema'

export default class AddAuditLogAndCouponUsageSchema extends BaseSchema {
  protected tableName = 'admin_audit_logs'

  async up() {
    this.schema.createTable('admin_audit_logs', (table) => {
      table.increments('id')
      table.integer('user_id').notNullable().unsigned()
      table.string('action', 100).notNullable()
      table.string('entity_type', 100).notNullable()
      table.integer('entity_id').unsigned().nullable()
      table.string('old_value').nullable()
      table.string('new_value').nullable()
      table.string('ip_address', 45).nullable()
      table.string('user_agent').nullable()
      table.timestamp('created_at').notNullable().defaultTo(this.now())

      table.index(['user_id'])
      table.index(['entity_type', 'entity_id'])
      table.index(['created_at'])
      table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE')
    })

    this.schema.createTable('coupon_usages', (table) => {
      table.increments('id')
      table.integer('coupon_id').notNullable().unsigned()
      table.integer('user_id').notNullable().unsigned()
      table.integer('order_id').notNullable().unsigned()
      table.timestamp('used_at').notNullable().defaultTo(this.now())

      table.unique(['coupon_id', 'user_id'])
      table.index(['coupon_id'])
      table.index(['user_id'])
      table.foreign('coupon_id').references('id').inTable('coupons').onDelete('CASCADE')
    })
  }

  async down() {
    this.schema.dropTable('coupon_usages')
    this.schema.dropTable('admin_audit_logs')
  }
}
