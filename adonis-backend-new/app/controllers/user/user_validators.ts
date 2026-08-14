import vine from '@vinejs/vine'

export const createUserValidator = vine.create(
  vine.object({
    name: vine.string().maxLength(100),
    email: vine.string().email().email().maxLength(255),
    password: vine.string().minLength(6).maxLength(128),
  })
)

export const updateUserValidator = vine.create(
  vine.object({
    name: vine.string().maxLength(100).optional(),
    email: vine.string().email().email().maxLength(255).optional(),
    password: vine.string().minLength(6).maxLength(128).optional(),
  })
)
