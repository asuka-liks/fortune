// https://nuxt.com/docs/api/configuration/nuxt-config
const SITE_URL = process.env.NUXT_PUBLIC_SITE_URL || 'https://fortunetellor.vercel.app'
const SITE_NAME = 'AI Fortune Teller'
const SITE_DESC = 'AI-powered fortune telling: BaZi (八字), Astrology (星座) & Tarot (塔罗). Free, bilingual (中文/English), streaming AI readings. | AI 算命 — 八字命理 · 星座运势 · 塔罗占卜，免费双语解读。'

export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss', '@pinia/nuxt'],
  components: {
    dirs: [
      { path: '~/components', pathPrefix: false },
    ],
  },
  css: ['~/assets/css/main.css'],
  // 运行时环境变量（客户端可见）
  runtimeConfig: {
    public: {
      siteUrl: SITE_URL,
    },
  },
  app: {
    head: {
      title: '🔮 AI Fortune Teller — BaZi · Astrology · Tarot | AI 算命',
      charset: 'utf-8',
      viewport: 'width=device-width, initial-scale=1',
      meta: [
        { name: 'description', content: SITE_DESC },
        // Open Graph (Facebook, LinkedIn, etc.)
        { property: 'og:type', content: 'website' },
        { property: 'og:url', content: SITE_URL },
        { property: 'og:title', content: '🔮 AI Fortune Teller — BaZi · Astrology · Tarot' },
        { property: 'og:description', content: SITE_DESC },
        { property: 'og:site_name', content: SITE_NAME },
        { property: 'og:locale', content: 'zh_CN' },
        { property: 'og:locale:alternate', content: 'en_US' },
        // Twitter Card
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: '🔮 AI Fortune Teller' },
        { name: 'twitter:description', content: SITE_DESC },
        // 移动端
        { name: 'theme-color', content: '#7c3aed' },
      ],
      link: [
        { rel: 'canonical', href: SITE_URL },
        { rel: 'alternate', hreflang: 'zh-CN', href: SITE_URL },
        { rel: 'alternate', hreflang: 'en', href: SITE_URL },
        { rel: 'alternate', hreflang: 'x-default', href: SITE_URL },
      ],
    },
  },
  nitro: {
    // preset 由部署平台自动检测，不硬编码
  },
})
