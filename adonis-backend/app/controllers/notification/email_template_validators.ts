import vine from '@vinejs/vine';

export const emailTemplateCreateValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(1),
    subject: vine.string().trim().minLength(1),
    htmlBody: vine.string().minLength(1),
    textBody: vine.string().optional(),
    variables: vine.optional(vine.any()),
    isActive: vine.optional(vine.boolean()),
  }),
);

export const emailTemplateUpdateValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(1).optional(),
    subject: vine.string().trim().minLength(1).optional(),
    htmlBody: vine.string().minLength(1).optional(),
    textBody: vine.string().optional(),
    variables: vine.optional(vine.any()),
    isActive: vine.optional(vine.boolean()),
  }),
);
