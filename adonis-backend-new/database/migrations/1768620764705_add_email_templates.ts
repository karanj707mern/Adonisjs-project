import { BaseSchema } from '@adonisjs/lucid/schema'

export default class AddEmailTemplatesSchema extends BaseSchema {
  protected tableName = 'email_templates'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('name').notNullable().unique()
      table.string('subject').notNullable()
      table.text('html_body').notNullable()
      table.text('text_body').nullable()
      table.json('variables').nullable()
      table.boolean('is_active').notNullable().defaultTo(true)
      table.timestamp('created_at').notNullable().defaultTo(this.now())
      table.timestamp('updated_at').notNullable().defaultTo(this.now())
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
