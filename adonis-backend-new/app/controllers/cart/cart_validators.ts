import vine from '@vinejs/vine';

export const createCartValidator = vine.compile(
  vine.object({
    productId: vine.number(),
    quantity: vine.number().min(1).optional(),
  }),
);

export const updateCartValidator = vine.compile(
  vine.object({
    quantity: vine.number().min(0),
  }),
);

export const mergeGuestCartValidator = vine.compile(
  vine.object({
    token: vine.string().minLength(1).optional(),
    items: vine
      .array(
        vine.object({
          productId: vine.number(),
          quantity: vine.number().min(1),
        }),
      )
      .optional(),
  }),
);

export const guestCartValidator = vine.compile(
  vine.object({
    items: vine
      .array(
        vine.object({
          productId: vine.number(),
          quantity: vine.number().min(1),
        }),
      )
      .optional(),
  }),
);
