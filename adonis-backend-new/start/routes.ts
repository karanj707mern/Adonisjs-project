import router from '@adonisjs/core/services/router'
import env from '#start/env'

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
    router.use([
      () => import('#middleware/guest_token_middleware'),
      () => import('#middleware/request_context_middleware'),
      () => import('#middleware/csrf_middleware'),
    ])

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
  })
  .prefix('api/v1')

// ---------------------------------------------------------------------------
// Public SEO endpoints (no api/v1 prefix)
// ---------------------------------------------------------------------------

router.get('/sitemap.xml', async ({ response, app }) => {
  const prisma = app.container.make('Prisma')
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
  ]

  const urls = [
    ...staticUrls,
    ...products.map((p: any) => ({
      loc: `/product/${p.id}`,
      changefreq: 'weekly',
      priority: '0.8',
      lastmod: p.updatedAt,
    })),
    ...posts.map((p: any) => ({
      loc: `/blog/${p.slug}`,
      changefreq: 'weekly',
      priority: '0.7',
      lastmod: p.updatedAt,
    })),
  ]

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${urls.map((u: any) => `<url><loc>${siteUrl}${u.loc}</loc><changefreq>${u.changefreq}</changefreq><priority>${u.priority}</priority>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}</url>`).join('\n  ')}
</urlset>`

  return response.header('Content-Type', 'application/xml').send(xml)
})

router.get('/robots.txt', ({ response }) => {
  return response
    .header('Content-Type', 'text/plain')
    .send(
      `User-agent: *\nDisallow: /api/\nAllow: /\nSitemap: ${env.get('SITE_URL') || env.get('FRONTEND_URL') || 'http://localhost:5000'}/sitemap.xml`
    )
})

export default router
