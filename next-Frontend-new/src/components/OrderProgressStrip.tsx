import { component$ } from '@builder.io/qwik'

interface OrderProgressStripProps {
  status: 'PENDING' | 'PAID' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'OUT_FOR_DELIVERY'
}

export const OrderProgressStrip = component$<OrderProgressStripProps>((props) => {
  const steps = [
    { key: 'PENDING', label: 'Order Placed' },
    { key: 'PAID', label: 'Paid' },
    { key: 'SHIPPED', label: 'Shipped' },
    { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery' },
    { key: 'DELIVERED', label: 'Delivered' },
  ]

  const currentIndex = steps.findIndex((s) => s.key === props.status)

  return (
    <div class="flex items-center justify-between">
      {steps.map((step, index) => (
        <div key={step.key} class="flex flex-col items-center">
          <div
            class={`w-8 h-8 rounded-full flex items-center justify-center ${
              index <= currentIndex
                ? 'bg-primary-600 text-white'
                : 'bg-stone-200 text-stone-500'
            }`}
          >
            {index + 1}
          </div>
          <span class="text-xs mt-2 text-stone-600 dark:text-stone-400">
            {step.label}
          </span>
        </div>
      ))}
    </div>
  )
})
