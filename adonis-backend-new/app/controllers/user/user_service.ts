import { inject } from '@adonisjs/fold';
import { Database } from '@adonisjs/lucid/database';
import bcrypt from 'bcrypt';
import { BadRequestException } from '@adonisjs/core/http';

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

export default class UserService {
  constructor(
    private db: Database,
    private captchaService: CaptchaService,
  ) {}

  private normalizeEmail(email: string) {
    return email.trim().toLowerCase();
  }

  async create(data: { name: string; email: string; password: string }) {
    const hashedPassword = await bcrypt.hash(data.password, 10);

    const insertId = await this.db.table('users').insert({
      name: data.name.trim(),
      email: this.normalizeEmail(data.email),
      password: hashedPassword,
    });

    const [user] = await this.db
      .table('users')
      .where('id', insertId[0])
      .first();

    return user;
  }

  findAll() {
    return this.db
      .table('users')
      .select(...Object.keys(safeUserSelect).map((k) => k as any));
  }

  findOne(id: number) {
    return this.db
      .table('users')
      .where('id', id)
      .select(...Object.keys(safeUserSelect).map((k) => k as any))
      .first();
  }

  async update(
    id: number,
    updateUserDto: Record<string, unknown>,
    captchaId?: string,
    captchaInput?: string,
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

    await this.db.table('users').where('id', id).update(data);

    const result = await this.db
      .table('users')
      .where('id', id)
      .select(...Object.keys(safeUserSelect).map((k) => k as any))
      .first();

    if (isModifyingSensitive) {
      console.log(
        'SECURITY AUDIT LOG:',
        JSON.stringify(
          {
            timestamp: new Date().toISOString(),
            userId: id,
            changes: {
              emailChanged: updateUserDto.email !== undefined,
              passwordChanged: updateUserDto.password !== undefined,
            },
          },
          null,
          2,
        ),
      );
    }

    return result;
  }

  remove(id: number) {
    return this.db.table('users').where('id', id).delete();
  }
}
