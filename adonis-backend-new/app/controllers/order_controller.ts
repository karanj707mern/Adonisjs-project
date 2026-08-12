import type { HttpContext } from '@adonisjs/core/http'
import { PrismaClient } from '#prisma/client'
import { JwtService } from '#services/jwt_service'
import { MailService } from '#services/mail_service'
import { RazorpayService } from '#services/razorpay_service'

export default class OrderController {
  private prisma: PrismaClient
  private jwtService: JwtService
  private mailService: MailService
  private razorpayService: RazorpayService

  constructor() {
    this.prisma = new PrismaClient()
    this.jwtService = new JwtService()
    this.mailService = new MailService()
    this.razorpayService = new RazorpayService()
  }

  async index({ auth, request, response }: HttpContext) {
    const user = auth.user as any
    const page = request.input('page', 1)
    const limit = request.input('limit', 20)

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where: { userId: user.id },
        include: { items: { include: { product: true } } },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.order.count({ where: { userId: user.id } }),
    ])

    return response.json({
      statusCode: 200,
      data: orders,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  }

  async show({ auth, params, response }: HttpContext) {
    const user = auth.user as any

    const order = await this.prisma.order.findFirst({
      where: {
        id: parseInt(params.id),
        userId: user.id,
      },
      include: {
        items: { include: { product: true } },
        activities: true,
      },
    })

    if (!order) {
      return response.status(404).json({
        statusCode: 404,
        message: 'Order not found',
      })
    }

    return response.json({
      statusCode: 200,
      data: order,
    })
  }

  async store({ auth, request, response }: HttpContext) {
    const user = auth.user as any
    const {
      recipientName,
      phoneNumber,
      addressLine1,
      addressLine2,
      city,
      state,
      postalCode,
      country,
      shippingType,
      paymentMethod,
      items,
      couponCode,
    } = request.body()

    let subtotal = 0
    const orderItems: any[] = []

    for (const item of items) {
      const product = await this.prisma.product.findUnique({
        where: { id: item.productId },
      })

      if (!product) {
        return response.status(400).json({
          statusCode: 400,
          message: `Product ${item.productId} not found`,
        })
      }

      const itemTotal = product.price * item.quantity
      subtotal += itemTotal

      orderItems.push({
        productId: product.id,
        quantity: item.quantity,
        price: product.price,
      })
    }

    const shippingAmount = shippingType === 'express' ? 150 : shippingType === 'same-day' ? 300 : 50
    const taxAmount = subtotal * 0.05
    const total = subtotal + shippingAmount + taxAmount

    const order = await this.prisma.order.create({
      data: {
        userId: user.id,
        subtotal,
        shippingAmount,
        taxAmount,
        total,
        shippingType,
        paymentMethod,
        recipientName,
        phoneNumber,
        addressLine1,
        addressLine2,
        city,
        state,
        postalCode,
        country,
        couponCode,
        status: paymentMethod === 'cod' ? 'PENDING' : 'PENDING',
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
        items: {
          create: orderItems,
        },
      },
      include: {
        items: { include: { product: true } },
      },
    })

    await this.mailService.sendEmail(user.email, 'Order Confirmation', 'order-confirmation', {
      orderId: order.id,
      total,
    })

    return response.json({
      statusCode: 200,
      message: 'Order created successfully',
      data: order,
    })
  }

  async checkoutSession({ auth, request, response }: HttpContext) {
    const user = auth.user as any
    const { orderId } = request.body()

    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId: user.id },
    })

    if (!order) {
      return response.status(404).json({
        statusCode: 404,
        message: 'Order not found',
      })
    }

    const razorpayOrder = await this.razorpayService.createOrder(
      order.total,
      'INR',
      `MOR-${order.id}`
    )

    await this.prisma.order.update({
      where: { id: orderId },
      data: { razorpayOrderId: razorpayOrder.id },
    })

    return response.json({
      statusCode: 200,
      data: {
        razorpayOrderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
      },
    })
  }

  async verifyPayment({ auth, request, response }: HttpContext) {
    const user = auth.user as any
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = request.body()

    const isValid = await this.razorpayService.verifyPaymentSignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    )

    if (!isValid) {
      return response.status(400).json({
        statusCode: 400,
        message: 'Invalid payment signature',
      })
    }

    const order = await this.prisma.order.findFirst({
      where: {
        razorpayOrderId: razorpay_order_id,
        userId: user.id,
      },
    })

    if (!order) {
      return response.status(404).json({
        statusCode: 404,
        message: 'Order not found',
      })
    }

    const updatedOrder = await this.prisma.order.update({
      where: { id: order.id },
      data: {
        status: 'PAID',
        paidAt: new Date(),
        razorpayPaymentId: razorpay_payment_id,
      },
    })

    return response.json({
      statusCode: 200,
      message: 'Payment verified successfully',
      data: updatedOrder,
    })
  }

  async adminIndex({ response }: HttpContext) {
    const orders = await this.prisma.order.findMany({
      include: {
        user: { select: { name: true, email: true } },
        items: { include: { product: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return response.json({
      statusCode: 200,
      data: orders,
    })
  }
}
