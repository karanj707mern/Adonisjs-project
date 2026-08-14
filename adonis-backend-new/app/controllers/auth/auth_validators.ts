import vine from '@vinejs/vine'

export const loginValidator = vine.create(
  vine.object({
    email: vine.string().email().email(),
    password: vine.string().minLength(6),
    captchaId: vine.string().minLength(1),
    captchaInput: vine.string().minLength(1),
  })
)

export const registerValidator = vine.create(
  vine.object({
    name: vine.string().minLength(3).maxLength(100),
    email: vine.string().email().email().maxLength(255),
    password: vine.string().minLength(6).maxLength(128),
    captchaId: vine.string().minLength(1),
    captchaInput: vine.string().minLength(1),
  })
)

export const verifyEmailValidator = vine.create(
  vine.object({
    token: vine.string().minLength(16),
  })
)

export const resendVerificationValidator = vine.create(
  vine.object({
    email: vine.string().email().email(),
  })
)

export const forgotPasswordValidator = vine.create(
  vine.object({
    email: vine.string().email().email(),
  })
)

export const resetPasswordValidator = vine.create(
  vine.object({
    token: vine.string().minLength(16),
    password: vine.string().minLength(6),
  })
)

export const updateProfileValidator = vine.create(
  vine.object({
    name: vine.string().maxLength(100).optional(),
    phoneNumber: vine.string().maxLength(20).optional(),
    addressLine1: vine.string().maxLength(255).optional(),
    addressLine2: vine.string().maxLength(255).optional(),
    city: vine.string().maxLength(100).optional(),
    state: vine.string().maxLength(100).optional(),
    postalCode: vine.string().maxLength(20).optional(),
    country: vine.string().maxLength(100).optional(),
    avatar: vine.string().maxLength(500).optional(),
  })
)

export const changePasswordValidator = vine.create(
  vine.object({
    currentPassword: vine.string().minLength(6),
    newPassword: vine.string().minLength(8),
  })
)

export const deleteAccountValidator = vine.create(
  vine.object({
    password: vine.string().minLength(6),
    confirmation: vine.string(),
  })
)

export const googleAuthValidator = vine.create(
  vine.object({
    credential: vine.string().minLength(10),
  })
)

export const createUserAddressValidator = vine.create(
  vine.object({
    label: vine.string().maxLength(50),
    recipientName: vine.string().maxLength(100),
    phoneNumber: vine.string().maxLength(20),
    addressLine1: vine.string().maxLength(255),
    addressLine2: vine.string().maxLength(255).optional(),
    city: vine.string().maxLength(100),
    state: vine.string().maxLength(100),
    postalCode: vine.string().maxLength(20),
    country: vine.string().maxLength(100),
    isDefault: vine.boolean().optional(),
  })
)

export const updateUserAddressValidator = vine.create(
  vine.object({
    label: vine.string().maxLength(50).optional(),
    recipientName: vine.string().maxLength(100).optional(),
    phoneNumber: vine.string().maxLength(20).optional(),
    addressLine1: vine.string().maxLength(255).optional(),
    addressLine2: vine.string().maxLength(255).optional(),
    city: vine.string().maxLength(100).optional(),
    state: vine.string().maxLength(100).optional(),
    postalCode: vine.string().maxLength(20).optional(),
    country: vine.string().maxLength(100).optional(),
    isDefault: vine.boolean().optional(),
  })
)
