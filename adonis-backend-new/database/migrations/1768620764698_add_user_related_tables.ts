import { BaseSchema } from '@adonisjs/lucid/schema'

export default class AddUserRelatedTablesSchema extends BaseSchema {
  protected tableName = 'user_addresses'

  async up() {
    this.schema.createTable('user_addresses', (table) => {
      table.increments('id')
      table.integer('user_id').notNullable().unsigned()
      table.string('label').notNullable()
      table.string('recipient_name').notNullable()
      table.string('phone_number').notNullable()
      table.string('address_line1').notNullable()
      table.string('address_line2').nullable()
      table.string('city').notNullable()
      table.string('state').notNullable()
      table.string('postal_code').notNullable()
      table.string('country').notNullable()
      table.boolean('is_default').notNullable().defaultTo(false)
      table.timestamp('created_at').notNullable().defaultTo(this.now())
      table.timestamp('updated_at').notNullable().defaultTo(this.now())

      table.index(['user_id', 'is_default'])
      table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE')
    })

    this.schema.createTable('store_settings', (table) => {
      table.integer('id').notNullable().unsigned().unique()
      table.decimal('shipping_charge', 10, 2).notNullable().defaultTo(99)
      table.decimal('tax_rate', 10, 2).notNullable().defaultTo(0)
      table.decimal('free_shipping_threshold', 10, 2).nullable()
      table.decimal('cod_charge', 10, 2).notNullable().defaultTo(0)
      table.decimal('express_shipping_charge', 10, 2).notNullable().defaultTo(149)
      table.decimal('handling_charge', 10, 2).notNullable().defaultTo(0)
      table.decimal('same_day_shipping_charge', 10, 2).notNullable().defaultTo(249)
      table.json('shipping_options').nullable()
      table.json('shipping_zones').nullable()
      table.boolean('cod_enabled').notNullable().defaultTo(true)
      table.decimal('max_cod_order_value', 10, 2).nullable()
      table.boolean('allow_international_cod').notNullable().defaultTo(false)
      table.integer('auto_cancel_pending_minutes').notNullable().defaultTo(30)
      table.timestamp('updated_at').notNullable().defaultTo(this.now())
    })

    this.schema.createTable('order_activities', (table) => {
      table.increments('id')
      table.integer('order_id').notNullable().unsigned()
      table.specificType('status', "varchar(20)").notNullable()
      table.string('title').notNullable()
      table.string('detail').nullable()
      table.timestamp('created_at').notNullable().defaultTo(this.now())

      table.foreign('order_id').references('id').inTable('orders').onDelete('CASCADE')
    })
  }

  async down() {
    this.schema.dropTable('order_activities')
    this.schema.dropTable('store_settings')
    this.schema.dropTable('user_addresses')
  }
}
