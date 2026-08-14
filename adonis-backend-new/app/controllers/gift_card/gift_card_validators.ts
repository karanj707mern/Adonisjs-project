import vine from '@vinejs/vine'

export const createGiftCardValidator = vine.create(
  vine.object({
    code: vine.string().optional(),
    amount: vine.number().min(1),
    currency: vine.string().optional(),
    isActive: vine.boolean().optional(),
    expiresAt: vine.string().optional(),
  })
)

export const updateGiftCardValidator = vine.create(
  vine.object({
    isActive: vine.boolean().optional(),
    expiresAt: vine.string().optional(),
  })
)
