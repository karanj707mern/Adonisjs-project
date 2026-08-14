import { getSiteUrl } from '../lib/config'

const siteUrl = getSiteUrl()

export const GET = () => {
  let robots = 'User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /admin\nDisallow: /profile\nDisallow: /orders\nDisallow: /cart\nDisallow: /auth\nDisallow: /admin-login\n'
  if (siteUrl) robots += `\nSitemap: ${siteUrl}/sitemap.xml\n`
  return new Response(robots, { headers: { 'Content-Type': 'text/plain', 'Cache-Control': 'public, max-age=86400' } })
}
