import type { HttpContext } from '@adonisjs/core/http'

export default class AppController {
  async sitemap({ response }: HttpContext) {
    response.header('Content-Type', 'application/xml')
    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${process.env.APP_URL || 'http://localhost:5000'}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`
  }

  async robots({ response }: HttpContext) {
    response.header('Content-Type', 'text/plain')
    return `User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin
Disallow: /profile
Disallow: /orders
Disallow: /cart
Disallow: /auth
`
  }
}
