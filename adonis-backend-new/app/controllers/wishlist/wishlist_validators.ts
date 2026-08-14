import vine from '@vinejs/vine'

export const mergeGuestWishlistValidator = vine.create(
  vine.object({
    token: vine.string().minLength(1).optional(),
  })
)
