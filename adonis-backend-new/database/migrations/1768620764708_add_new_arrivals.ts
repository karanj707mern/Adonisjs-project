import { BaseSchema } from '@adonisjs/lucid/schema';

export default class AddNewArrivalsSchema extends BaseSchema {
  protected tableName = 'new_arrival';

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id');
      table.string('url').notNullable();
      table.string('alt').nullable();
      table.integer('sort_order').notNullable().defaultTo(0);
      table.boolean('active').notNullable().defaultTo(true);
      table.boolean('coming_soon').notNullable().defaultTo(false);
      table.timestamp('created_at').notNullable().defaultTo(this.now());
      table.timestamp('updated_at').notNullable().defaultTo(this.now());

      table.index(['sort_order']);
    });
  }

  async down() {
    this.schema.dropTable(this.tableName);
  }
}
