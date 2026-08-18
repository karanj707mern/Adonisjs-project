import { BaseSchema } from '@adonisjs/lucid/schema';

export default class AddSessionsAndPreferencesSchema extends BaseSchema {
  protected tableName = 'sessions';

  async up() {
    this.schema.createTable('sessions', (table) => {
      table.string('id').notNullable();
      table.integer('user_id').notNullable().unsigned();
      table.string('refresh_token').notNullable().unique();
      table.string('user_agent').nullable();
      table.string('ip').nullable();
      table.string('country').nullable();
      table.string('city').nullable();
      table.string('device').nullable();
      table.string('browser').nullable();
      table.string('os').nullable();
      table.timestamp('expires_at').notNullable();
      table.timestamp('created_at').notNullable().defaultTo(this.now());
      table.timestamp('updated_at').notNullable().defaultTo(this.now());
      table.timestamp('last_used_at').notNullable().defaultTo(this.now());

      table.index(['user_id', 'expires_at']);
      table.index(['user_id', 'refresh_token']);
      table
        .foreign('user_id')
        .references('id')
        .inTable('users')
        .onDelete('CASCADE');
    });

    this.schema.createTable('notification_preferences', (table) => {
      table.increments('id');
      table.integer('user_id').notNullable().unsigned();
      table.specificType('type', 'varchar(30)').notNullable();
      table.specificType('channel', 'varchar(20)').notNullable();
      table.boolean('enabled').notNullable().defaultTo(true);
      table.timestamp('created_at').notNullable().defaultTo(this.now());
      table.timestamp('updated_at').notNullable().defaultTo(this.now());

      table.unique(['user_id', 'type', 'channel']);
      table.index(['user_id']);
      table
        .foreign('user_id')
        .references('id')
        .inTable('users')
        .onDelete('CASCADE');
    });
  }

  async down() {
    this.schema.dropTable('notification_preferences');
    this.schema.dropTable('sessions');
  }
}
