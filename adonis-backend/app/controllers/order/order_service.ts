import { inject, injectable } from '@adonisjs/fold'
import type { PrismaClient } from '@prisma/client'
import { OrderStatus, NotificationChannel, NotificationType } from '@prisma/client'
import Razorpay from 'razorpay'
import crypto from 'node:crypto'
import env from '@adonisjs/core/services/env'
import { BadRequestException, NotFoundException } from '@adonisjs/core/http'
import RedisCacheService from '#services/redis_cache_service'

interface OrderIssueDetail {
  type: string
  status: string
  title: string
  description: string
  adminResponse?: string | null
  resolutionSummary?: string | null
  user?: { id: number; name?: string | null; email?: string | null } | null
  resolvedAt?: string | null
}

interface PricingDetail {
  appliedPromoCode?: string | null
  discountAmount?: number
  taxRate?: number
  shippingZone?: string
  fraudRiskLevel?: string
  expiresAt?: string | null
}

@injectable()
export default class OrderService {
  private readonly razorpay: Razorpay | null
  private readonly razorpayCurrency: string
  private readonly syntheticActivityBaseId = 1_000_000_000
  private readonly returnWindowDays = 7
  private readonly processedPaymentIds = new Set<string>()
  private readonly processedPaymentTtl = 5 * 60 * 1000
  private readonly processedPaymentTimers = new Map<string, ReturnType<typeof setTimeout>>()

  constructor(
    @inject('Prisma') private prisma: PrismaClient,
    @inject('RedisCache') private cache: RedisCacheService,
  ) {
    const razorpayKeyId = env.get('RAZORPAY_KEY_ID', '')
    const razorpayKeySecret = env.get('RAZORPAY_KEY_SECRET', '')
    this.razorpayCurrency = env.get('RAZORPAY_CURRENCY', 'INR')

    this.razorpay =
      razorpayKeyId && razorpayKeySecret
        ? new Razorpay({
            key_id: razorpayKeyId,
            key_secret: razorpayKeySecret,
          })
        : null
  }

  private isProcessedPayment(razorpayPaymentId: string): boolean {
    return this.processedPaymentIds.has(razorpayPaymentId)
  }

  private markProcessedPayment(razorpayPaymentId: string): void {
    if (this.processedPaymentIds.has(razorpayPaymentId)) {
      return
    }
    this.processedPaymentIds.add(razorpayPaymentId)
    const timer = setTimeout(() => {
      this.processedPaymentIds.delete(razorpayPaymentId)
      this.processedPaymentTimers.delete(razorpayPaymentId)
    }, this.processedPaymentTtl)
    this.processedPaymentTimers.set(razorpayPaymentId, timer)
  }

  private signaturesMatch(expected: string, actual: string): boolean {
    if (typeof expected !== 'string' || typeof actual !== 'string') {
      return false
    }
    const expectedBuffer = Buffer.from(expected, 'utf8')
    const actualBuffer = Buffer.from(actual, 'utf8')
    if (expectedBuffer.length !== actualBuffer.length) {
      return false
    }
    return crypto.timingSafeEqual(expectedBuffer, actualBuffer)
  }

  private readonly orderInclude = {
    user: {
      select: {
        id: true,
        name: true,
        email: true,
      },
    },
    items: {
      include: {
        product: {
          select: {
            id: true,
            name: true,
            price: true,
            image: true,
            stock: true,
            slug: true,
          },
        },
      },
    },
    activities: {
      orderBy: {
        createdAt: 'asc',
      },
    },
  } as const

  private async getStoreSettingsRecord() {
    let storeSettings = await this.prisma.storeSettings.findUnique({
      where: { id: 1 },
    })

    if (!storeSettings) {
      storeSettings = await this.prisma.storeSettings.create({
        data: {
          id: 1,
          shippingCharge: 99,
          expressShippingCharge: 149,
          sameDayShippingCharge: 249,
          codCharge: 25,
          handlingCharge: 20,
          taxRate: 0,
          freeShippingThreshold: 1500,
          shippingOptions: this.getDefaultShippingOptions(),
          shippingZones: this.getDefaultShippingZones(),
          codEnabled: true,
          maxCodOrderValue: 5000,
          allowInternationalCod: false,
          autoCancelPendingMinutes: 30,
        },
      })
    }

    return storeSettings
  }

  private async ensureCustomerAccount(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    })
    if (!user) {
      throw new NotFoundException('User not found')
    }
    if (user.role === 'ADMIN') {
      throw new BadRequestException('Admin accounts cannot place or manage personal orders.')
    }
  }

  private getPendingOrderExpiryDate(autoCancelPendingMinutes = 30): Date {
    return new Date(Date.now() + autoCancelPendingMinutes * 60 * 1000)
  }

  private async cleanupExpiredPendingOrders(userId?: number) {
    const expiredOrders = await this.prisma.order.findMany({
      where: {
        status: OrderStatus.PENDING,
        paymentMethod: 'online',
        expiresAt: {
          lte: new Date(),
        },
        ...(userId ? { userId } : {}),
      },
      select: {
        id: true,
        status: true,
        paymentMethod: true,
        expiresAt: true,
        inventoryReserved: true,
        items: {
          select: {
            productId: true,
            quantity: true,
          },
        },
      },
    })

    for (const order of expiredOrders) {
      await this.prisma.$transaction(async (tx) => {
        const freshOrder = await tx.order.findUnique({
          where: { id: order.id },
          select: {
            id: true,
            status: true,
            paymentMethod: true,
            expiresAt: true,
            inventoryReserved: true,
            items: {
              select: {
                productId: true,
                quantity: true,
              },
            },
          },
        })

        if (
          freshOrder?.status !== OrderStatus.PENDING ||
          freshOrder.paymentMethod !== 'online' ||
          !freshOrder.expiresAt ||
          freshOrder.expiresAt.getTime() > Date.now()
        ) {
          return
        }

        if (freshOrder.inventoryReserved) {
          await this.restoreOrderStock(tx, freshOrder.items)
        }

        await tx.order.update({
          where: { id: freshOrder.id },
          data: {
            status: OrderStatus.CANCELLED,
            inventoryReserved: false,
          },
        })

        await tx.orderActivity.create({
          data: {
            orderId: freshOrder.id,
            status: OrderStatus.CANCELLED,
            title: this.getStatusActivityTitle(OrderStatus.CANCELLED),
            detail: 'The unpaid checkout expired automatically and the reserved inventory was released.',
          },
        })
      })
    }
  }

  private scheduleExpiredOrderCleanup(userId?: number) {
    setTimeout(() => {
      this.cleanupExpiredPendingOrders(userId).catch(() => {})
    }, 0)
  }

  private getStatusActivityTitle(status: OrderStatus): string {
    switch (status) {
      case OrderStatus.PAID:
        return 'Payment confirmed'
      case OrderStatus.SHIPPED:
        return 'Order shipped'
      case OrderStatus.OUT_FOR_DELIVERY:
        return 'Out for delivery'
      case OrderStatus.DELIVERED:
        return 'Delivered'
      case OrderStatus.CANCELLED:
        return 'Order cancelled'
      default:
        return 'Order placed'
    }
  }

  private inferOrderStatus(order: {
    status: OrderStatus
    paidAt?: Date | null
    shippedAt?: Date | null
    outForDeliveryAt?: Date | null
    deliveredAt?: Date | null
  }): OrderStatus {
    if (order.status === OrderStatus.CANCELLED) {
      return OrderStatus.CANCELLED
    }
    if (order.deliveredAt) {
      return OrderStatus.DELIVERED
    }
    if (order.outForDeliveryAt) {
      return OrderStatus.OUT_FOR_DELIVERY
    }
    if (order.shippedAt) {
      return OrderStatus.SHIPPED
    }
    if (order.paidAt) {
      return OrderStatus.PAID
    }
    return order.status
  }

  private getSyntheticActivityId(orderId: number, step: number): number {
    return this.syntheticActivityBaseId + orderId * 10 + step
  }

  private buildComputedOrderNumber(orderId: number): string {
    return `MOR-${String(10_000_000 + orderId)}`
  }

  private buildComputedInvoiceNumber(orderId: number): string {
    return `INV-${String(10_000_000 + orderId)}`
  }

  private isIssueActivity(activity: { title: string }): boolean {
    return activity.title === 'Order issue'
  }

  private isPricingActivity(activity: { title: string }): boolean {
    return activity.title === 'Pricing summary'
  }

  private encodeIssueDetail(input: OrderIssueDetail): string {
    return `__ISSUE__${JSON.stringify(input)}`
  }

  private parseIssueDetail(detail?: string | null): OrderIssueDetail | null {
    if (!detail?.startsWith('__ISSUE__')) {
      return null
    }
    try {
      return JSON.parse(detail.slice('__ISSUE__'.length)) as OrderIssueDetail
    } catch {
      return null
    }
  }

  private isActiveIssueStatus(status?: string | null): boolean {
    return status === 'OPEN' || status === 'UNDER_REVIEW' || status === 'APPROVED'
  }

  private encodePricingDetail(input: PricingDetail): string {
    return `__PRICING__${JSON.stringify(input)}`
  }

  private parsePricingDetail(detail?: string | null): PricingDetail | null {
    if (!detail?.startsWith('__PRICING__')) {
      return null
    }
    try {
      return JSON.parse(detail.slice('__PRICING__'.length)) as PricingDetail
    } catch {
      return null
    }
  }

  private buildNormalizedActivities(order: {
    id: number
    status: OrderStatus
    createdAt: Date
    paidAt?: Date | null
    shippedAt?: Date | null
    outForDeliveryAt?: Date | null
    deliveredAt?: Date | null
    activities?: {
      id: number
      status: OrderStatus
      title: string
      detail: string | null
      createdAt: Date
    }[]
  }) {
    const existingActivities = Array.isArray(order.activities)
      ? order.activities.filter(
          (activity) => !this.isIssueActivity(activity) && !this.isPricingActivity(activity)
        )
      : []
    const seenStatuses = new Set(existingActivities.map((activity) => activity.status))
    const normalizedActivities = [...existingActivities]

    const maybeAddActivity = (step: number, status: OrderStatus, createdAt: Date | null | undefined, detail?: string) => {
      if (!createdAt || seenStatuses.has(status)) {
        return
      }
      normalizedActivities.push({
        id: this.getSyntheticActivityId(order.id, step),
        status,
        title: this.getStatusActivityTitle(status),
        detail: detail ?? null,
        createdAt,
      })
      seenStatuses.add(status)
    }

    maybeAddActivity(1, OrderStatus.PENDING, order.createdAt, 'Order received and queued for processing.')
    maybeAddActivity(2, OrderStatus.PAID, order.paidAt, 'Payment was confirmed for this order.')
    maybeAddActivity(3, OrderStatus.SHIPPED, order.shippedAt, 'The order was shipped.')
    maybeAddActivity(4, OrderStatus.OUT_FOR_DELIVERY, order.outForDeliveryAt, 'The order is out for delivery.')
    maybeAddActivity(5, OrderStatus.DELIVERED, order.deliveredAt, 'The order was delivered successfully.')

    if (order.status === OrderStatus.CANCELLED && !seenStatuses.has(OrderStatus.CANCELLED)) {
      const fallbackTimestamp = normalizedActivities[normalizedActivities.length - 1]?.createdAt ?? order.createdAt
      normalizedActivities.push({
        id: this.getSyntheticActivityId(order.id, 6),
        status: OrderStatus.CANCELLED,
        title: this.getStatusActivityTitle(OrderStatus.CANCELLED),
        detail: 'The order was cancelled.',
        createdAt: fallbackTimestamp,
      })
    }

    return normalizedActivities.sort(
      (left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()
    )
  }

  private normalizeOrder<T extends {
    id: number
    status: OrderStatus
    createdAt: Date
    paidAt?: Date | null
    shippedAt?: Date | null
    outForDeliveryAt?: Date | null
    deliveredAt?: Date | null
    razorpayOrderId?: string | null
    shippingType?: string | null
    subtotal?: number | null
    shippingAmount?: number | null
    handlingAmount?: number | null
    taxAmount?: number | null
    codAmount?: number | null
    items?: { price: number; quantity: number; product?: { name: string } }[]
    activities?: { id: number; status: OrderStatus; title: string; detail: string | null; createdAt: Date }[]
  }>(order: T): T & {
    orderNumber: string
    invoiceNumber: string
    orderTitle: string
    discountAmount: number
    appliedPromoCode: string | null
    taxRateApplied: number
    shippingZone: string
    fraudRiskLevel: string
    canCustomerCancel: boolean
    customerCancellationMessage: string
    issues: { id: number; type: string; status: string; title: string; description: string; adminResponse: string | null; resolutionSummary: string | null; createdAt: Date; updatedAt: Date; resolvedAt: string | null; user: { id: number; name?: string | null; email?: string | null } | null }[]
  } {
    const items = Array.isArray(order.items) ? order.items : []
    const activities = Array.isArray(order.activities) ? order.activities : []
    const computedSubtotal = items.length > 0 ? items.reduce((sum, item) => sum + item.price * item.quantity, 0) : Number(order.subtotal ?? 0)
    const pricingMetadata = activities.map((activity) => this.parsePricingDetail(activity.detail)).find(Boolean)
    const issues = activities
      .filter((activity) => this.isIssueActivity(activity))
      .map((activity) => {
        const issueDetail = this.parseIssueDetail(activity.detail)
        if (!issueDetail) {
          return null
        }
        return {
          id: activity.id,
          type: issueDetail.type,
          status: issueDetail.status,
          title: issueDetail.title,
          description: issueDetail.description,
          adminResponse: issueDetail.adminResponse ?? null,
          resolutionSummary: issueDetail.resolutionSummary ?? null,
          createdAt: activity.createdAt,
          updatedAt: activity.createdAt,
          resolvedAt: issueDetail.resolvedAt ?? null,
          user: issueDetail.user ?? null,
        }
      })
      .filter((issue) => issue !== null) as {
        id: number
        type: string
        status: string
        title: string
        description: string
        adminResponse: string | null
        resolutionSummary: string | null
        createdAt: Date
        updatedAt: Date
        resolvedAt: string | null
        user: { id: number; name?: string | null; email?: string | null } | null
      }[]

    return {
      ...order,
      orderNumber: this.buildComputedOrderNumber(order.id),
      invoiceNumber: this.buildComputedInvoiceNumber(order.id),
      orderTitle: this.buildOrderTitle(order.items || []),
      status: this.inferOrderStatus(order),
      shippingType: order.shippingType ?? 'standard',
      subtotal: Number(order.subtotal ?? computedSubtotal),
      shippingAmount: Number(order.shippingAmount ?? 0),
      handlingAmount: Number(order.handlingAmount ?? 0),
      taxAmount: Number(order.taxAmount ?? 0),
      codAmount: Number(order.codAmount ?? 0),
      discountAmount: Number(pricingMetadata?.discountAmount ?? 0),
      appliedPromoCode: pricingMetadata?.appliedPromoCode ?? null,
      taxRateApplied: Number(pricingMetadata?.taxRate ?? 0),
      shippingZone: pricingMetadata?.shippingZone ?? 'DOMESTIC',
      fraudRiskLevel: pricingMetadata?.fraudRiskLevel ?? 'LOW',
      canCustomerCancel: this.canCustomerCancelOrder(order),
      customerCancellationMessage: this.getCustomerCancellationMessage(order),
      issues,
      activities: this.buildNormalizedActivities(order),
    }
  }

  private hasAllocatedStock(order: { inventoryReserved?: boolean | null }): boolean {
    return Boolean(order.inventoryReserved)
  }

  private isAwaitingOnlinePayment(order: {
    paymentMethod?: string | null
    razorpayOrderId: string | null
    paidAt?: Date | null
    expiresAt?: Date | null
  }): boolean {
    return Boolean(
      order.paymentMethod === 'online' &&
      order.razorpayOrderId &&
      !order.paidAt &&
      (!order.expiresAt || order.expiresAt.getTime() > Date.now())
    )
  }

  private canCustomerCancelOrder(order: {
    status: OrderStatus
    paymentMethod?: string | null
    razorpayOrderId?: string | null
    paidAt?: Date | null
  }): boolean {
    return order.status === OrderStatus.PENDING || order.status === OrderStatus.PAID
  }

  private getCustomerCancellationMessage(order: {
    status: OrderStatus
    razorpayOrderId?: string | null
    paidAt?: Date | null
  }): string {
    if (this.canCustomerCancelOrder(order)) {
      return 'This order can be cancelled before it ships.'
    }
    if (order.status === OrderStatus.SHIPPED) {
      return 'This order has already shipped and can no longer be cancelled.'
    }
    if (order.status === OrderStatus.OUT_FOR_DELIVERY) {
      return 'This order is already out for delivery and can no longer be cancelled.'
    }
    if (order.status === OrderStatus.DELIVERED) {
      return 'This order has already been delivered. Use support if you need a return or refund review.'
    }
    if (order.status === OrderStatus.CANCELLED) {
      return 'This order has already been cancelled.'
    }
    return 'This order can no longer be cancelled.'
  }

  private canCreateIssueForOrder(order: { status: OrderStatus; deliveredAt?: Date | null }, issueType: string): boolean {
    const deliveredAt = order.deliveredAt ? new Date(order.deliveredAt).getTime() : null
    const returnWindowDeadline = deliveredAt ? deliveredAt + this.returnWindowDays * 24 * 60 * 60 * 1000 : null

    if (issueType === 'SHIPMENT_EXCEPTION') {
      return order.status === OrderStatus.PAID || order.status === OrderStatus.SHIPPED || order.status === OrderStatus.OUT_FOR_DELIVERY
    }
    if (issueType === 'DISPUTE') {
      return order.status === OrderStatus.PAID || order.status === OrderStatus.DELIVERED
    }
    if (['RETURN', 'REFUND', 'REPLACEMENT'].includes(issueType) && order.status === OrderStatus.DELIVERED && returnWindowDeadline) {
      return Date.now() <= returnWindowDeadline
    }
    return false
  }

  private getIssueEligibilityMessage(issueType: string): string {
    switch (issueType) {
      case 'SHIPMENT_EXCEPTION':
        return 'Shipment issues can only be raised while the order is in transit.'
      case 'DISPUTE':
        return 'Payment disputes are only available for paid or delivered orders.'
      default:
        return `Returns, refunds, and replacements are available within ${this.returnWindowDays} days of delivery.`
    }
  }

  private getAllowedNextStatuses(order: {
    status: OrderStatus
    paymentMethod?: string | null
    razorpayOrderId: string | null
    paidAt?: Date | null
    expiresAt?: Date | null
  }): OrderStatus[] {
    switch (order.status) {
      case OrderStatus.PENDING:
        if (this.isAwaitingOnlinePayment(order)) {
          return [OrderStatus.PAID, OrderStatus.CANCELLED]
        }
        return [OrderStatus.PAID, OrderStatus.SHIPPED, OrderStatus.CANCELLED]
      case OrderStatus.PAID:
        return [OrderStatus.SHIPPED, OrderStatus.CANCELLED]
      case OrderStatus.SHIPPED:
        return [OrderStatus.OUT_FOR_DELIVERY]
      case OrderStatus.OUT_FOR_DELIVERY:
        return [OrderStatus.DELIVERED]
      default:
        return []
    }
  }

  private validateStatusTransition(
    order: {
      status: OrderStatus
      paymentMethod?: string | null
      razorpayOrderId: string | null
      paidAt?: Date | null
      expiresAt?: Date | null
    },
    nextStatus: OrderStatus
  ) {
    if (nextStatus === order.status) {
      return
    }
    const allowedStatuses = this.getAllowedNextStatuses(order)
    if (!allowedStatuses.includes(nextStatus)) {
      throw new BadRequestException(`Order cannot move from ${order.status} to ${nextStatus}.`)
    }
  }

  private async createActivity(tx: any, orderId: number, status: OrderStatus, detail?: string) {
    return tx.orderActivity.create({
      data: {
        orderId,
        status,
        title: this.getStatusActivityTitle(status),
        detail,
      },
    })
  }

  private buildOrderTitle(items: { quantity: number; product?: { name: string } }[]): string {
    if (!items.length) {
      return 'Moringa order'
    }
    const [firstItem, ...restItems] = items
    return restItems.length
      ? `${firstItem.product?.name || 'Moringa item'} + ${restItems.length} more item${restItems.length > 1 ? 's' : ''}`
      : firstItem.product?.name || 'Moringa item'
  }

  private getDefaultShippingOptions() {
    return [
      { key: 'standard', label: 'Standard Delivery', amount: 99, etaDays: 4 },
      { key: 'express', label: 'Express Delivery', amount: 149, etaDays: 2 },
      { key: 'sameDay', label: 'Same Day Delivery', amount: 249, etaDays: 1 },
    ]
  }

  private getDefaultShippingZones() {
    return [
      { key: 'DOMESTIC', label: 'India', countries: ['india'], allowedShippingTypes: ['standard', 'express', 'sameDay', 'prime'], taxRate: null, shippingMultiplier: 1 },
      { key: 'INTERNATIONAL', label: 'Rest of world', countries: [], allowedShippingTypes: ['standard'], taxRate: 0, shippingMultiplier: 2 },
    ]
  }

  private resolveShippingZone(shippingZones: { key?: string; countries?: string[]; allowedShippingTypes?: string[]; taxRate?: number | null; shippingMultiplier?: number | null }[], country?: string) {
    const normalizedCountry = country?.trim().toLowerCase() || ''
    return (
      shippingZones.find((zone) =>
        Array.isArray(zone.countries)
          ? zone.countries.some((supportedCountry) => supportedCountry.trim().toLowerCase() === normalizedCountry)
          : false
      ) ?? shippingZones[shippingZones.length - 1]
    )
  }

  private inferFraudRiskLevel(input: { total: number; paymentMethod: 'online' | 'cod'; country?: string }): string {
    if (input.paymentMethod === 'cod' && (input.total >= 5000 || (input.country && input.country.trim().toLowerCase() !== 'india'))) {
      return 'HIGH'
    }
    if (input.total >= 3000) {
      return 'MEDIUM'
    }
    return 'LOW'
  }

  private async applyPromoCode(userId: number, code: string | undefined, subtotal: number): Promise<{ appliedPromoCode: string | null; discountAmount: number }> {
    const normalizedCode = code?.trim().toUpperCase()
    if (!normalizedCode) {
      return { appliedPromoCode: null, discountAmount: 0 }
    }

    const coupon = await this.prisma.coupon.findFirst({
      where: {
        code: { equals: normalizedCode, mode: 'insensitive' },
        isActive: true,
        validFrom: { lte: new Date() },
        validUntil: { gte: new Date() },
      },
    })

    if (!coupon) {
      throw new BadRequestException('Invalid or expired coupon code.')
    }

    if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
      throw new BadRequestException('This coupon has reached its usage limit.')
    }

    if (userId > 0 && coupon.perUserLimit !== null && coupon.perUserLimit !== undefined) {
      const userUsageCount = await this.prisma.couponUsage.count({
        where: { couponId: coupon.id, userId },
      })
      if (userUsageCount >= coupon.perUserLimit) {
        throw new BadRequestException('You have reached the maximum number of times this coupon can be used.')
      }
    }

    if (coupon.minOrderValue && subtotal < coupon.minOrderValue) {
      throw new BadRequestException(`Minimum order value of ${coupon.minOrderValue} required for this coupon.`)
    }

    let discountAmount: number
    if (coupon.discountType === 'PERCENTAGE') {
      discountAmount = (subtotal * coupon.discountValue) / 100
      if (coupon.maxDiscount) {
        discountAmount = Math.min(discountAmount, coupon.maxDiscount)
      }
    } else {
      discountAmount = coupon.discountValue
    }

    return { appliedPromoCode: coupon.code, discountAmount }
  }

  private async getCartSnapshot(
    userId: number,
    shippingType = 'standard',
    paymentMethod: 'online' | 'cod' = 'online',
    country = 'India',
    promoCode?: string
  ) {
    const cartItems = await this.prisma.cartItem.findMany({
      where: { userId },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            price: true,
            image: true,
            stock: true,
            slug: true,
          },
        },
      },
      orderBy: { id: 'asc' },
    })

    const storeSettings = await this.getStoreSettingsRecord()

    if (cartItems.length === 0) {
      throw new BadRequestException('Your cart is empty')
    }

    const itemWithLowStock = cartItems.find((item) => item.quantity > item.product.stock)
    if (itemWithLowStock) {
      throw new BadRequestException(`${itemWithLowStock.product.name} has only ${itemWithLowStock.product.stock} item(s) left in stock`)
    }

    const subtotal = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0)

    const shippingZones = Array.isArray(storeSettings.shippingZones)
      ? (storeSettings.shippingZones as { key?: string; countries?: string[]; allowedShippingTypes?: string[]; taxRate?: number | null; shippingMultiplier?: number | null }[])
      : this.getDefaultShippingZones()
    const shippingZone = this.resolveShippingZone(shippingZones, country)

    if (Array.isArray(shippingZone?.allowedShippingTypes) && !shippingZone.allowedShippingTypes.includes(shippingType)) {
      throw new BadRequestException(`Shipping type ${shippingType} is not available for ${country}.`)
    }

    const qualifiesForFreeShipping = storeSettings.freeShippingThreshold !== null && subtotal >= storeSettings.freeShippingThreshold

    const baseShippingAmount =
      shippingType === 'express'
        ? storeSettings.expressShippingCharge
        : shippingType === 'sameDay'
          ? storeSettings.sameDayShippingCharge
          : shippingType === 'prime'
            ? 0
            : storeSettings.shippingCharge

    const shippingMultiplier = Number(shippingZone?.shippingMultiplier ?? 1) || 1
    let shippingAmount = baseShippingAmount * shippingMultiplier

    if (qualifiesForFreeShipping && shippingType !== 'prime') {
      shippingAmount = 0
    }

    const normalizedCountry = country.trim().toLowerCase()

    if (paymentMethod === 'cod') {
      if (!storeSettings.codEnabled) {
        throw new BadRequestException('Cash on delivery is currently unavailable.')
      }
      if (normalizedCountry !== 'india' && !storeSettings.allowInternationalCod) {
        throw new BadRequestException('Cash on delivery is not available for this shipping destination.')
      }
    }

    const handlingAmount = storeSettings.handlingCharge
    const taxRate = shippingZone?.taxRate === null || shippingZone?.taxRate === undefined ? storeSettings.taxRate : Number(shippingZone.taxRate) || 0
    const { appliedPromoCode, discountAmount } = await this.applyPromoCode(userId, promoCode, subtotal)

    const discountedSubtotal = Math.max(0, subtotal - discountAmount)
    const taxAmount = discountedSubtotal * (taxRate / 100)
    const total = discountedSubtotal + shippingAmount + taxAmount + handlingAmount
    const fraudRiskLevel = this.inferFraudRiskLevel({ total, paymentMethod, country })

    if (paymentMethod === 'cod') {
      if (storeSettings.maxCodOrderValue !== null && storeSettings.maxCodOrderValue !== undefined && total > storeSettings.maxCodOrderValue) {
        throw new BadRequestException(`Cash on delivery is only available up to ${storeSettings.maxCodOrderValue}.`)
      }
      if (fraudRiskLevel === 'HIGH') {
        throw new BadRequestException('Cash on delivery is unavailable for this checkout. Please pay online to continue.')
      }
    }

    const codAmount = paymentMethod === 'cod' ? storeSettings.codCharge : 0
    const grandTotal = total + codAmount

    return {
      cartItems,
      subtotal,
      discountedSubtotal,
      shippingAmount,
      codAmount,
      handlingAmount,
      taxAmount,
      taxRate,
      discountAmount,
      appliedPromoCode,
      shippingZone: shippingZone?.key || 'DOMESTIC',
      fraudRiskLevel,
      total: grandTotal,
    }
  }

  private ensureRazorpayConfigured(): Razorpay {
    if (!this.razorpay) {
      throw new BadRequestException('Razorpay checkout is not configured yet. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to continue.')
    }
    return this.razorpay
  }

  private async restoreOrderStock(tx: any, items: { productId: number; quantity: number }[]) {
    for (const item of items) {
      await tx.product.update({
        where: { id: item.productId },
        data: {
          stock: { increment: item.quantity },
        },
      })
    }
  }

  private async refundRazorpayPayment(order: { razorpayOrderId: string | null; razorpayPaymentId: string | null; total: number }): Promise<string | null> {
    if (!order.razorpayPaymentId || !this.razorpay) {
      return null
    }
    try {
      const refund = await (this.razorpay.refunds as unknown as { create: (params: Record<string, unknown>) => Promise<{ id: string }> }).create({
        amount: Math.round(order.total * 100),
        currency: this.razorpayCurrency,
        notes: {
          order_id: String(order.razorpayOrderId),
          payment_id: order.razorpayPaymentId,
        },
      })
      return refund.id || null
    } catch (error) {
      return null
    }
  }

  private async allocateOrderStock(tx: any, items: { productId: number; quantity: number }[]) {
    const products = await tx.product.findMany({
      where: { id: { in: items.map((item) => item.productId) } },
      select: { id: true, name: true, stock: true },
    })

    const productsById = new Map(products.map((product) => [product.id, product]))

    for (const item of items) {
      const product = productsById.get(item.productId)
      if (!product) {
        throw new NotFoundException('Product not found')
      }
      if (product.stock < item.quantity) {
        throw new BadRequestException(`${product.name} is no longer available in the requested quantity.`)
      }
      const updated = await tx.product.updateMany({
        where: { id: item.productId, stock: { gte: item.quantity } },
        data: { stock: { decrement: item.quantity } },
      })
      if (updated.count !== 1) {
        throw new BadRequestException(`${product.name} is no longer available in the requested quantity.`)
      }
    }
  }

  private async syncCartAfterSuccessfulPayment(tx: any, userId: number, items: { productId: number; quantity: number }[]) {
    for (const item of items) {
      const existingCartItem = await tx.cartItem.findUnique({
        where: {
          userId_productId: {
            userId,
            productId: item.productId,
          },
        },
      })
      if (!existingCartItem) {
        continue
      }
      if (existingCartItem.quantity <= item.quantity) {
        await tx.cartItem.delete({ where: { id: existingCartItem.id } })
        continue
      }
      await tx.cartItem.update({
        where: { id: existingCartItem.id },
        data: { quantity: { decrement: item.quantity } },
      })
    }
  }

  private async finalizePaidOrder(
    tx: any,
    order: { id: number; userId: number; status: OrderStatus; razorpayOrderId: string | null; razorpayPaymentId: string | null; inventoryReserved?: boolean; appliedPromoCode?: string | null; items: { productId: number; quantity: number }[]; phoneNumber?: string | null; addressLine1?: string | null; addressLine2?: string | null; city?: string | null; state?: string | null; postalCode?: string | null; country?: string | null },
    razorpayPaymentId: string,
    activityDetail: string
  ) {
    await this.allocateOrderStock(tx, order.items)

    const updatedOrder = await tx.order.update({
      where: { id: order.id },
      data: {
        status: OrderStatus.PAID,
        razorpayPaymentId,
        paidAt: new Date(),
        inventoryReserved: true,
        expiresAt: null,
      },
      include: this.orderInclude,
    })

    await this.syncCartAfterSuccessfulPayment(tx, order.userId, order.items)

    await tx.user.update({
      where: { id: order.userId },
      data: {
        phoneNumber: order.phoneNumber,
        addressLine1: order.addressLine1,
        addressLine2: order.addressLine2,
        city: order.city,
        state: order.state,
        postalCode: order.postalCode,
        country: order.country,
      },
    })

    await this.createActivity(tx, order.id, OrderStatus.PAID, activityDetail)

    return updatedOrder
  }

  private getUserAddressData(createOrderDto: { phoneNumber?: string; addressLine1?: string; addressLine2?: string; city?: string; state?: string; postalCode?: string; country?: string }) {
    return {
      phoneNumber: (createOrderDto.phoneNumber ?? '').trim(),
      addressLine1: (createOrderDto.addressLine1 ?? '').trim(),
      addressLine2: createOrderDto.addressLine2?.trim() || null,
      city: (createOrderDto.city ?? '').trim(),
      state: (createOrderDto.state ?? '').trim(),
      postalCode: (createOrderDto.postalCode ?? '').trim(),
      country: (createOrderDto.country ?? '').trim(),
    }
  }

  private async queueNotification(order: {
    id: number
    userId: number
    orderNumber?: string | null
    invoiceNumber?: string | null
    orderTitle?: string | null
    total: number
    subtotal: number
    shippingAmount: number
    handlingAmount: number
    taxAmount: number
    shippingType?: string | null
    courierName?: string | null
    trackingNumber?: string | null
    estimatedDeliveryAt?: Date | null
    adminNotes?: string | null
    recipientName?: string | null
    phoneNumber?: string | null
    addressLine1?: string | null
    addressLine2?: string | null
    city?: string | null
    state?: string | null
    postalCode?: string | null
    country?: string | null
    items: { quantity: number; price: number; product: { name: string; image?: string | null } }[]
    user?: { id?: number | null; name?: string | null; email?: string | null } | null
  }, type: NotificationType, subject: string, body: string) {
    const payload: Record<string, unknown> = { orderId: order.id, orderNumber: order.orderNumber ?? null, status: type }

    const notifications: {
      userId: number | null
      orderId: number
      type: NotificationType
      channel: NotificationChannel
      recipient: string
      subject: string
      body: string
      payload: Record<string, unknown>
    }[] = []

    if (order.user?.email) {
      notifications.push({
        userId: order.user.id ?? null,
        orderId: order.id,
        type,
        channel: NotificationChannel.EMAIL,
        recipient: order.user.email,
        subject,
        body,
        payload,
      })
    }

    if (order.phoneNumber) {
      notifications.push(
        {
          userId: order.user?.id ?? null,
          orderId: order.id,
          type,
          channel: NotificationChannel.SMS,
          recipient: order.phoneNumber,
          body: subject,
          payload,
        },
        {
          userId: order.user?.id ?? null,
          orderId: order.id,
          type,
          channel: NotificationChannel.WHATSAPP,
          recipient: order.phoneNumber,
          body: subject,
          payload,
        }
      )
    }

    if (notifications.length > 0) {
      await this.prisma.notification.createMany({ data: notifications })
    }
  }

  private async checkLowStock(productIds: number[]) {
    if (!productIds.length) {
      return
    }
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, stock: true },
    })
    const lowStockProducts = products.filter((product) => product.stock <= 5)
    for (const product of lowStockProducts) {
      await this.queueNotification(
        { id: 0, userId: 0, total: 0, subtotal: 0, shippingAmount: 0, handlingAmount: 0, taxAmount: 0, items: [], user: { name: 'Admin' } },
        NotificationType.LOW_STOCK,
        `Low stock alert: ${product.name}`,
        `${product.name} is running low on stock. Current stock: ${product.stock}`
      )
    }
  }

  async previewCheckout(userId: number, createOrderDto: { shippingType?: string; paymentMethod?: string; country?: string; promoCode?: string }) {
    await this.ensureCustomerAccount(userId)
    this.scheduleExpiredOrderCleanup(userId)

    return this.getCartSnapshot(
      userId,
      createOrderDto.shippingType || 'standard',
      createOrderDto.paymentMethod ?? 'online',
      createOrderDto.country,
      createOrderDto.promoCode
    )
  }

  async create(userId: number, createOrderDto: { recipientName: string; phoneNumber: string; addressLine1: string; addressLine2?: string; city: string; state: string; postalCode: string; country: string; shippingType?: string; paymentMethod?: string; promoCode?: string }) {
    await this.ensureCustomerAccount(userId)
    this.scheduleExpiredOrderCleanup(userId)
    const paymentMethod = createOrderDto.paymentMethod ?? 'cod'

    if (paymentMethod !== 'cod') {
      throw new BadRequestException('Use the checkout session endpoint for online payments.')
    }

    const {
      cartItems,
      subtotal,
      discountAmount,
      shippingAmount,
      codAmount,
      handlingAmount,
      taxAmount,
      taxRate,
      appliedPromoCode,
      shippingZone,
      fraudRiskLevel,
      total,
    } = await this.getCartSnapshot(
      userId,
      createOrderDto.shippingType || 'standard',
      paymentMethod,
      createOrderDto.country,
      createOrderDto.promoCode
    )

    const order = await this.prisma.$transaction(async (tx) => {
      const createdOrder = await tx.order.create({
        data: {
          userId,
          recipientName: createOrderDto.recipientName.trim(),
          phoneNumber: createOrderDto.phoneNumber.trim(),
          addressLine1: createOrderDto.addressLine1.trim(),
          addressLine2: createOrderDto.addressLine2?.trim() || null,
          city: createOrderDto.city.trim(),
          state: createOrderDto.state.trim(),
          postalCode: createOrderDto.postalCode.trim(),
          country: createOrderDto.country.trim(),
          shippingType: createOrderDto.shippingType ?? 'standard',
          paymentMethod,
          subtotal,
          shippingAmount,
          codAmount,
          handlingAmount,
          taxAmount,
          total,
          inventoryReserved: true,
          couponCode: appliedPromoCode,
          items: {
            create: cartItems.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.product.price,
            })),
          },
        },
        include: this.orderInclude,
      })

      await this.createActivity(tx, createdOrder.id, OrderStatus.PENDING, 'Cash on delivery order received. We will confirm dispatch and collect payment on delivery.')

      await tx.orderActivity.create({
        data: {
          orderId: createdOrder.id,
          status: OrderStatus.PENDING,
          title: 'Pricing summary',
          detail: this.encodePricingDetail({
            appliedPromoCode,
            discountAmount,
            taxRate,
            shippingZone,
            fraudRiskLevel,
            expiresAt: null,
          }),
        },
      })

      await this.allocateOrderStock(tx, cartItems)

      if (appliedPromoCode) {
        const coupon = await tx.coupon.findFirst({ where: { code: appliedPromoCode } })
        if (coupon) {
          await tx.couponUsage.create({
            data: { couponId: coupon.id, userId, orderId: createdOrder.id },
          })
          await tx.coupon.update({
            where: { id: coupon.id },
            data: { usedCount: { increment: 1 } },
          })
        }
      }

      await tx.cartItem.deleteMany({ where: { userId } })

      return createdOrder
    })

    await this.queueNotification(order, NotificationType.ORDER_PLACED, `Order ${this.buildComputedOrderNumber(order.id)} confirmed`, '')

    return this.normalizeOrder(order)
  }

  async createCheckoutSession(userId: number, createOrderDto: { recipientName: string; phoneNumber: string; addressLine1: string; addressLine2?: string; city: string; state: string; postalCode: string; country: string; shippingType?: string; paymentMethod?: string; promoCode?: string }) {
    await this.ensureCustomerAccount(userId)
    this.scheduleExpiredOrderCleanup(userId)
    if (createOrderDto.paymentMethod === 'cod') {
      throw new BadRequestException('Use the order endpoint for cash on delivery orders.')
    }

    const razorpay = this.ensureRazorpayConfigured()
    const storeSettings = await this.getStoreSettingsRecord()
    const expiresAt = this.getPendingOrderExpiryDate(storeSettings.autoCancelPendingMinutes)

    const {
      cartItems,
      subtotal,
      discountAmount,
      shippingAmount,
      codAmount,
      handlingAmount,
      taxAmount,
      taxRate,
      appliedPromoCode,
      shippingZone,
      fraudRiskLevel,
      total,
    } = await this.getCartSnapshot(
      userId,
      createOrderDto.shippingType || 'standard',
      'online',
      createOrderDto.country,
      createOrderDto.promoCode
    )

    const user = await this.prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      throw new NotFoundException('User not found')
    }

    const order = await this.prisma.$transaction(async (tx) => {
      const createdOrder = await tx.order.create({
        data: {
          userId,
          recipientName: createOrderDto.recipientName.trim(),
          phoneNumber: createOrderDto.phoneNumber.trim(),
          addressLine1: createOrderDto.addressLine1.trim(),
          addressLine2: createOrderDto.addressLine2?.trim() || null,
          city: createOrderDto.city.trim(),
          state: createOrderDto.state.trim(),
          postalCode: createOrderDto.postalCode.trim(),
          country: createOrderDto.country.trim(),
          shippingType: createOrderDto.shippingType ?? 'standard',
          paymentMethod: 'online',
          subtotal,
          shippingAmount,
          codAmount,
          handlingAmount,
          taxAmount,
          total,
          expiresAt,
          inventoryReserved: true,
          items: {
            create: cartItems.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.product.price,
            })),
          },
        },
        include: this.orderInclude,
      })

      await this.createActivity(tx, createdOrder.id, OrderStatus.PENDING, 'Checkout started. Complete payment to confirm this order.')

      await tx.orderActivity.create({
        data: {
          orderId: createdOrder.id,
          status: OrderStatus.PENDING,
          title: 'Pricing summary',
          detail: this.encodePricingDetail({
            appliedPromoCode,
            discountAmount,
            taxRate,
            shippingZone,
            fraudRiskLevel,
            expiresAt: expiresAt.toISOString(),
          }),
        },
      })

      await this.allocateOrderStock(tx, cartItems)

      return createdOrder
    })

    let razorpayOrder: { id: string; amount: string | number; currency: string }
    try {
      razorpayOrder = await razorpay.orders.create({
        amount: Math.round(total * 100),
        currency: this.razorpayCurrency,
        receipt: this.buildComputedOrderNumber(order.id),
        notes: {
          orderId: String(order.id),
          orderNumber: this.buildComputedOrderNumber(order.id),
          userId: String(userId),
        },
      })
    } catch (error) {
      await this.prisma.$transaction(async (tx) => {
        await this.restoreOrderStock(tx, order.items)
        await tx.order.update({
          where: { id: order.id },
          data: {
            inventoryReserved: false,
            expiresAt: null,
            status: OrderStatus.CANCELLED,
          },
        })
        await this.createActivity(tx, order.id, OrderStatus.CANCELLED, 'The payment session could not be created. Please try checkout again.')
      })
      throw new BadRequestException('We could not start the payment session. Please try again.')
    }

    const razorpayOrderAmount = Number(razorpayOrder.amount)

    await this.prisma.order.update({
      where: { id: order.id },
      data: { razorpayOrderId: razorpayOrder.id },
    })

    return {
      orderId: order.id,
      orderNumber: this.buildComputedOrderNumber(order.id),
      orderTitle: this.buildOrderTitle(order.items || []),
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrderAmount,
      currency: razorpayOrder.currency,
      key: env.get('RAZORPAY_KEY_ID'),
      expiresAt,
    }
  }

  async findAll(userId: number) {
    await this.ensureCustomerAccount(userId)
    this.scheduleExpiredOrderCleanup(userId)
    const orders = await this.prisma.order.findMany({
      where: { userId },
      include: this.orderInclude,
      orderBy: { createdAt: 'desc' },
    })
    return orders.map((order) => this.normalizeOrder(order))
  }

  private buildOrderWhereClause(userId: number | undefined, query: { status?: string; paymentMethod?: string; startDate?: string; endDate?: string; search?: string }) {
    const where: Record<string, unknown> = {}
    if (userId !== undefined) {
      where.userId = userId
    }
    if (query.status) {
      where.status = query.status
    }
    if (query.paymentMethod) {
      where.paymentMethod = query.paymentMethod
    }
    if (query.startDate || query.endDate) {
      ;(where as any).createdAt = {}
      if (query.startDate) {
        ;(where.createdAt as any).gte = new Date(query.startDate)
      }
      if (query.endDate) {
        ;(where.createdAt as any).lte = new Date(query.endDate)
      }
    }
    if (query.search) {
      const term = query.search.trim()
      where.OR = [
        { recipientName: { contains: term, mode: 'insensitive' as const } },
        { phoneNumber: { contains: term, mode: 'insensitive' as const } },
      ]
    }
    return where
  }

  private getOrderOrderBy(query: { sortBy?: string; sortOrder?: string }) {
    const sortBy = query.sortBy || 'createdAt'
    const sortOrder = query.sortOrder || 'desc'
    switch (sortBy) {
      case 'total':
        return { total: sortOrder }
      case 'status':
        return { status: sortOrder }
      case 'createdAt':
      default:
        return { createdAt: sortOrder }
    }
  }

  async findAllWithQuery(userId: number, query: { page?: number; limit?: number; status?: string; paymentMethod?: string; startDate?: string; endDate?: string; search?: string; sortBy?: string; sortOrder?: string }) {
    await this.ensureCustomerAccount(userId)
    this.scheduleExpiredOrderCleanup(userId)

    const page = query.page && query.page > 0 ? query.page : 1
    const limit = query.limit && query.limit > 0 ? Math.min(query.limit, 100) : 20
    const skip = (page - 1) * limit

    const where = this.buildOrderWhereClause(userId, query)
    const orderBy = this.getOrderOrderBy(query)

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({ where, include: this.orderInclude, orderBy, skip, take: limit }),
      this.prisma.order.count({ where }),
    ])

    return {
      data: orders.map((order) => this.normalizeOrder(order)),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    }
  }

  async findAdminOrders(query: { page?: number; limit?: number; status?: string; paymentMethod?: string; startDate?: string; endDate?: string; search?: string; sortBy?: string; sortOrder?: string }) {
    this.scheduleExpiredOrderCleanup()

    const page = query.page && query.page > 0 ? query.page : 1
    const limit = query.limit && query.limit > 0 ? Math.min(query.limit, 100) : 20
    const skip = (page - 1) * limit

    const where = this.buildOrderWhereClause(undefined, query)
    const orderBy = this.getOrderOrderBy(query)

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({ where, include: this.orderInclude, orderBy, skip, take: limit }),
      this.prisma.order.count({ where }),
    ])

    return {
      data: orders.map((order) => this.normalizeOrder(order)),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    }
  }

  async findOpenOrders() {
    this.scheduleExpiredOrderCleanup()
    const orders = await this.prisma.order.findMany({
      where: {
        user: { role: 'USER' },
        status: { in: [OrderStatus.PENDING, OrderStatus.PAID, OrderStatus.SHIPPED, OrderStatus.OUT_FOR_DELIVERY] },
      },
      include: this.orderInclude,
      orderBy: { createdAt: 'desc' },
    })
    return orders
      .map((order) => this.normalizeOrder(order))
      .filter((order) => order.status !== OrderStatus.CANCELLED && order.status !== OrderStatus.DELIVERED)
  }

  async findCancelledOrders() {
    this.scheduleExpiredOrderCleanup()
    const orders = await this.prisma.order.findMany({
      where: {
        user: { role: 'USER' },
        status: { in: [OrderStatus.CANCELLED] },
      },
      include: this.orderInclude,
      orderBy: { createdAt: 'desc' },
    })
    return orders.map((order) => this.normalizeOrder(order))
  }

  async findAdminIssues() {
    this.scheduleExpiredOrderCleanup()
    const activities = await this.prisma.orderActivity.findMany({
      where: { title: 'Order issue' },
      include: {
        order: {
          include: {
            user: { select: { id: true, name: true, email: true } },
            items: { include: { product: { select: { name: true } } } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
    return activities
      .map((activity) => {
        const issueDetail = this.parseIssueDetail(activity.detail)
        if (!issueDetail) {
          return null
        }
        const normalizedOrder = this.normalizeOrder(activity.order)
        return {
          id: activity.id,
          type: issueDetail.type,
          status: issueDetail.status,
          title: issueDetail.title,
          description: issueDetail.description,
          adminResponse: issueDetail.adminResponse ?? null,
          resolutionSummary: issueDetail.resolutionSummary ?? null,
          createdAt: activity.createdAt,
          updatedAt: activity.createdAt,
          user: issueDetail.user ?? normalizedOrder.user,
          order: {
            id: normalizedOrder.id,
            orderNumber: normalizedOrder.orderNumber,
            orderTitle: normalizedOrder.orderTitle,
            invoiceNumber: normalizedOrder.invoiceNumber,
            status: normalizedOrder.status,
            createdAt: normalizedOrder.createdAt,
          },
        }
      })
      .filter(Boolean)
  }

  async findOne(userId: number, id: number) {
    await this.ensureCustomerAccount(userId)
    this.scheduleExpiredOrderCleanup(userId)
    const order = await this.prisma.order.findFirst({
      where: { id, userId },
      include: this.orderInclude,
    })
    if (!order) {
      throw new NotFoundException('Order not found')
    }
    return this.normalizeOrder(order)
  }

  async getInvoice(userId: number, id: number) {
    await this.ensureCustomerAccount(userId)
    this.scheduleExpiredOrderCleanup(userId)
    const order = await this.prisma.order.findFirst({
      where: { id, userId },
      include: this.orderInclude,
    })
    if (!order) {
      throw new NotFoundException('Order not found')
    }

    const billableStatuses: OrderStatus[] = [OrderStatus.PAID, OrderStatus.SHIPPED, OrderStatus.OUT_FOR_DELIVERY, OrderStatus.DELIVERED]
    if (!billableStatuses.includes(this.inferOrderStatus(order))) {
      throw new BadRequestException('Invoice is available only after payment is confirmed.')
    }

    const normalizedOrder = this.normalizeOrder(order)

    return {
      invoiceNumber: normalizedOrder.invoiceNumber,
      orderNumber: normalizedOrder.orderNumber,
      orderTitle: normalizedOrder.orderTitle,
      issuedAt: normalizedOrder.createdAt,
      seller: { name: 'Moringa Store', supportEmail: 'support@moringastore.com' },
      order: normalizedOrder,
    }
  }

  async createIssue(userId: number, orderId: number, createOrderIssueDto: { type: string; title: string; description: string }) {
    await this.ensureCustomerAccount(userId)
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
      select: { id: true, status: true, deliveredAt: true, activities: { where: { title: 'Order issue' }, select: { detail: true } } },
    })

    if (!order) {
      throw new NotFoundException('Order not found')
    }

    if (!this.canCreateIssueForOrder(order, createOrderIssueDto.type)) {
      throw new BadRequestException(this.getIssueEligibilityMessage(createOrderIssueDto.type))
    }

    const activeIssue = order.activities
      .map((activity) => this.parseIssueDetail(activity.detail))
      .find((issueDetail) => this.isActiveIssueStatus(issueDetail?.status))

    if (activeIssue) {
      throw new BadRequestException('This order already has an active support request under review.')
    }

    const user = (await this.prisma.user.findUnique({ where: { id: userId }, select: { id: true, name: true, email: true } })) || { id: userId }

    const activity = await this.prisma.orderActivity.create({
      data: {
        orderId,
        status: order.status,
        title: 'Order issue',
        detail: this.encodeIssueDetail({
          type: createOrderIssueDto.type,
          status: 'OPEN',
          title: createOrderIssueDto.title.trim(),
          description: createOrderIssueDto.description.trim(),
          user,
        }),
      },
      include: { order: { include: this.orderInclude } },
    })

    const normalizedOrder = this.normalizeOrder(activity.order)
    const createdIssue = {
      id: activity.id,
      type: createOrderIssueDto.type,
      status: 'OPEN',
      title: createOrderIssueDto.title.trim(),
      description: createOrderIssueDto.description.trim(),
      adminResponse: null,
      resolutionSummary: null,
      createdAt: activity.createdAt,
      updatedAt: activity.createdAt,
    }

    await this.queueNotification(normalizedOrder, NotificationType.ORDER_STATUS_UPDATED, `Support request received for ${normalizedOrder.orderNumber || String(order.id)}`, '')

    return createdIssue
  }

  async updateIssue(issueId: number, updateOrderIssueDto: { status?: string; adminResponse?: string; resolutionSummary?: string }) {
    const issue = await this.prisma.orderActivity.findUnique({ where: { id: issueId } })
    if (issue?.title !== 'Order issue') {
      throw new NotFoundException('Issue not found')
    }

    const issueDetail = this.parseIssueDetail(issue.detail)
    if (!issueDetail) {
      throw new NotFoundException('Issue details could not be read.')
    }

    const nextStatus = updateOrderIssueDto.status ?? issueDetail.status
    const updatedActivity = await this.prisma.orderActivity.update({
      where: { id: issueId },
      data: {
        detail: this.encodeIssueDetail({
          ...issueDetail,
          status: nextStatus,
          adminResponse: updateOrderIssueDto.adminResponse?.trim() ?? issueDetail.adminResponse ?? null,
          resolutionSummary: updateOrderIssueDto.resolutionSummary?.trim() ?? issueDetail.resolutionSummary ?? null,
          resolvedAt:
            updateOrderIssueDto.status && ['RESOLVED', 'REJECTED', 'CANCELLED'].includes(updateOrderIssueDto.status)
              ? new Date().toISOString()
              : (issueDetail.resolvedAt ?? null),
        }),
      },
      include: { order: { include: this.orderInclude } },
    })

    const updatedIssueDetail = this.parseIssueDetail(updatedActivity.detail)
    const normalizedOrder = this.normalizeOrder(updatedActivity.order)
    const updatedIssue = {
      id: updatedActivity.id,
      type: updatedIssueDetail?.type,
      status: updatedIssueDetail?.status,
      title: updatedIssueDetail?.title,
      description: updatedIssueDetail?.description,
      adminResponse: updatedIssueDetail?.adminResponse ?? null,
      resolutionSummary: updatedIssueDetail?.resolutionSummary ?? null,
      createdAt: updatedActivity.createdAt,
      updatedAt: updatedActivity.createdAt,
      user: updatedIssueDetail?.user ?? normalizedOrder.user,
      order: {
        id: normalizedOrder.id,
        orderNumber: normalizedOrder.orderNumber,
        orderTitle: normalizedOrder.orderTitle,
        status: normalizedOrder.status,
      },
    }

    await this.queueNotification(normalizedOrder, NotificationType.ORDER_STATUS_UPDATED, `Support request ${updatedIssue.status || 'updated'} for ${normalizedOrder.orderTitle || 'your order'}`, '')

    return updatedIssue
  }

  async update(id: number, updateOrderDto: { status?: OrderStatus; courierName?: string; trackingNumber?: string; estimatedDeliveryAt?: string; note?: string; adminNotes?: string }) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { items: true },
    })

    if (!order) {
      throw new NotFoundException('Order not found')
    }

    if (order.status === OrderStatus.CANCELLED || order.status === OrderStatus.DELIVERED) {
      throw new BadRequestException('This order can no longer be updated')
    }

    if (updateOrderDto.status) {
      this.validateStatusTransition(order, updateOrderDto.status)
    }

    if (updateOrderDto.status === OrderStatus.CANCELLED) {
      const cancelledOrder = await this.prisma.$transaction(async (tx) => {
        if (this.hasAllocatedStock(order)) {
          await this.restoreOrderStock(tx, order.items)
        }

        const updatedOrder = await tx.order.update({
          where: { id },
          data: {
            status: OrderStatus.CANCELLED,
            inventoryReserved: false,
            expiresAt: null,
            courierName: updateOrderDto.courierName?.trim() || order.courierName,
            trackingNumber: updateOrderDto.trackingNumber?.trim() || order.trackingNumber,
            estimatedDeliveryAt: updateOrderDto.estimatedDeliveryAt ? new Date(updateOrderDto.estimatedDeliveryAt) : order.estimatedDeliveryAt,
            adminNotes: updateOrderDto.adminNotes !== undefined ? updateOrderDto.adminNotes.trim() || null : order.adminNotes,
          },
          include: this.orderInclude,
        })

        await this.createActivity(tx, id, OrderStatus.CANCELLED, updateOrderDto.note?.trim() || 'The order was cancelled.')

        return updatedOrder
      })

      if (order.status === OrderStatus.PAID && order.razorpayPaymentId) {
        const refundId = await this.refundRazorpayPayment({
          razorpayOrderId: order.razorpayOrderId,
          razorpayPaymentId: order.razorpayPaymentId,
          total: order.total,
        })
        if (refundId) {
          await this.prisma.order.update({
            where: { id },
            data: { refundId, refundedAt: new Date() },
          })
        }
      }

      const normalizedOrder = this.normalizeOrder(cancelledOrder)
      await this.queueNotification(normalizedOrder, NotificationType.ORDER_CANCELLED, `${normalizedOrder.orderTitle || 'Your order'} cancelled`, '')
      return normalizedOrder
    }

    const updatedOrder = await this.prisma.$transaction(async (tx) => {
      if (updateOrderDto.status === OrderStatus.PAID && !this.hasAllocatedStock(order)) {
        await this.allocateOrderStock(tx, order.items)
      }

      const updatedOrder = await tx.order.update({
        where: { id },
        data: {
          status: updateOrderDto.status ?? order.status,
          inventoryReserved: updateOrderDto.status === OrderStatus.CANCELLED ? false : order.inventoryReserved,
          courierName: updateOrderDto.courierName?.trim() || order.courierName,
          trackingNumber: updateOrderDto.trackingNumber?.trim() || order.trackingNumber,
          estimatedDeliveryAt: updateOrderDto.estimatedDeliveryAt ? new Date(updateOrderDto.estimatedDeliveryAt) : order.estimatedDeliveryAt,
          adminNotes: updateOrderDto.adminNotes !== undefined ? updateOrderDto.adminNotes.trim() || null : order.adminNotes,
          paidAt: updateOrderDto.status === OrderStatus.PAID && !order.paidAt ? new Date() : order.paidAt,
          expiresAt: updateOrderDto.status === OrderStatus.PAID || updateOrderDto.status === OrderStatus.CANCELLED ? null : order.expiresAt,
          shippedAt: updateOrderDto.status === OrderStatus.SHIPPED && !order.shippedAt ? new Date() : order.shippedAt,
          outForDeliveryAt: updateOrderDto.status === OrderStatus.OUT_FOR_DELIVERY && !order.outForDeliveryAt ? new Date() : order.outForDeliveryAt,
          deliveredAt: updateOrderDto.status === OrderStatus.DELIVERED && !order.deliveredAt ? new Date() : order.deliveredAt,
        },
        include: this.orderInclude,
      })

      if (updateOrderDto.status) {
        if (updateOrderDto.status === OrderStatus.PAID && !order.paidAt && !this.hasAllocatedStock(order)) {
          await this.syncCartAfterSuccessfulPayment(tx, order.userId, order.items)
        }
        await this.createActivity(
          tx,
          id,
          updateOrderDto.status,
          updateOrderDto.note?.trim() ||
            (updateOrderDto.status === OrderStatus.SHIPPED
              ? 'Your package left the store and is on the way.'
              : updateOrderDto.status === OrderStatus.OUT_FOR_DELIVERY
                ? 'The courier is making the final delivery attempt today.'
                : updateOrderDto.status === OrderStatus.DELIVERED
                  ? 'The order reached its destination.'
                  : updateOrderDto.status === OrderStatus.PAID
                    ? 'Payment was captured successfully.'
                    : 'The order status changed.')
        )
      } else if (updateOrderDto.courierName || updateOrderDto.trackingNumber || updateOrderDto.estimatedDeliveryAt || updateOrderDto.note) {
        await tx.orderActivity.create({
          data: {
            orderId: id,
            status: updatedOrder.status,
            title: 'Tracking details updated',
            detail: updateOrderDto.note?.trim() || 'Courier, tracking number, or estimated delivery details were updated.',
          },
        })
      }

      return updatedOrder
    })

    if (updateOrderDto.status) {
      const normalizedOrder = this.normalizeOrder(updatedOrder)
      await this.queueNotification(normalizedOrder, NotificationType.ORDER_STATUS_UPDATED, `${normalizedOrder.orderTitle || 'Your order'} is now ${updateOrderDto.status.replace(/_/g, ' ').toLowerCase()}`, updateOrderDto.note?.trim() || '')
    }

    return this.normalizeOrder(updatedOrder)
  }

  async remove(userId: number, id: number) {
    await this.ensureCustomerAccount(userId)

    const order = await this.prisma.order.findFirst({
      where: { id, userId },
      select: {
        id: true,
        status: true,
        razorpayPaymentId: true,
        razorpayOrderId: true,
        total: true,
        inventoryReserved: true,
        items: { select: { productId: true, quantity: true } },
      },
    })

    if (!order) {
      throw new NotFoundException('Order not found')
    }

    if (!this.canCustomerCancelOrder(order)) {
      throw new BadRequestException(this.getCustomerCancellationMessage(order))
    }

    const cancelledOrder = await this.prisma.$transaction(async (tx) => {
      if (this.hasAllocatedStock(order)) {
        await this.restoreOrderStock(tx, order.items)
      }

      const updatedOrder = await tx.order.update({
        where: { id: order.id },
        data: {
          status: OrderStatus.CANCELLED,
          inventoryReserved: false,
          expiresAt: null,
        },
        include: this.orderInclude,
      })

      await this.createActivity(
        tx,
        order.id,
        OrderStatus.CANCELLED,
        order.status === OrderStatus.PAID
          ? 'The customer cancelled this order before shipment. Refund handling can now begin.'
          : 'The customer cancelled this order before shipment.'
      )

      return updatedOrder
    })

    if (order.status === OrderStatus.PAID && order.razorpayPaymentId) {
      const refundId = await this.refundRazorpayPayment({
        razorpayOrderId: order.razorpayOrderId,
        razorpayPaymentId: order.razorpayPaymentId,
        total: order.total,
      })
      if (refundId) {
        await this.prisma.order.update({
          where: { id },
          data: { refundId, refundedAt: new Date() },
        })
      }
    }

    const normalizedOrder = this.normalizeOrder(cancelledOrder)
    await this.queueNotification(normalizedOrder, NotificationType.ORDER_CANCELLED, `${normalizedOrder.orderTitle || 'Your order'} cancelled`, '')

    return normalizedOrder
  }

  async verifyPayment(userId: number, orderId: number, razorpayOrderId: string, razorpayPaymentId: string, razorpaySignature: string) {
    this.ensureRazorpayConfigured()

    const sign = razorpayOrderId + '|' + razorpayPaymentId
    const keySecret = env.get('RAZORPAY_KEY_SECRET', '')
    const expectedSign = crypto.createHmac('sha256', keySecret).update(sign.toString()).digest('hex')

    if (!this.signaturesMatch(expectedSign, razorpaySignature)) {
      throw new BadRequestException('Payment verification failed')
    }

    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
      include: { items: true },
    })

    if (!order) {
      throw new NotFoundException('Order not found')
    }

    if (!order.razorpayOrderId || order.razorpayOrderId !== razorpayOrderId) {
      throw new BadRequestException('Payment does not match this order.')
    }

    if (order.status === OrderStatus.PAID) {
      if (order.razorpayPaymentId === razorpayPaymentId) {
        return { success: true, orderId }
      }
      throw new BadRequestException('This order has already been paid.')
    }

    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException('This order can no longer accept payment.')
    }

    const paidOrder = await this.prisma.$transaction(async (tx) => {
      return this.finalizePaidOrder(tx, order, razorpayPaymentId, 'Razorpay confirmed the payment for this order.')
    })

    const normalizedOrder = this.normalizeOrder(paidOrder)
    await this.queueNotification(normalizedOrder, NotificationType.PAYMENT_CONFIRMED, `Payment received for ${normalizedOrder.orderTitle || 'your order'}`, '')

    return { success: true, orderId }
  }

  async handleRazorpayWebhook(rawBody: Buffer | string | undefined, signature: string | string[] | undefined) {
    const webhookSecret = env.get('RAZORPAY_WEBHOOK_SECRET', '').trim()
    if (!webhookSecret) {
      throw new BadRequestException('Razorpay webhook is not configured.')
    }
    if (!rawBody || !signature || Array.isArray(signature)) {
      throw new BadRequestException('Invalid webhook request.')
    }

    const expectedSignature = crypto.createHmac('sha256', webhookSecret).update(rawBody).digest('hex')
    if (!this.signaturesMatch(expectedSignature, signature)) {
      throw new BadRequestException('Invalid Razorpay webhook signature.')
    }

    let event: { event?: string; payload?: { payment?: { entity?: { id?: string; order_id?: string } } } }
    try {
      event = JSON.parse(rawBody.toString('utf8')) as typeof event
    } catch {
      throw new BadRequestException('Webhook payload must be valid JSON.')
    }

    if (event.event !== 'payment.captured') {
      return { received: true }
    }

    const razorpayPaymentId = event.payload?.payment?.entity?.id
    const razorpayOrderId = event.payload?.payment?.entity?.order_id
    if (!razorpayPaymentId || !razorpayOrderId) {
      throw new BadRequestException('Webhook payload is missing payment details.')
    }

    if (this.isProcessedPayment(razorpayPaymentId)) {
      return { received: true }
    }

    const order = await this.prisma.order.findFirst({
      where: { razorpayOrderId },
      include: { items: true },
    })
    if (!order) {
      return { received: true }
    }

    if (order.status === OrderStatus.PAID) {
      this.markProcessedPayment(razorpayPaymentId)
      return { received: true, orderId: order.id }
    }

    if (order.status !== OrderStatus.PENDING) {
      return { received: true, orderId: order.id }
    }

    const paidOrder = await this.prisma.$transaction(async (tx) => {
      return this.finalizePaidOrder(tx, order, razorpayPaymentId, 'Payment capture was confirmed by the Razorpay webhook.')
    })

    this.markProcessedPayment(razorpayPaymentId)

    const normalizedOrder = this.normalizeOrder(paidOrder)
    await this.queueNotification(normalizedOrder, NotificationType.PAYMENT_CONFIRMED, `Payment received for ${normalizedOrder.orderTitle || 'your order'}`, '')

    return { received: true, orderId: paidOrder.id }
  }

  async refundOrder(id: number, dto: { manual?: boolean; method?: string; reference?: string; notes?: string } = {}) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { items: true },
    })
    if (!order) {
      throw new NotFoundException('Order not found')
    }
    if (order.status !== OrderStatus.CANCELLED) {
      throw new BadRequestException('Only cancelled orders can be refunded')
    }
    if (order.refundedAt) {
      return this.normalizeOrder(order)
    }

    const isOnlinePayment = Boolean(order.razorpayPaymentId)
    if (!isOnlinePayment && !dto.manual) {
      throw new BadRequestException('This order was not paid online. Set manual to true to record a cash/COD refund.')
    }

    let refundId = order.refundId
    if (isOnlinePayment) {
      this.ensureRazorpayConfigured()
      const razorpayRefundId = await this.refundRazorpayPayment({
        razorpayOrderId: order.razorpayOrderId,
        razorpayPaymentId: order.razorpayPaymentId,
        total: order.total,
      })
      if (!razorpayRefundId) {
        throw new BadRequestException('Razorpay refund could not be processed. Please try again or use the Razorpay dashboard.')
      }
      refundId = razorpayRefundId
    } else if (dto.manual) {
      refundId = dto.reference?.trim() || `MANUAL-${order.id}-${Date.now()}`
    }

    const adminNotes = dto.notes?.trim()
      ? `${order.adminNotes ? order.adminNotes + '\n' : ''}Refund (${dto.method || 'manual'}): ${dto.notes.trim()}`
      : order.adminNotes

    const updatedOrder = await this.prisma.order.update({
      where: { id },
      data: {
        refundId,
        refundedAt: new Date(),
        ...(dto.manual
          ? {
              refundMethod: dto.method?.trim() || 'manual',
              refundReference: dto.reference?.trim() || null,
              refundNotes: dto.notes?.trim() || null,
            }
          : {}),
        ...(adminNotes !== order.adminNotes ? { adminNotes } : {}),
      },
      include: this.orderInclude,
    })

    await this.createActivity(this.prisma, id, OrderStatus.CANCELLED, dto.manual ? `A manual refund was recorded for this cancelled order.${dto.method ? ` Method: ${dto.method}.` : ''}${dto.reference ? ` Reference: ${dto.reference}.` : ''}` : 'A refund was processed for this cancelled order.')

    return this.normalizeOrder(updatedOrder)
  }

  async trackOrder(orderId: number, userId?: number) {
    const whereClause: Record<string, unknown> = { id: orderId }
    if (userId !== undefined) {
      whereClause.userId = userId
    }

    const order = await this.prisma.order.findFirst({
      where: whereClause,
      include: {
        user: { select: { id: true, name: true, email: true } },
        items: { include: { product: { select: { id: true, name: true, image: true } } } },
        activities: { orderBy: { createdAt: 'asc' } },
      },
    })

    if (!order) {
      throw new NotFoundException('Order not found')
    }

    const normalizedOrder = this.normalizeOrder(order)

    return {
      order: normalizedOrder,
      tracking: {
        courierName: order.courierName,
        trackingNumber: order.trackingNumber,
        estimatedDeliveryAt: order.estimatedDeliveryAt,
        statusHistory: normalizedOrder.activities,
      },
    }
  }
}
