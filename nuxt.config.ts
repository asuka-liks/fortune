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
      title: 'AI 算命 - Fortune Telling',
      charset: 'utf-8',
      viewport: 'width=device-width, initial-scale=1',
    },
  },
  nitro: {
    preset: 'node-server',
  },
})
