import { getSiteUrl } from '../lib/config'

const siteUrl = getSiteUrl()

const staticPages = [
  { url: '/', changefreq: 'daily', priority: '1.0' },
  { url: '/shop', changefreq: 'daily', priority: '0.9' },
  { url: '/about-us', changefreq: 'monthly', priority: '0.6' },
  { url: '/wellness-journal', changefreq: 'weekly', priority: '0.6' },
  { url: '/blog', changefreq: 'daily', priority: '0.8' },
  { url: '/shipping', changefreq: 'monthly', priority: '0.5' },
  { url: '/returns', changefreq: 'monthly', priority: '0.5' },
  { url: '/privacy-policy', changefreq: 'monthly', priority: '0.5' },
  { url: '/terms', changefreq: 'monthly', priority: '0.5' },
  { url: '/contact', changefreq: 'monthly', priority: '0.5' },
]

export async function GET() {
  try {
    const [productsRes, postsRes] = await Promise.all([
      fetch(`${siteUrl}/api/v1/products?limit=1000`, { headers: { Accept: 'application/json' } }).then((r) => r.json().catch(() => ({ data: [] }))),
      fetch(`${siteUrl}/api/v1/blog?limit=1000`, { headers: { Accept: 'application/json' } }).then((r) => r.json().catch(() => ({ data: [] }))),
    ])
    const products = Array.isArray(productsRes?.data) ? productsRes.data : Array.isArray(productsRes) ? productsRes : []
    const posts = Array.isArray(postsRes?.data) ? postsRes.data : Array.isArray(postsRes) ? postsRes : []

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    for (const page of staticPages) {
      xml += `  <url><loc>${siteUrl}${page.url}</loc><changefreq>${page.changefreq}</changefreq><priority>${page.priority}</priority></url>\n`
    }
    for (const p of products) {
      xml += `  <url><loc>${siteUrl}/product/${p.id}</loc><lastmod>${new Date(p.updatedAt || p.createdAt).toISOString().split('T')[0]}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>\n`
    }
    for (const post of posts) {
      xml += `  <url><loc>${siteUrl}/blog/${post.slug}</loc><lastmod>${new Date(post.updatedAt || post.createdAt).toISOString().split('T')[0]}</lastmod><changefreq>weekly</changefreq><priority>0.7</priority></url>\n`
    }
    xml += '</urlset>'
    return new Response(xml, { headers: { 'Content-Type': 'application/xml', 'Cache-Control': 'public, max-age=3600' } })
  } catch {
    return new Response('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>', { headers: { 'Content-Type': 'application/xml' } })
  }
}
