import { component$ } from '@builder.io/qwik'
import { type DocumentHead } from '@builder.io/qwik-city'
import { InfoPage } from '~/components/InfoPage'

export const useContent = () => {
  const pages: Record<string, { title: string; content: string }> = {
    'contact': {
      title: 'Contact Us',
      content: 'Get in touch with our team for any questions or support.',
    },
    'about-us': {
      title: 'About Us',
      content: 'Learn about our mission to bring natural wellness products to everyone.',
    },
    'shipping': {
      title: 'Shipping Information',
      content: 'Free shipping on orders above ₹999. Standard delivery in 5-7 business days.',
    },
    'returns': {
      title: 'Returns & Exchanges',
      content: 'Easy returns within 30 days of delivery. Items must be unused and in original packaging.',
    },
    'privacy-policy': {
      title: 'Privacy Policy',
      content: 'We value your privacy. This policy explains how we collect, use, and protect your data.',
    },
    'terms': {
      title: 'Terms & Conditions',
      content: 'By using our services, you agree to the following terms and conditions.',
    },
  }

  return pages
}

export default component$(() => {
  const pages = useContent()
  const content = pages['contact']

  return (
    <div class="min-h-screen bg-stone-50 dark:bg-stone-900">
      <div class="container mx-auto px-4 py-8">
        <InfoPage title={content.title} content={content.content} />
      </div>
    </div>
  )
})

export const head: DocumentHead = () => {
  const content = useContent()
  const page = content['contact']
  
  return {
    title: `${page.title} - Moringa Store`,
    meta: [
      {
        name: 'description',
        content: page.content,
      },
    ],
  }
}
