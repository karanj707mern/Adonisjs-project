import router from '@adonisjs/core/services/router'
import env from '@adonisjs/core/services/env'
import type { PrismaClient } from '@prisma/client'
import { guestTokenMiddleware } from '#middleware/guest_token_middleware'
import { requestContextMiddleware } from '#middleware/request_context_middleware'
import { csrfMiddleware } from '#middleware/csrf_middleware'

import registerAuth from '#controllers/auth/auth_routes'
import registerUser from '#controllers/user/user_routes'
import registerProduct from '#controllers/product/product_routes'
import registerCart from '#controllers/cart/cart_routes'
import registerOrder from '#controllers/order/order_routes'
import registerSettings from '#controllers/settings/settings_routes'
import registerReview from '#controllers/review/review_routes'
import registerBlog from '#controllers/blog/blog_routes'
import registerWishlist from '#controllers/wishlist/wishlist_routes'
import registerCoupon from '#controllers/coupon/coupon_routes'
import registerAdmin from '#controllers/admin/admin_routes'
import registerHealth from '#controllers/health/health_routes'
import registerAudit from '#controllers/audit/audit_routes'
import registerAnalytics from '#controllers/analytics/analytics_routes'
import registerHero from '#controllers/hero/hero_routes'
import registerNewArrival from '#controllers/new_arrival/new_arrival_routes'
import registerGiftCard from '#controllers/gift_card/gift_card_routes'
import registerNotification from '#controllers/notification/notification_routes'
import registerEmailTemplate from '#controllers/notification/email_template_routes'

router.group(() => {
  router.use([guestTokenMiddleware, requestContextMiddleware, csrfMiddleware])

  registerAuth(router)
  registerUser(router)
  registerProduct(router)
  registerCart(router)
  registerOrder(router)
  registerSettings(router)
  registerReview(router)
  registerBlog(router)
  registerWishlist(router)
  registerCoupon(router)
  registerAdmin(router)
  registerHealth(router)
  registerAudit(router)
  registerAnalytics(router)
  registerHero(router)
  registerNewArrival(router)
  registerGiftCard(router)
  registerNotification(router)
  registerEmailTemplate(router)
}, { prefix: 'api/v1' })

// ---------------------------------------------------------------------------
// Public SEO endpoints (no api/v1 prefix)
// ---------------------------------------------------------------------------

router.get('/sitemap.xml', async ({ response }) => {
  const prisma = await getPrisma()
  const siteUrl = env.get('SITE_URL') || env.get('FRONTEND_URL') || ''
  if (!siteUrl) {
    return response
      .header('Content-Type', 'application/xml')
      .send('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>')
  }

  const [products, posts] = await Promise.all([
    prisma.product.findMany({
      where: { isActive: true },
      select: { id: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.blogPost.findMany({
      where: { published: true },
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' },
    }),
  ])

  const staticUrls = [
    { loc: '/', changefreq: 'daily', priority: '1.0' },
    { loc: '/shop', changefreq: 'daily', priority: '0.9' },
    { loc: '/about-us', changefreq: 'monthly', priority: '0.6' },
    { loc: '/wellness-journal', changefreq: 'weekly', priority: '0.6' },
    { loc: '/blog', changefreq: 'daily', priority: '0.8' },
    { loc: '/shipping', changefreq: 'monthly', priority: '0.5' },
    { loc: '/returns', changefreq: 'monthly', priority: '0.5' },
    { loc: '/privacy-policy', changefreq: 'monthly', priority: '0.5' },
    { loc: '/terms', changefreq: 'monthly', priority: '0.5' },
    { loc: '/contact', changefreq: 'monthly', priority: '0.5' },
  ]

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
  for (const url of staticUrls) {
    xml += `  <url><loc>${siteUrl}${url.loc}</loc><changefreq>${url.changefreq}</changefreq><priority>${url.priority}</priority></url>\n`
  }
  for (const product of products) {
    xml += `  <url><loc>${siteUrl}/product/${product.id}</loc><lastmod>${product.updatedAt.toISOString().split('T')[0]}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>\n`
  }
  for (const post of posts) {
    xml += `  <url><loc>${siteUrl}/blog/${post.slug}</loc><lastmod>${post.updatedAt.toISOString().split('T')[0]}</lastmod><changefreq>weekly</changefreq><priority>0.7</priority></url>\n`
  }
  xml += '</urlset>'

  return response.header('Content-Type', 'application/xml').send(xml)
})

router.get('/robots.txt', ({ response }) => {
  const siteUrl = env.get('SITE_URL') || env.get('FRONTEND_URL') || ''
  let robots = 'User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /admin\nDisallow: /profile\nDisallow: /orders\nDisallow: /cart\nDisallow: /auth\nDisallow: /admin-login\n'
  if (siteUrl) robots += `\nSitemap: ${siteUrl}/sitemap.xml\n`
  return response.header('Content-Type', 'text/plain').send(robots)
})

async function getPrisma(): Promise<PrismaClient> {
  const { default: app } = (await import('@adonisjs/core/services/app')) as any
  return app.container.make('Prisma')
}

export default router
