import vine from '@vinejs/vine';

export const loginValidator = vine.compile(
  vine.object({
    email: vine.string().email().toEmail(),
    password: vine.string().minLength(6),
    captchaId: vine.string().minLength(1),
    captchaInput: vine.string().minLength(1),
  }),
);

export const registerValidator = vine.compile(
  vine.object({
    name: vine.string().minLength(3).maxLength(100).trim(),
    email: vine.string().email().toEmail().maxLength(255),
    password: vine.string().minLength(6).maxLength(128),
    captchaId: vine.string().minLength(1),
    captchaInput: vine.string().minLength(1),
  }),
);

export const verifyEmailValidator = vine.compile(
  vine.object({
    token: vine.string().minLength(16),
  }),
);

export const resendVerificationValidator = vine.compile(
  vine.object({
    email: vine.string().email().toEmail(),
  }),
);

export const forgotPasswordValidator = vine.compile(
  vine.object({
    email: vine.string().email().toEmail(),
  }),
);

export const resetPasswordValidator = vine.compile(
  vine.object({
    token: vine.string().minLength(16),
    password: vine.string().minLength(6),
  }),
);

export const updateProfileValidator = vine.compile(
  vine.object({
    name: vine.string().maxLength(100).trim().optional(),
    phoneNumber: vine.string().maxLength(20).trim().optional(),
    addressLine1: vine.string().maxLength(255).trim().optional(),
    addressLine2: vine.string().maxLength(255).trim().optional(),
    city: vine.string().maxLength(100).trim().optional(),
    state: vine.string().maxLength(100).trim().optional(),
    postalCode: vine.string().maxLength(20).trim().optional(),
    country: vine.string().maxLength(100).trim().optional(),
    avatar: vine.string().maxLength(500).trim().optional(),
  }),
);

export const changePasswordValidator = vine.compile(
  vine.object({
    currentPassword: vine.string().minLength(6),
    newPassword: vine.string().minLength(8),
  }),
);

export const deleteAccountValidator = vine.compile(
  vine.object({
    password: vine.string().minLength(6),
    confirmation: vine.string().equals('DELETE'),
  }),
);

export const googleAuthValidator = vine.compile(
  vine.object({
    credential: vine.string().minLength(10),
  }),
);

export const createUserAddressValidator = vine.compile(
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
  }),
);

export const updateUserAddressValidator = vine.compile(
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
  }),
);
