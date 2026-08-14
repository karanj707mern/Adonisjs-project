import vine from '@vinejs/vine'

export const createCouponValidator = vine.create(
  vine.object({
    code: vine.string().minLength(3).maxLength(30),
    discountType: vine.string().regex(/^(PERCENTAGE|FIXED)$/),
    discountValue: vine.number().min(0),
    minOrderValue: vine.number().min(0).optional(),
    maxDiscount: vine.number().min(0).optional(),
    usageLimit: vine.number().min(1).optional(),
    perUserLimit: vine.number().min(1).optional(),
    validFrom: vine.string(),
    validUntil: vine.string(),
  })
)

export const updateCouponValidator = vine.create(
  vine.object({
    code: vine.string().minLength(3).maxLength(30).optional(),
    discountType: vine.string().regex(/^(PERCENTAGE|FIXED)$/).optional(),
    discountValue: vine.number().min(0).optional(),
    minOrderValue: vine.number().min(0).optional(),
    maxDiscount: vine.number().min(0).optional(),
    usageLimit: vine.number().min(1).optional(),
    perUserLimit: vine.number().min(1).optional(),
    validFrom: vine.string().optional(),
    validUntil: vine.string().optional(),
  })
)
