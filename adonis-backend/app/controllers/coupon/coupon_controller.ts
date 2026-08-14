import type { HttpContext } from '@adonisjs/core/http';
import { inject } from '@adonisjs/fold';
import CouponService from './coupon_service';
import { createCouponValidator } from './coupon_validators';
import { BadRequestException } from '@adonisjs/core/http';

@inject()
export default class CouponController {
  constructor(private couponService: CouponService) {}

  async validate({ request, response }: HttpContext) {
    const body = request.all();
    const code = String(body.code || '').trim();
    const orderValue = Number(body.orderValue);
    const userId = body.userId ? Number(body.userId) : 0;

    if (!code) {
      throw new BadRequestException('Coupon code is required.');
    }

    const result =
      userId > 0
        ? await this.couponService.validateForUser(code, orderValue, userId)
        : await this.couponService.validate(code, orderValue);

    return response.json(result);
  }

  async findAll({ response }: HttpContext) {
    const result = await this.couponService.findAll();
    return response.json(result);
  }

  async getAnalytics({ response }: HttpContext) {
    const result = await this.couponService.getCouponAnalytics();
    return response.json(result);
  }

  async create({ request, response }: HttpContext) {
    const data = await request.validateUsing(createCouponValidator);
    const result = await this.couponService.create(data);
    return response.status(201).json(result);
  }

  async update({ params, request, response }: HttpContext) {
    const id = Number(params.id);
    const data = await request.validateUsing(createCouponValidator);
    const result = await this.couponService.update(id, data);
    return response.json(result);
  }

  async remove({ params, response }: HttpContext) {
    const id = Number(params.id);
    await this.couponService.remove(id);
    return response.status(204).send('');
  }
}
