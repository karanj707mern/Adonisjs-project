import { type DocumentHead } from '@builder.io/qwik-city'

export const onGet: DocumentHead = () => {
  return {
    headers: {
      'Content-Type': 'text/plain',
    },
    body: `User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin
Disallow: /profile
Disallow: /orders
Disallow: /cart
Disallow: /auth
`,
  }
}
