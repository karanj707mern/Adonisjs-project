import vine from '@vinejs/vine'

export const createOrderValidator = vine.create(
  vine.object({
    recipientName: vine.string().maxLength(100),
    phoneNumber: vine.string().maxLength(20),
    addressLine1: vine.string().maxLength(255),
    addressLine2: vine.string().maxLength(255).optional(),
    city: vine.string().maxLength(100),
    state: vine.string().maxLength(100),
    postalCode: vine.string().maxLength(20),
    country: vine.string().maxLength(100),
    shippingType: vine.string().optional(),
    paymentMethod: vine.string().optional(),
    promoCode: vine.string().maxLength(32).optional(),
  })
)

export const updateOrderValidator = vine.create(
  vine.object({
    status: vine.string().optional(),
    courierName: vine.string().optional(),
    trackingNumber: vine.string().optional(),
    estimatedDeliveryAt: vine.string().optional(),
    note: vine.string().optional(),
    adminNotes: vine.string().optional(),
  })
)

export const refundOrderValidator = vine.create(
  vine.object({
    manual: vine.boolean().optional(),
    method: vine.string().optional(),
    reference: vine.string().optional(),
    notes: vine.string().optional(),
  })
)

export const createOrderIssueValidator = vine.create(
  vine.object({
    type: vine.enum(['RETURN', 'REFUND', 'REPLACEMENT', 'DISPUTE', 'SHIPMENT_EXCEPTION']),
    title: vine.string().minLength(3),
    description: vine.string().minLength(10),
  })
)

export const updateOrderIssueValidator = vine.create(
  vine.object({
    status: vine
      .enum(['OPEN', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'RESOLVED', 'CANCELLED'])
      .optional(),
    adminResponse: vine.string().optional(),
    resolutionSummary: vine.string().optional(),
  })
)

export const verifyPaymentValidator = vine.create(
  vine.object({
    orderId: vine.number(),
    razorpayOrderId: vine.string(),
    razorpayPaymentId: vine.string(),
    razorpaySignature: vine.string(),
  })
)

export const queryOrderValidator = vine.create(
  vine.object({
    page: vine.number().min(1).optional(),
    limit: vine.number().min(1).max(100).optional(),
    status: vine.string().optional(),
    paymentMethod: vine.string().optional(),
    search: vine.string().optional(),
    startDate: vine.string().optional(),
    endDate: vine.string().optional(),
    sortBy: vine.enum(['createdAt', 'total', 'status']).optional(),
    sortOrder: vine.enum(['asc', 'desc']).optional(),
  })
)
