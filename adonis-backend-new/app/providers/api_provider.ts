import { inject } from '@adonisjs/fold';
import type { ApplicationService } from '@adonisjs/core/types';
import { PrismaClient } from '@prisma/client';
import PrismaService from '#services/prisma_service';
import RedisCacheService from '#services/redis_cache_service';
import StorageService from '#services/storage_service';
import AbandonedCartService from '#services/abandoned_cart_service';
import EmailVerificationService from '#controllers/auth/services/email_verification_service';
import SessionService from '#controllers/auth/services/session_service';
import DeviceInfoService from '#controllers/auth/services/device_info_service';
import AuthCookiesService from '#controllers/auth/services/auth_cookies_service';
import CaptchaService from '#controllers/auth/services/captcha_service';
import ProductService from '#controllers/product/product_service';
import CatalogExtraService from '#controllers/product/catalog_extra_service';
import CartService from '#controllers/cart/cart_service';
import OrderService from '#controllers/order/order_service';
import ReviewService from '#controllers/review/review_service';
import WishlistService from '#controllers/wishlist/wishlist_service';
import AuthService from '#controllers/auth/auth_service';
import BlogService from '#controllers/blog/blog_service';
import SettingsService from '#controllers/settings/settings_service';
import HeroService from '#controllers/hero/hero_service';
import NewArrivalService from '#controllers/new_arrival/new_arrival_service';
import CouponService from '#controllers/coupon/coupon_service';
import GiftCardService from '#controllers/gift_card/gift_card_service';
import AdminService from '#controllers/admin/admin_service';
import AnalyticsService from '#controllers/analytics/analytics_service';
import AuditService from '#controllers/audit/audit_service';

@inject()
export default class ApiProvider {
  constructor(protected app: ApplicationService) {}

  register() {
    const container = this.app.container;

    const redisCache = new RedisCacheService();
    const storage = new StorageService();
    const emailVerification = new EmailVerificationService();
    const deviceInfo = new DeviceInfoService();

    container.singleton(RedisCacheService, () => redisCache);
    container.singleton(StorageService, () => storage);
    container.singleton(EmailVerificationService, () => emailVerification);
    container.singleton(DeviceInfoService, () => deviceInfo);
    container.singleton(AuthCookiesService, () => new AuthCookiesService());
    container.singleton(CaptchaService, () => new CaptchaService(redisCache));

    // Register raw PrismaClient for direct constructor injection
    container.singleton(PrismaClient as any, async () => {
      return await container.make('Database');
    });

    container.singleton(AbandonedCartService, async () => {
      const db = (await container.make('Database')) as PrismaClient;
      return new AbandonedCartService(db, redisCache);
    });

    container.singleton(SessionService, async () => {
      const db = (await container.make('Database')) as PrismaClient;
      return new SessionService(db);
    });

    container.singleton(AuditService, async () => {
      const db = (await container.make('Database')) as PrismaClient;
      return new AuditService(db);
    });

    container.singleton(ProductService, async () => {
      const db = (await container.make('Database')) as PrismaClient;
      return new ProductService(db, redisCache, storage);
    });

    container.singleton(CatalogExtraService, async () => {
      const db = (await container.make('Database')) as PrismaClient;
      return new CatalogExtraService(db, redisCache);
    });

    container.singleton(CartService, async () => {
      const db = (await container.make('Database')) as PrismaClient;
      const abandoned = await container.make(AbandonedCartService);
      return new CartService(db, redisCache, abandoned);
    });

    container.singleton(WishlistService, async () => {
      const db = (await container.make('Database')) as PrismaClient;
      return new WishlistService(db, redisCache);
    });

    container.singleton(CouponService, async () => {
      const db = (await container.make('Database')) as PrismaClient;
      return new CouponService(db);
    });

    container.singleton(GiftCardService, async () => {
      const db = (await container.make('Database')) as PrismaClient;
      return new GiftCardService(db);
    });

    container.singleton(SettingsService, async () => {
      const db = (await container.make('Database')) as PrismaClient;
      return new SettingsService(db, redisCache);
    });

    container.singleton(HeroService, async () => {
      const db = (await container.make('Database')) as PrismaClient;
      return new HeroService(db, redisCache, storage);
    });

    container.singleton(NewArrivalService, async () => {
      const db = (await container.make('Database')) as PrismaClient;
      return new NewArrivalService(db, storage);
    });

    container.singleton(BlogService, async () => {
      const db = (await container.make('Database')) as PrismaClient;
      return new BlogService(db, redisCache, storage);
    });

    container.singleton(ReviewService, async () => {
      const db = (await container.make('Database')) as PrismaClient;
      return new ReviewService(db, emailVerification, redisCache);
    });

    container.singleton(AuthService, async () => {
      const db = (await container.make('Database')) as PrismaClient;
      return new AuthService(
        db,
        storage,
        redisCache,
        deviceInfo,
        emailVerification,
        await container.make(SessionService),
      );
    });

    container.singleton(AdminService, async () => {
      const db = (await container.make('Database')) as PrismaClient;
      return new AdminService(db, await container.make(AuditService));
    });

    container.singleton(AnalyticsService, async () => {
      const db = (await container.make('Database')) as PrismaClient;
      return new AnalyticsService(
        db,
        redisCache,
        await container.make(AbandonedCartService),
      );
    });
  }
}
