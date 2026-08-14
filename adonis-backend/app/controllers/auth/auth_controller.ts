import { inject, injectable } from '@adonisjs/fold';
import type { HttpContext, HttpResponse } from '@adonisjs/core/http';
import {
  UnauthorizedException,
  BadRequestException,
} from '@adonisjs/core/http';
import type { PrismaClient } from '@prisma/client';
import * as crypto from 'node:crypto';

import AuthService from './auth_service';
import AuthCookiesService from './services/auth_cookies_service';
import DeviceInfoService from './services/device_info_service';
import CaptchaService from './services/captcha_service';
import StorageService from '#services/storage_service';

import {
  loginValidator,
  registerValidator,
  verifyEmailValidator,
  resendVerificationValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  updateProfileValidator,
  changePasswordValidator,
  deleteAccountValidator,
  googleAuthValidator,
  createUserAddressValidator,
  updateUserAddressValidator,
} from './auth_validators';

@inject()
@injectable()
export default class AuthController {
  constructor(
    @inject('Prisma') private prisma: PrismaClient,
    @inject('Storage') private storage: StorageService,
    private authService: AuthService,
    private cookiesService: AuthCookiesService,
    private deviceInfoService: DeviceInfoService,
    private captchaService: CaptchaService,
  ) {}

  private getAuthCookieOptions(maxAge: number): Record<string, unknown> {
    const isProduction = process.env.NODE_ENV === 'production';

    return {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge,
    };
  }

  async generateCaptcha() {
    const captcha = await this.captchaService.generateCaptcha();
    return { captchaId: captcha.text, image: captcha.data };
  }

  async login({ request, response }: HttpContext) {
    const dto = await request.validateUsing(loginValidator);

    if (!dto.captchaId || !dto.captchaInput) {
      throw new BadRequestException('CAPTCHA verification is required');
    }

    const isValid = await this.captchaService.verifyCaptcha(
      dto.captchaId,
      dto.captchaInput,
    );
    if (!isValid) {
      throw new BadRequestException('Invalid or expired CAPTCHA');
    }

    const deviceInfo = this.deviceInfoService.extractDeviceInfo(request);
    const guestToken = (request as any).guestToken;
    const result = await this.authService.login(
      { email: dto.email, password: dto.password },
      deviceInfo,
    );

    this.cookiesService.setAuthCookies(
      response,
      result.accessToken,
      result.refreshToken,
    );

    if (guestToken) {
      await this.authService.mergeGuestData(result.user.id, guestToken);
    }

    return {
      message: result.message,
      user: result.user,
      accessToken: result.accessToken,
    };
  }

  async googleAuth({ request, response }: HttpContext) {
    const dto = await request.validateUsing(googleAuthValidator);

    const deviceInfo = this.deviceInfoService.extractDeviceInfo(request);
    const guestToken = (request as any).guestToken;
    const result = await this.authService.googleAuth(
      { credential: dto.credential },
      deviceInfo,
    );

    this.cookiesService.setAuthCookies(
      response,
      result.accessToken,
      result.refreshToken,
    );

    if (guestToken) {
      await this.authService.mergeGuestData(result.user.id, guestToken);
    }

    return {
      message: result.message,
      user: result.user,
      accessToken: result.accessToken,
    };
  }

  async logout({ request, response }: HttpContext) {
    const refreshToken = request.cookie('refreshToken');
    await this.authService.logoutByRefreshToken(refreshToken);

    this.cookiesService.clearAuthCookies(response);
    this.cookiesService.clearCsrfCookie(response);

    const newGuestToken = crypto.randomBytes(32).toString('hex');
    response.cookie('guest_token', newGuestToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 365 * 24 * 60 * 60 * 1000,
    });

    return { message: 'Logged out successfully' };
  }

  async refresh({ request, response }: HttpContext) {
    const refreshToken = request.cookie('refreshToken');

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not found');
    }

    const result = await this.authService.refreshAccessToken(refreshToken);

    response.cookie(
      'accessToken',
      result.accessToken,
      this.getAuthCookieOptions(60 * 60 * 1000),
    );
    response.cookie(
      'refreshToken',
      result.refreshToken,
      this.getAuthCookieOptions(7 * 24 * 60 * 60 * 1000),
    );

    return { message: result.message };
  }

  async session({ request, response }: HttpContext) {
    try {
      const accessToken = request.cookie('accessToken');
      const refreshToken = request.cookie('refreshToken');
      const result = await this.authService.getSession(
        accessToken,
        refreshToken,
      );

      if (
        result.authenticated &&
        result.refreshed &&
        result.accessToken &&
        result.refreshToken
      ) {
        this.cookiesService.setAuthCookies(
          response,
          result.accessToken,
          result.refreshToken,
        );
      }

      return {
        authenticated: result.authenticated,
        user: result.user,
        csrfToken: request.cookie('csrf-token') || null,
      };
    } catch {
      this.cookiesService.clearAuthCookies(response);

      return {
        authenticated: false,
        user: null,
        error: 'Session check failed',
      };
    }
  }

  async listSessions({ auth }: HttpContext) {
    const userId = (auth!.user as any).id;
    const sessions = await this.authService.listSessions(userId);
    return { sessions };
  }

  async revokeSession({ auth, params }: HttpContext) {
    const userId = (auth!.user as any).id;
    const result = await this.authService.revokeSession(userId, params.id);
    return result;
  }

  async register({ request }: HttpContext) {
    const dto = await request.validateUsing(registerValidator);

    if (!dto.captchaId || !dto.captchaInput) {
      throw new BadRequestException('CAPTCHA verification is required');
    }

    const isValid = await this.captchaService.verifyCaptcha(
      dto.captchaId,
      dto.captchaInput,
    );
    if (!isValid) {
      throw new BadRequestException('Invalid or expired CAPTCHA');
    }

    return this.authService.register({
      name: dto.name,
      email: dto.email,
      password: dto.password,
      captchaId: dto.captchaId,
      captchaInput: dto.captchaInput,
    });
  }

  async verifyEmail({ request }: HttpContext) {
    const dto = await request.validateUsing(verifyEmailValidator);
    return this.authService.verifyEmail({ token: dto.token });
  }

  async resendVerification({ request }: HttpContext) {
    const dto = await request.validateUsing(resendVerificationValidator);
    return this.authService.resendVerification({ email: dto.email });
  }

  async forgotPassword({ request }: HttpContext) {
    const dto = await request.validateUsing(forgotPasswordValidator);
    return this.authService.forgotPassword({ email: dto.email });
  }

  async resetPassword({ request }: HttpContext) {
    const dto = await request.validateUsing(resetPasswordValidator);
    return this.authService.resetPassword({
      token: dto.token,
      password: dto.password,
    });
  }

  async getProfile({ auth }: HttpContext) {
    const userId = (auth!.user as any).id;
    return this.authService.getProfile(userId);
  }

  async updateProfile({ auth, request }: HttpContext) {
    const userId = (auth!.user as any).id;
    const dto = await request.validateUsing(updateProfileValidator);
    return this.authService.updateProfile(userId, dto);
  }

  async changePassword({ auth, request }: HttpContext) {
    const userId = (auth!.user as any).id;
    const dto = await request.validateUsing(changePasswordValidator);
    return this.authService.changePassword(userId, dto);
  }

  async deleteAccount({ auth, request, response }: HttpContext) {
    const userId = (auth!.user as any).id;
    const dto = await request.validateUsing(deleteAccountValidator);
    await this.authService.deleteAccount(userId, {
      password: dto.password,
      confirmation: dto.confirmation,
    });
    this.cookiesService.clearAuthCookies(response);
    return response.status(204).send('');
  }

  async uploadAvatar({ auth, request }: HttpContext) {
    const userId = (auth!.user as any).id;

    const file = request.file('avatar', {
      size: '5mb',
      extnames: ['jpg', 'png', 'webp', 'avif', 'gif'],
    });

    if (!file) {
      throw new BadRequestException('An avatar image is required.');
    }

    const mimeType = file.type;
    if (!(mimeType in allowedImageMimeTypes)) {
      throw new BadRequestException(
        'Only JPG, PNG, WEBP, AVIF, and GIF images are allowed.',
      );
    }

    const currentUser = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { avatar: true },
    });

    if (currentUser?.avatar) {
      const key = currentUser.avatar.replace(/^\/uploads\//, '');
      await this.storage.deleteFile(key);
    }

    const buffer = await file.toBuffer();
    const result = await this.storage.uploadFile(
      { buffer, mimetype: mimeType, originalname: file.clientName },
      'avatars',
    );

    await this.authService.updateProfile(userId, { avatar: result.url });

    return { avatarUrl: result.url };
  }

  async listAddresses({ auth }: HttpContext) {
    const userId = (auth!.user as any).id;
    return this.authService.listAddresses(userId);
  }

  async createAddress({ auth, request }: HttpContext) {
    const userId = (auth!.user as any).id;
    const dto = await request.validateUsing(createUserAddressValidator);
    return this.authService.createAddress(userId, dto);
  }

  async updateAddress({ auth, params, request }: HttpContext) {
    const userId = (auth!.user as any).id;
    const id = Number(params.id);
    const dto = await request.validateUsing(updateUserAddressValidator);
    return this.authService.updateAddress(userId, id, dto);
  }

  async removeAddress({ auth, params }: HttpContext) {
    const userId = (auth!.user as any).id;
    const id = Number(params.id);
    return this.authService.removeAddress(userId, id);
  }
}
