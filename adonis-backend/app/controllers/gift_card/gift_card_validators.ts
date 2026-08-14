import vine from '@vinejs/vine';

export const createGiftCardValidator = vine.compile(
  vine.object({
    code: vine.string().trim().optional(),
    amount: vine.number().min(1),
    currency: vine.string().trim().optional(),
    isActive: vine.boolean().optional(),
    expiresAt: vine.string().optional(),
  }),
);

export const updateGiftCardValidator = vine.compile(
  vine.object({
    isActive: vine.boolean().optional(),
    expiresAt: vine.string().optional(),
  }),
);
