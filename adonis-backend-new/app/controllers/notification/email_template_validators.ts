import vine from '@vinejs/vine'

export const emailTemplateCreateValidator = vine.create(
  vine.object({
    name: vine.string().minLength(1),
    subject: vine.string().minLength(1),
    htmlBody: vine.string().minLength(1),
    textBody: vine.string().optional(),
    variables: vine.any().optional(),
    isActive: vine.boolean().optional(),
  })
)

export const emailTemplateUpdateValidator = vine.create(
  vine.object({
    name: vine.string().minLength(1).optional(),
    subject: vine.string().minLength(1).optional(),
    htmlBody: vine.string().minLength(1).optional(),
    textBody: vine.string().optional(),
    variables: vine.any().optional(),
    isActive: vine.boolean().optional(),
  })
)
