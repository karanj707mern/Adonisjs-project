import vine from '@vinejs/vine';

export const mergeGuestWishlistValidator = vine.compile(
  vine.object({
    token: vine.string().minLength(1).optional(),
  }),
);
