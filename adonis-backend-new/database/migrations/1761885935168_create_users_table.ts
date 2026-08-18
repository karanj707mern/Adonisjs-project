import { BaseSchema } from '@adonisjs/lucid/schema';

export default class CreateUsersTableSchema extends BaseSchema {
  protected tableName = 'users';

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable();
      table.string('name').notNullable();
      table.string('email', 254).notNullable().unique();
      table.string('password').notNullable();
      table.boolean('is_email_verified').notNullable().defaultTo(false);
      table.string('email_verify_token').nullable();
      table.string('email_verify_token_expires_at').nullable();
      table.string('email_verify_last_sent_at').nullable();
      table.string('phone_number').nullable();
      table.string('address_line1').nullable();
      table.string('address_line2').nullable();
      table.string('city').nullable();
      table.string('state').nullable();
      table.string('country').nullable();
      table.string('postal_code').nullable();
      table.string('avatar').nullable();
      table.string('refresh_token').nullable();
      table.string('refresh_token_expires_at').nullable();
      table.string('password_reset_token').nullable();
      table.string('password_reset_token_expires_at').nullable();
      table.timestamp('password_reset_last_requested_at').nullable();
      table
        .specificType('auth_provider', 'varchar(20)')
        .notNullable()
        .defaultTo('LOCAL');
      table.string('google_id').nullable().unique();
      table.specificType('role', 'varchar(20)').notNullable().defaultTo('USER');
      table.timestamp('created_at').notNullable().defaultTo(this.now());
      table.timestamp('updated_at').notNullable().defaultTo(this.now());
    });
  }

  async down() {
    this.schema.dropTable(this.tableName);
  }
}
