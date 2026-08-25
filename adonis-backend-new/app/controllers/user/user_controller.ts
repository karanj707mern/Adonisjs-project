import { inject } from '@adonisjs/fold';
import type { HttpContext } from '@adonisjs/core/http';
import { ForbiddenException } from '#exceptions/http_exceptions';
import { Role } from '@prisma/client';

import UserService from './user_service.js';
import DeviceInfoService from '#controllers/auth/services/device_info_service';
import { createUserValidator, updateUserValidator } from './user_validators.js';

@inject()
export default class UserController {
  constructor(
    private userService: UserService,
    private deviceInfoService: DeviceInfoService,
  ) {}

  async create({ request }: HttpContext) {
    const dto = await request.validateUsing(createUserValidator);
    return this.userService.create({
      name: dto.name,
      email: dto.email,
      password: dto.password,
    });
  }

  async findAll() {
    return this.userService.findAll();
  }

  async findOne({ auth, params }: HttpContext) {
    const user = auth!.user as { id: number; role: Role };
    const id = Number(params.id);

    if (user.role !== 'ADMIN' && user.id !== id) {
      throw new ForbiddenException('You can only access your own account.');
    }

    return this.userService.findOne(id);
  }

  async update({ auth, request, params }: HttpContext) {
    const user = auth!.user as { id: number; role: Role };
    const id = Number(params.id);

    if (user.role !== 'ADMIN' && user.id !== id) {
      throw new ForbiddenException('You can only update your own account.');
    }

    const deviceInfo = this.deviceInfoService.extractDeviceInfo({
      header: request.header.bind(request),
      ip: request.ip(),
    });
    const dto = await request.validateUsing(updateUserValidator);

    // Extract CAPTCHA fields for sensitive operations (email/password change)
    const captchaId = request.input('captchaId') || undefined;
    const captchaInput = request.input('captchaInput') || undefined;

    return this.userService.update(
      id,
      dto,
      captchaId,
      captchaInput,
      deviceInfo,
    );
  }

  async remove({ params }: HttpContext) {
    const id = Number(params.id);
    return this.userService.remove(id);
  }
}
