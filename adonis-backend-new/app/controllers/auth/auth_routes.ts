import type { Router } from '@adonisjs/core/http';
import AuthController from './auth_controller';

export default function registerAuth(router) {
  router.group(() => {
    router.get('captcha', [AuthController, 'generateCaptcha']);
      router.post('login', [AuthController, 'login']);
      router.post('google', [AuthController, 'googleAuth']);
      router.post('register', [AuthController, 'register']);
      router.post('verify-email', [AuthController, 'verifyEmail']);
      router.post('resend-verification', [AuthController, 'resendVerification']);
      router.post('forgot-password', [AuthController, 'forgotPassword']);
      router.post('reset-password', [AuthController, 'resetPassword']);
      router.get('session', [AuthController, 'session']);
      router.post('refresh', [AuthController, 'refresh']);
    
      router
        .group(() => {
          router.get('profile', [AuthController, 'getProfile']);
          router.patch('profile', [AuthController, 'updateProfile']);
          router.post('change-password', [AuthController, 'changePassword']);
          router.delete('account', [AuthController, 'deleteAccount']);
          router.post('logout', [AuthController, 'logout']);
          router.post('upload-avatar', [AuthController, 'uploadAvatar']);
          router.get('sessions', [AuthController, 'listSessions']);
          router.delete('sessions/:id', [AuthController, 'revokeSession']);
          router.get('addresses', [AuthController, 'listAddresses']);
          router.post('addresses', [AuthController, 'createAddress']);
          router.patch('addresses/:id', [AuthController, 'updateAddress']);
          router.delete('addresses/:id', [AuthController, 'removeAddress']);
        })
        .middleware('auth');
  }).prefix('Auth');
}
