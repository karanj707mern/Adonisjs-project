import { BaseSchema } from '@adonisjs/lucid/schema';

export default class AddWishlistCategoryCouponSchema extends BaseSchema {
  protected tableName = 'wishlists';

  async up() {
    this.schema.createTable('wishlists', (table) => {
      table.increments('id');
      table.integer('user_id').unsigned().notNullable();
      table.integer('product_id').notNullable().unsigned();
      table.string('guest_wishlist_token').nullable();
      table.timestamp('created_at').notNullable().defaultTo(this.now());

      table.unique(['user_id', 'product_id']);
      table.unique(['guest_wishlist_token', 'product_id']);
      table.index(['user_id']);
      table.index(['guest_wishlist_token']);
      table
        .foreign('user_id')
        .references('id')
        .inTable('users')
        .onDelete('CASCADE');
      table
        .foreign('product_id')
        .references('id')
        .inTable('products')
        .onDelete('CASCADE');
    });

    this.schema.createTable('coupons', (table) => {
      table.increments('id');
      table.string('code').notNullable().unique();
      table.specificType('discount_type', 'varchar(20)').notNullable();
      table.decimal('discount_value', 10, 2).notNullable();
      table.decimal('min_order_value', 10, 2).nullable();
      table.decimal('max_discount', 10, 2).nullable();
      table.integer('usage_limit').nullable();
      table.integer('used_count').notNullable().defaultTo(0);
      table.boolean('is_active').notNullable().defaultTo(true);
      table.timestamp('valid_from').notNullable();
      table.timestamp('valid_until').notNullable();
      table.integer('per_user_limit').nullable();
      table.timestamp('created_at').notNullable().defaultTo(this.now());
      table.timestamp('updated_at').notNullable().defaultTo(this.now());
    });
  }

  async down() {
    this.schema.dropTable('coupons');
    this.schema.dropTable('wishlists');
  }
}
