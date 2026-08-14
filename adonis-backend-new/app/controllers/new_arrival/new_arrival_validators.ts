import vine from '@vinejs/vine'

export const createNewArrivalValidator = vine.create(
  vine.object({
    url: vine.string().maxLength(500),
    alt: vine.string().optional().nullable(),
    sortOrder: vine.number().min(0).optional(),
    active: vine.boolean().optional(),
    comingSoon: vine.boolean().optional(),
  })
)
