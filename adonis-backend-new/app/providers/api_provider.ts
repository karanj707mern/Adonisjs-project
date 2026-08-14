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
    this.app.container.singleton('RedisCacheService', () => new RedisCacheService())
    this.app.container.singleton('StorageService', () => new StorageService())
    this.app.container.singleton('EmailVerificationService', () => new EmailVerificationService())
    this.app.container.singleton('SessionService', async () => {
      return new SessionService(await this.app.container.make('Prisma'))
    })
    this.app.container.singleton('ProductService', async () => {
      return new ProductService(
        await this.app.container.make('Prisma'),
        await this.app.container.make('RedisCacheService'),
        await this.app.container.make('StorageService')
      )
    })
    this.app.container.singleton('CatalogExtraService', async () => {
      return new CatalogExtraService(
        await this.app.container.make('Prisma'),
        await this.app.container.make('RedisCacheService')
      )
    })
    this.app.container.singleton('CartService', async () => {
      return new CartService(
        await this.app.container.make('Prisma'),
        await this.app.container.make('RedisCacheService')
      )
    })
    this.app.container.singleton('OrderService', async () => {
      return new OrderService(
        await this.app.container.make('Prisma'),
        await this.app.container.make('RedisCacheService')
      )
    })
    this.app.container.singleton('ReviewService', async () => {
      return new ReviewService(
        await this.app.container.make('Prisma'),
        await this.app.container.make('EmailVerificationService')
      )
    })
    this.app.container.singleton('WishlistService', async () => {
      return new WishlistService(
        await this.app.container.make('Prisma'),
        await this.app.container.make('RedisCacheService')
      )
    })
    this.app.container.singleton('AuthService', async () => {
      return new AuthService(
        await this.app.container.make('Prisma'),
        await this.app.container.make('EmailVerificationService'),
        await this.app.container.make('SessionService')
      )
    })
    this.app.container.singleton('BlogService', async () => {
      return new BlogService(
        await this.app.container.make('Prisma'),
        await this.app.container.make('RedisCacheService'),
        await this.app.container.make('StorageService')
      )
    })
    this.app.container.singleton('SettingsService', async () => {
      return new SettingsService(
        await this.app.container.make('Prisma'),
        await this.app.container.make('RedisCacheService')
      )
    })
    this.app.container.singleton('HeroService', async () => {
      return new HeroService(
        await this.app.container.make('Prisma'),
        await this.app.container.make('RedisCacheService'),
        await this.app.container.make('StorageService')
      )
    })
    this.app.container.singleton('NewArrivalService', async () => {
      return new NewArrivalService(
        await this.app.container.make('Prisma'),
        await this.app.container.make('StorageService')
      )
    })
    this.app.container.singleton('CouponService', async () => {
      return new CouponService(await this.app.container.make('Prisma'))
    })
    this.app.container.singleton('GiftCardService', async () => {
      return new GiftCardService(await this.app.container.make('Prisma'))
    })
    this.app.container.singleton('NotificationService', async () => {
      return new NotificationService(
        await this.app.container.make('Prisma'),
        await this.app.container.make('BullMqService')
      )
    })
    this.app.container.singleton('AdminService', async () => {
      return new AdminService(
        await this.app.container.make('Prisma'),
        await this.app.container.make('AuditService')
      )
    })
    this.app.container.singleton('AnalyticsService', async () => {
      return new AnalyticsService(
        await this.app.container.make('Prisma'),
        await this.app.container.make('RedisCacheService')
      )
    })
    this.app.container.singleton('AuditService', async () => {
      return new AuditService(await this.app.container.make('Prisma'))
    })
  }

  async boot() {
    const notificationService = await this.app.container.make('NotificationService')
    notificationService.startProcessing()

    const rabbitMq = await this.app.container.make('RabbitMqService')
    await rabbitMq.connect()
  }
}
