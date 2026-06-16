export default defineEventHandler((event) => {
  const config = useRuntimeConfig(event)
  const siteUrl = config.public.siteUrl || 'https://fortunetellor.vercel.app'

  const robots = `# https://www.robotstxt.org/
User-agent: *
Allow: /

# Disallow API endpoints (no SEO value)
Disallow: /api/

# Sitemap
Sitemap: ${siteUrl}/sitemap.xml
`

  setHeader(event, 'Content-Type', 'text/plain')
  setHeader(event, 'Cache-Control', 'public, max-age=86400')
  return robots
})
