import vine from '@vinejs/vine';

export const createUserValidator = vine.compile(
  vine.object({
    name: vine.string().maxLength(100).trim(),
    email: vine.string().email().toEmail().maxLength(255),
    password: vine.string().minLength(6).maxLength(128),
  }),
);

export const updateUserValidator = vine.compile(
  vine.object({
    name: vine.string().maxLength(100).trim().optional(),
    email: vine.string().email().toEmail().maxLength(255).optional(),
    password: vine.string().minLength(6).maxLength(128).optional(),
  }),
);
