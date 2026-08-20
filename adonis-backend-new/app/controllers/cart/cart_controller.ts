import type { HttpContext } from '@adonisjs/core/http';
import { inject } from '@adonisjs/fold';
import {  BadRequestException  } from '#exceptions/http_exceptions';
import CartService from './cart_service';
import {
  createCartValidator,
  updateCartValidator,
  mergeGuestCartValidator,
  guestCartValidator,
} from './cart_validators';

@inject()
export default class CartController {
  constructor(private cartService: CartService) {}

  async create(ctx: HttpContext) {
    const userId = (ctx.auth as any)?.user?.id;
    const guestToken = (ctx as any).guestToken as string | undefined;
    const data = await ctx.request.validateUsing(createCartValidator);
    return this.cartService.create(
      userId,
      data.productId,
      data.quantity ?? 1,
      guestToken,
    );
  }

  async findAll(ctx: HttpContext) {
    const userId = (ctx.auth as any)?.user?.id;
    const guestToken = (ctx as any).guestToken as string | undefined;
    return this.cartService.findAll(userId, guestToken);
  }

  async findOne(ctx: HttpContext) {
    const userId = (ctx.auth as any)?.user?.id;
    const guestToken = (ctx as any).guestToken as string | undefined;
    const id = Number(ctx.request.param('id'));
    return this.cartService.findOne(userId, id, guestToken);
  }

  async update(ctx: HttpContext) {
    const userId = (ctx.auth as any)?.user?.id;
    const guestToken = (ctx as any).guestToken as string | undefined;
    const id = Number(ctx.request.param('id'));
    const data = await ctx.request.validateUsing(updateCartValidator);
    return this.cartService.update(userId, id, data.quantity, guestToken);
  }

  async remove(ctx: HttpContext) {
    const userId = (ctx.auth as any)?.user?.id;
    const guestToken = (ctx as any).guestToken as string | undefined;
    const id = Number(ctx.request.param('id'));
    return this.cartService.remove(userId, id, guestToken);
  }

  async clear(ctx: HttpContext) {
    const userId = (ctx.auth as any)?.user?.id;
    const guestToken = (ctx as any).guestToken as string | undefined;
    return this.cartService.clear(userId, guestToken);
  }

  async createGuestCart(ctx: HttpContext) {
    const guestToken = (ctx as any).guestToken as string | undefined;
    const data = await ctx.request.validateUsing(guestCartValidator);
    const result = await this.cartService.createGuestCart(
      data.items ?? [],
      guestToken,
    );
    return ctx.response.json({
      token: result.token,
      cart: result.cart,
    });
  }

  async getGuestCart(ctx: HttpContext) {
    const token = ctx.request.param('token') || (ctx as any).guestToken;
    return this.cartService.getGuestCart(token);
  }

  async mergeGuestCart(ctx: HttpContext) {
    const userId = (ctx.auth as any)?.user?.id as number;
    const guestToken = (ctx as any).guestToken as string | undefined;
    const data = await ctx.request.validateUsing(mergeGuestCartValidator);
    const token = data.token || guestToken;
    if (!token) {
      throw new BadRequestException('Guest cart token is required');
    }
    return this.cartService.mergeGuestCart(userId, token);
  }

  async deleteGuestCart(ctx: HttpContext) {
    const token = ctx.request.param('token') || (ctx as any).guestToken;
    if (!token) {
      throw new BadRequestException('Guest cart token is required');
    }
    return this.cartService.deleteGuestCart(token);
  }
}
