// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss', '@pinia/nuxt'],
  components: {
    dirs: [
      { path: '~/components', pathPrefix: false },
    ],
  },
  css: ['~/assets/css/main.css'],
  app: {
    head: {
      title: 'Fortune Telling - AI Fortune Teller',
      charset: 'utf-8',
      viewport: 'width=device-width, initial-scale=1',
    },
  },
  nitro: {
    // preset 由部署平台自动检测，不硬编码
  },
})
