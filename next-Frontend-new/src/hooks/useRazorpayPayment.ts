import { useSignal, useVisibleTask$ } from '@builder.io/qwik'
import { api } from '~lib/api-client'

export function useRazorpayPayment() {
  const processing = useSignal(false)
  const error = useSignal('')

  const initiatePayment = async (orderId: number, amount: number) => {
    processing.value = true
    error.value = ''

    try {
      const response = await api.order.createCheckoutSession({
        orderId,
        amount,
      })

      const options = {
        key: 'your-razorpay-key-id',
        amount: Math.round(amount * 100),
        currency: 'INR',
        name: 'Moringa Store',
        description: 'Order Payment',
        order_id: response.razorpayOrderId,
        handler: async (response: any) => {
          await api.order.verifyPayment({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          })
        },
        prefill: {
          name: '',
          email: '',
          contact: '',
        },
        theme: {
          color: '#059669',
        },
      }

      const rzp = new (window as any).Razorpay(options)
      rzp.open()
    } catch (e) {
      error.value = 'Payment initiation failed'
    } finally {
      processing.value = false
    }
  }

  return {
    processing,
    error,
    initiatePayment,
  }
}
