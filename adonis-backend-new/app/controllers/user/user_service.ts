import { inject } from '@adonisjs/fold';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import logger from '@adonisjs/core/services/logger';
import { BadRequestException } from '#exceptions/http_exceptions';

import CaptchaService from '#controllers/auth/services/captcha_service';

const safeUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  isEmailVerified: true,
  authProvider: true,
  phoneNumber: true,
  addressLine1: true,
  addressLine2: true,
  city: true,
  state: true,
  postalCode: true,
  country: true,
  createdAt: true,
  updatedAt: true,
} as const;

@inject()
export default class UserService {
  constructor(
    private prisma: PrismaClient,
    private captchaService: CaptchaService,
  ) {}

  private normalizeEmail(email: string) {
    return email.trim().toLowerCase();
  }

  async create(data: { name: string; email: string; password: string }) {
    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await this.prisma.user.create({
      data: {
        name: data.name.trim(),
        email: this.normalizeEmail(data.email),
        password: hashedPassword,
      },
      select: safeUserSelect,
    });

    return user;
  }

  findAll() {
    return this.prisma.user.findMany({
      select: safeUserSelect,
    });
  }

  findOne(id: number) {
    return this.prisma.user.findUnique({
      where: { id },
      select: safeUserSelect,
    });
  }

  async update(
    id: number,
    updateUserDto: Record<string, unknown>,
    captchaId?: string,
    captchaInput?: string,
    deviceInfo?: {
      ip?: string;
      country?: string;
      city?: string;
      userAgent?: string;
      browser?: string;
      os?: string;
      device?: string;
    },
  ) {
    const sensitiveFields = ['email', 'password'];
    const isModifyingSensitive = sensitiveFields.some(
      (field) => updateUserDto[field] !== undefined,
    );

    if (isModifyingSensitive) {
      if (!captchaId || !captchaInput) {
        throw new BadRequestException(
          'CAPTCHA verification is required for security changes',
        );
      }

      const isValid = await this.captchaService.verifyCaptcha(
        captchaId,
        captchaInput,
      );
      if (!isValid) {
        throw new BadRequestException('Invalid or expired CAPTCHA');
      }
    }

    const data: Record<string, unknown> = {};

    if (updateUserDto.name !== undefined) {
      data.name = String(updateUserDto.name).trim();
    }

    if (updateUserDto.email !== undefined) {
      data.email = this.normalizeEmail(String(updateUserDto.email));
    }

    if (updateUserDto.password !== undefined) {
      data.password = await bcrypt.hash(String(updateUserDto.password), 10);
    }

    const result = await this.prisma.user.update({
      where: { id },
      data,
      select: safeUserSelect,
    });

    if (isModifyingSensitive) {
      logger.warn(
        {
          userId: id,
          event: 'sensitive_fields_changed',
          emailChanged: updateUserDto.email !== undefined,
          passwordChanged: updateUserDto.password !== undefined,
        },
        'Security-sensitive user fields modified',
      );
    }

    return result;
  }

  remove(id: number) {
    return this.prisma.user.delete({
      where: { id },
    });
  }
}
