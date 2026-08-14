import vine from '@vinejs/vine'

export const createCartValidator = vine.create(
  vine.object({
    productId: vine.number().exists({ table: 'products', column: 'id' }),
    quantity: vine.number().min(1).optional(),
  })
)

export const updateCartValidator = vine.create(
  vine.object({
    quantity: vine.number().min(0),
  })
)

export const mergeGuestCartValidator = vine.create(
  vine.object({
    token: vine.string().minLength(1).optional(),
    items: vine
      .array(
        vine.object({
          productId: vine.number().exists({ table: 'products', column: 'id' }),
          quantity: vine.number().min(1),
        })
      )
      .optional(),
  })
)

export const guestCartValidator = vine.create(
  vine.object({
    items: vine
      .array(
        vine.object({
          productId: vine.number().exists({ table: 'products', column: 'id' }),
          quantity: vine.number().min(1),
        })
      )
      .optional(),
  })
)
