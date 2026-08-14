import vine from '@vinejs/vine'

export const salesStatsQueryValidator = vine.create(
  vine.object({
    startDate: vine.string().optional(),
    endDate: vine.string().optional(),
  })
)

export const recentlyViewedQueryValidator = vine.create(
  vine.object({
    limit: vine.number().min(1).max(50).optional(),
  })
)
