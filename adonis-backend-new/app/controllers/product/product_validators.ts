import vine from '@vinejs/vine';

export const createProductValidator = vine.compile(
  vine.object({
    name: vine.string().trim().maxLength(255),
    slug: vine
      .string()
      .trim()
      .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    sku: vine.string().trim().maxLength(100),
    price: vine.number().min(0),
    compareAtPrice: vine.number().min(0).optional().nullable(),
    description: vine.string().trim(),
    image: vine.string().trim().maxLength(500),
    brand: vine.string().trim().maxLength(100).optional().nullable(),
    tags: vine.array(vine.string().trim().maxLength(50)).max(20).optional(),
    seoTitle: vine.string().trim().maxLength(255).optional().nullable(),
    seoDescription: vine.string().trim().maxLength(500).optional().nullable(),
    weightGrams: vine.number().min(0).optional().nullable(),
    isActive: vine.boolean().optional(),
    isNewArrival: vine.boolean().optional(),
    stock: vine.number().min(0),
  }),
);

export const updateProductValidator = vine.compile(
  vine.object({
    name: vine.string().trim().maxLength(255).optional(),
    slug: vine
      .string()
      .trim()
      .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      .optional(),
    sku: vine.string().trim().maxLength(100).optional(),
    price: vine.number().min(0).optional(),
    compareAtPrice: vine.number().min(0).optional().nullable(),
    description: vine.string().trim().optional(),
    image: vine.string().trim().maxLength(500).optional(),
    brand: vine.string().trim().maxLength(100).optional().nullable(),
    tags: vine.array(vine.string().trim().maxLength(50)).max(20).optional(),
    seoTitle: vine.string().trim().maxLength(255).optional().nullable(),
    seoDescription: vine.string().trim().maxLength(500).optional().nullable(),
    weightGrams: vine.number().min(0).optional().nullable(),
    isActive: vine.boolean().optional(),
    isNewArrival: vine.boolean().optional(),
    stock: vine.number().min(0).optional(),
  }),
);
