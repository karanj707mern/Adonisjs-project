import vine from '@vinejs/vine'

export const createBlogPostValidator = vine.compile(
  vine.object({
    title: vine.string().trim().minLength(1).maxLength(255),
    slug: vine
      .string()
      .trim()
      .minLength(1)
      .maxLength(255)
      .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    excerpt: vine.string().trim().maxLength(500).optional(),
    content: vine.string().trim().minLength(1),
    coverImage: vine.string().trim().maxLength(500).optional(),
    published: vine.boolean().optional(),
    publishedAt: vine.string().trim().maxLength(20).optional(),
  })
)

export const updateBlogPostValidator = vine.compile(
  vine.object({
    title: vine.string().trim().minLength(1).maxLength(255).optional(),
    slug: vine
      .string()
      .trim()
      .minLength(1)
      .maxLength(255)
      .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      .optional(),
    excerpt: vine.string().trim().maxLength(500).optional().nullable(),
    content: vine.string().trim().minLength(1).optional(),
    coverImage: vine.string().trim().maxLength(500).optional().nullable(),
    published: vine.boolean().optional(),
    publishedAt: vine.string().trim().maxLength(20).optional().nullable(),
  })
)
