import vine from '@vinejs/vine'

export const createBlogPostValidator = vine.create(
  vine.object({
    title: vine.string().minLength(1).maxLength(255),
    slug: vine.string().minLength(1).maxLength(255),
    excerpt: vine.string().maxLength(500).optional(),
    content: vine.string().minLength(1),
    coverImage: vine.string().maxLength(500).optional(),
    published: vine.boolean().optional(),
    publishedAt: vine.string().maxLength(20).optional(),
  })
)

export const updateBlogPostValidator = vine.create(
  vine.object({
    title: vine.string().minLength(1).maxLength(255).optional(),
    slug: vine.string().minLength(1).maxLength(255).optional(),
    excerpt: vine.string().maxLength(500).optional().nullable(),
    content: vine.string().minLength(1).optional(),
    coverImage: vine.string().maxLength(500).optional().nullable(),
    published: vine.boolean().optional(),
    publishedAt: vine.string().maxLength(20).optional().nullable(),
  })
)
