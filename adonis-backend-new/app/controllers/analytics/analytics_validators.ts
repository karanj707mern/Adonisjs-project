import vine from '@vinejs/vine';

export const salesStatsQueryValidator = vine.compile(
  vine.object({
    startDate: vine.string().optional(),
    endDate: vine.string().optional(),
  }),
);

export const recentlyViewedQueryValidator = vine.compile(
  vine.object({
    limit: vine.number().min(1).max(50).optional(),
  }),
);
