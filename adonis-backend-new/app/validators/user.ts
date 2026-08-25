import vine from '@vinejs/vine';

/**
 * Shared rules for email and password.
 */
const email = () => vine.string().email().maxLength(254);
const password = () => vine.string().minLength(8).maxLength(32);

/**
 * Validator to use when performing self-signup
 */
export const signupValidator = vine.compile(
  vine.object({
    fullName: vine.string().minLength(1).maxLength(100).trim(),
    email: email(),
    password: password(),
    passwordConfirmation: password().sameAs('password'),
  }),
);

/**
 * Validator to use before validating user credentials
 * during login
 */
export const loginValidator = vine.compile(
  vine.object({
    email: email(),
    password: vine.string(),
  }),
);
