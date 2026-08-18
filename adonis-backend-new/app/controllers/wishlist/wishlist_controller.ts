import type { HttpContext } from '@adonisjs/core/http';
import { inject } from '@adonisjs/fold';
import RedisCacheService from '#services/redis_cache_service';
import WishlistService from './wishlist_service';
import { mergeGuestWishlistValidator } from './wishlist_validators';
import { BadRequestException } from '@adonisjs/core/http';

@inject()
export default class WishlistController {
  constructor(
    @inject('RedisCache') private cache: RedisCacheService,
    private wishlistService: WishlistService,
  ) {}

  private getGuestToken(ctx: HttpContext): string | undefined {
    return (ctx as any).guestToken;
  }

  async findAll(ctx: HttpContext) {
    const userId = ctx.auth?.user?.id;
    const guestToken = this.getGuestToken(ctx);
    const result = await this.wishlistService.findAll(userId, guestToken);
    return ctx.response.json(result);
  }

  async createGuestWishlist(ctx: HttpContext) {
    const guestToken = this.getGuestToken(ctx);
    return ctx.response.json({ token: guestToken });
  }

  async add(ctx: HttpContext) {
    const userId = ctx.auth?.user?.id;
    const productId = Number(ctx.params.productId);
    const guestToken = this.getGuestToken(ctx);
    const result = await this.wishlistService.add(
      userId,
      productId,
      guestToken,
    );
    return ctx.response.status(201).json(result);
  }

  async remove(ctx: HttpContext) {
    const userId = ctx.auth?.user?.id;
    const productId = Number(ctx.params.productId);
    const guestToken = this.getGuestToken(ctx);
    const result = await this.wishlistService.remove(
      userId,
      productId,
      guestToken,
    );
    return ctx.response.status(204).send('');
  }

  async getGuestWishlist(ctx: HttpContext) {
    const token = ctx.params.token;
    const guestToken = this.getGuestToken(ctx);
    const actualToken = token || guestToken;
    if (!actualToken) {
      throw new BadRequestException('Guest wishlist token is required');
    }
    const result = await this.wishlistService.findAll(undefined, actualToken);
    return ctx.response.json(result);
  }

  async deleteGuestWishlist(ctx: HttpContext) {
    const token = ctx.params.token;
    const guestToken = this.getGuestToken(ctx);
    const actualToken = token || guestToken;
    if (!actualToken) {
      throw new BadRequestException('Guest wishlist token is required');
    }
    const userId = ctx.auth?.user?.id;
    if (userId) {
      await this.wishlistService.clear(userId);
    }
    return ctx.response.json({});
  }

  async mergeGuestWishlist(ctx: HttpContext) {
    const userId = ctx.auth!.user.id;
    const body = await ctx.request.validateUsing(mergeGuestWishlistValidator);
    const guestToken = this.getGuestToken(ctx);
    const token = body.token || guestToken;
    if (!token) {
      throw new BadRequestException('Guest wishlist token is required');
    }
    const result = await this.wishlistService.mergeGuestWishlist(userId, token);
    return ctx.response.json(result);
  }
}
