import vine from '@vinejs/vine';

export const createReviewValidator = vine.compile(
  vine.object({
    rating: vine.number().min(1).max(5),
    title: vine.string().maxLength(120).optional(),
    content: vine.string().maxLength(2000),
  }),
);

export const createReviewCommentValidator = vine.compile(
  vine.object({
    content: vine.string().maxLength(1000),
  }),
);

export const moderateReviewValidator = vine.compile(
  vine.object({
    status: vine.enum(['APPROVED', 'REJECTED'] as const),
    adminNote: vine.string().maxLength(500).optional(),
  }),
);
