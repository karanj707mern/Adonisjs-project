import vine from '@vinejs/vine'

export const createProductValidator = vine.create(
  vine.object({
    name: vine.string().maxLength(255),
    slug: vine.string(),
    sku: vine.string().maxLength(100),
    price: vine.number().min(0),
    compareAtPrice: vine.number().min(0).optional().nullable(),
    description: vine.string(),
    image: vine.string().maxLength(500),
    brand: vine.string().maxLength(100).optional().nullable(),
    tags: vine.array(vine.string().maxLength(50)).optional(),
    seoTitle: vine.string().maxLength(255).optional().nullable(),
    seoDescription: vine.string().maxLength(500).optional().nullable(),
    weightGrams: vine.number().min(0).optional().nullable(),
    isActive: vine.boolean().optional(),
    isNewArrival: vine.boolean().optional(),
    stock: vine.number().min(0),
  })
)

export const updateProductValidator = vine.create(
  vine.object({
    name: vine.string().maxLength(255).optional(),
    slug: vine.string().optional(),
    sku: vine.string().maxLength(100).optional(),
    price: vine.number().min(0).optional(),
    compareAtPrice: vine.number().min(0).optional().nullable(),
    description: vine.string().optional(),
    image: vine.string().maxLength(500).optional(),
    brand: vine.string().maxLength(100).optional().nullable(),
    tags: vine.array(vine.string().maxLength(50)).optional(),
    seoTitle: vine.string().maxLength(255).optional().nullable(),
    seoDescription: vine.string().maxLength(500).optional().nullable(),
    weightGrams: vine.number().min(0).optional().nullable(),
    isActive: vine.boolean().optional(),
    isNewArrival: vine.boolean().optional(),
    stock: vine.number().min(0).optional(),
  })
)
