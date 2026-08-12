import Razorpay from 'razorpay'

export class RazorpayService {
  private client: Razorpay

  constructor() {
    this.client = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID || '',
      key_secret: process.env.RAZORPAY_KEY_SECRET || '',
    })
  }

  async createOrder(amount: number, currency: string = 'INR', receipt?: string) {
    const options = {
      amount: Math.round(amount * 100),
      currency,
      receipt: receipt || `receipt_${Date.now()}`,
      payment_capture: 1,
    }

    return await this.client.orders.create(options)
  }

  async verifyPaymentSignature(orderId: string, paymentId: string, signature: string) {
    const crypto = await import('crypto')
    const body = `${orderId}|${paymentId}`
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
      .update(body)
      .digest('hex')

    return expectedSignature === signature
  }

  async refundPayment(paymentId: string, amount?: number) {
    return await this.client.payments.refund(paymentId, {
      amount: amount ? Math.round(amount * 100) : undefined,
    })
  }
}
