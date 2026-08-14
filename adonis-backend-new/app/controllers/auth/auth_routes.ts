import AuthController from './auth_controller.ts'
import { middleware } from '#start/kernel'
import { authLimiter } from '#start/limiter'
import type { Router } from '@adonisjs/core/http'

export default function registerAuth(router: Router) {
  router
    .group(() => {
      router.get('captcha', [AuthController, 'generateCaptcha'])
      router.post('login', [AuthController, 'login']).middleware(authLimiter)
      router.post('google', [AuthController, 'googleAuth']).middleware(authLimiter)
      router.post('register', [AuthController, 'register']).middleware(authLimiter)
      router.post('verify-email', [AuthController, 'verifyEmail']).middleware(authLimiter)
      router.post('resend-verification', [AuthController, 'resendVerification']).middleware(authLimiter)
      router.post('forgot-password', [AuthController, 'forgotPassword']).middleware(authLimiter)
      router.post('reset-password', [AuthController, 'resetPassword']).middleware(authLimiter)
      router.get('session', [AuthController, 'session']).middleware(authLimiter)
      router.post('refresh', [AuthController, 'refresh']).middleware(authLimiter)
    })
    .prefix('auth')

  router
    .group(() => {
      router.get('profile', [AuthController, 'getProfile'])
      router.patch('profile', [AuthController, 'updateProfile'])
      router.post('change-password', [AuthController, 'changePassword'])
      router.delete('account', [AuthController, 'deleteAccount'])
      router.post('logout', [AuthController, 'logout'])
      router.post('upload-avatar', [AuthController, 'uploadAvatar'])
      router.get('sessions', [AuthController, 'listSessions'])
      router.delete('sessions/:id', [AuthController, 'revokeSession'])
      router.get('addresses', [AuthController, 'listAddresses'])
      router.post('addresses', [AuthController, 'createAddress'])
      router.patch('addresses/:id', [AuthController, 'updateAddress'])
      router.delete('addresses/:id', [AuthController, 'removeAddress'])
    })
    .middleware(middleware.auth())
    .prefix('auth')
}
