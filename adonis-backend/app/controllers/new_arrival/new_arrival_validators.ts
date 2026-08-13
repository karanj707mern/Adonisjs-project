import vine from '@vinejs/vine'

export const createNewArrivalValidator = vine.compile(
  vine.object({
    url: vine.string().trim().maxLength(500),
    alt: vine.string().trim().optional().nullable(),
    sortOrder: vine.number().min(0).optional(),
    active: vine.boolean().optional(),
    comingSoon: vine.boolean().optional(),
  })
)
