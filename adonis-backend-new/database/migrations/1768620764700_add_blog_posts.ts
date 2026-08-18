import { BaseSchema } from '@adonisjs/lucid/schema';

export default class AddBlogPostsSchema extends BaseSchema {
  protected tableName = 'blog_posts';

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id');
      table.string('title').notNullable();
      table.string('slug').notNullable().unique();
      table.text('excerpt').nullable();
      table.text('content').notNullable();
      table.string('cover_image').nullable();
      table.boolean('published').notNullable().defaultTo(false);
      table.timestamp('published_at').nullable();
      table.timestamp('created_at').notNullable().defaultTo(this.now());
      table.timestamp('updated_at').notNullable().defaultTo(this.now());
    });
  }

  async down() {
    this.schema.dropTable(this.tableName);
  }
}
