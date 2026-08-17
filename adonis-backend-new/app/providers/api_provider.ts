import type { ApplicationService } from '@adonisjs/core/types'
import RedisCacheService from '#services/redis_cache_service'
import StorageService from '#services/storage_service'
import EmailVerificationService from '#controllers/auth/services/email_verification_service'
import SessionService from '#controllers/auth/services/session_service'
import ProductService from '#controllers/product/product_service'
import CatalogExtraService from '#controllers/product/catalog_extra_service'
import CartService from '#controllers/cart/cart_service'
import OrderService from '#controllers/order/order_service'
import ReviewService from '#controllers/review/review_service'
import WishlistService from '#controllers/wishlist/wishlist_service'
import AuthService from '#controllers/auth/auth_service'
import BlogService from '#controllers/blog/blog_service'
import SettingsService from '#controllers/settings/settings_service'
import HeroService from '#controllers/hero/hero_service'
import NewArrivalService from '#controllers/new_arrival/new_arrival_service'
import CouponService from '#controllers/coupon/coupon_service'
import GiftCardService from '#controllers/gift_card/gift_card_service'
import NotificationService from '#controllers/notification/notification_service'
import AdminService from '#controllers/admin/admin_service'
import AnalyticsService from '#controllers/analytics/analytics_service'
import AuditService from '#controllers/audit/audit_service'

export default class ApiProvider {
  constructor(protected app: ApplicationService) {}

  register() {
    this.app.container.singleton('Database' as any, () =>
      this.app.container.make('Database')
    )
    this.app.container.singleton('RedisCacheService' as any, () => new RedisCacheService())
    this.app.container.singleton('StorageService' as any, () => new StorageService())
    this.app.container.singleton(
      'EmailVerificationService' as any,
      () => new EmailVerificationService()
    )
    this.app.container.singleton('SessionService' as any, async () => {
      const db = await this.app.container.make('Database')
      return new SessionService(db)
    })
    this.app.container.singleton('ProductService' as any, async () => {
      const db = await this.app.container.make('Database')
      return new ProductService(
        db,
        await this.app.container.make('RedisCacheService'),
        await this.app.container.make('StorageService')
      )
    })
    this.app.container.singleton('CatalogExtraService' as any, async () => {
      const db = await this.app.container.make('Database')
      return new CatalogExtraService(
        db,
        await this.app.container.make('RedisCacheService')
      )
    })
    this.app.container.singleton('CartService' as any, async () => {
      const db = await this.app.container.make('Database')
      return new CartService(
        db,
        await this.app.container.make('RedisCacheService')
      )
    })
    this.app.container.singleton('OrderService' as any, async () => {
      const db = await this.app.container.make('Database')
      return new OrderService(db, await this.app.container.make('RedisCacheService'))
    })
    this.app.container.singleton('ReviewService' as any, async () => {
      const db = await this.app.container.make('Database')
      return new ReviewService(
        db,
        await this.app.container.make('EmailVerificationService'),
        await this.app.container.make('RedisCacheService')
      )
    })
    this.app.container.singleton('WishlistService' as any, async () => {
      const db = await this.app.container.make('Database')
      return new WishlistService(
        db,
        await this.app.container.make('RedisCacheService')
      )
    })
    this.app.container.singleton('AuthService' as any, async () => {
      const db = await this.app.container.make('Database')
      return new AuthService(
        db,
        await this.app.container.make('EmailVerificationService'),
        await this.app.container.make('SessionService')
      )
    })
    this.app.container.singleton('BlogService' as any, async () => {
      const db = await this.app.container.make('Database')
      return new BlogService(
        db,
        await this.app.container.make('RedisCacheService'),
        await this.app.container.make('StorageService')
      )
    })
    this.app.container.singleton('SettingsService' as any, async () => {
      const db = await this.app.container.make('Database')
      return new SettingsService(
        db,
        await this.app.container.make('RedisCacheService')
      )
    })
    this.app.container.singleton('HeroService' as any, async () => {
      const db = await this.app.container.make('Database')
      return new HeroService(
        db,
        await this.app.container.make('RedisCacheService'),
        await this.app.container.make('StorageService')
      )
    })
    this.app.container.singleton('NewArrivalService' as any, async () => {
      const db = await this.app.container.make('Database')
      return new NewArrivalService(
        db,
        await this.app.container.make('StorageService')
      )
    })
    this.app.container.singleton('CouponService' as any, async () => {
      const db = await this.app.container.make('Database')
      return new CouponService(db)
    })
    this.app.container.singleton('GiftCardService' as any, async () => {
      const db = await this.app.container.make('Database')
      return new GiftCardService(db)
    })
    this.app.container.singleton('NotificationService' as any, async () => {
      const db = await this.app.container.make('Database')
      return new NotificationService(
        db,
        await this.app.container.make('BullMqService')
      )
    })
    this.app.container.singleton('AdminService' as any, async () => {
      const db = await this.app.container.make('Database')
      return new AdminService(
        db,
        await this.app.container.make('AuditService')
      )
    })
    this.app.container.singleton('AnalyticsService' as any, async () => {
      const db = await this.app.container.make('Database')
      return new AnalyticsService(
        db,
        await this.app.container.make('RedisCacheService')
      )
    })
    this.app.container.singleton('AuditService' as any, async () => {
      const db = await this.app.container.make('Database')
      return new AuditService(db)
    })
  }

  async boot() {
    const notificationService = await this.app.container.make('NotificationService')
    notificationService.startProcessing()

    const rabbitMq = await this.app.container.make('RabbitMqService')
    await rabbitMq.connect()
  }
}
