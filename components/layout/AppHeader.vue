<template>
  <header class="flex items-center justify-between border-b bg-white px-4 py-3 shadow-sm">
    <div class="flex items-center gap-3">
      <!-- 移动端菜单按钮 -->
      <button
        class="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 lg:hidden"
        @click="$emit('toggleSidebar')"
      >
        <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      <h1 class="text-lg font-bold text-purple-700">{{ t('app.title') }}</h1>
    </div>
    <div class="flex items-center gap-2">
      <span class="hidden text-xs text-gray-400 sm:block">{{ t('app.subtitle') }}</span>

      <!-- 语言切换 -->
      <div ref="langMenuRef" class="relative">
        <button
          class="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-sm text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
          @click.stop="showLangMenu = !showLangMenu"
        >
          <span>🌐</span>
          <span class="hidden sm:inline">{{ localeStore.locale === 'en' ? 'EN' : '中文' }}</span>
          <svg
            class="h-3.5 w-3.5 transition-transform"
            :class="showLangMenu ? 'rotate-180' : ''"
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        <!-- 下拉菜单 -->
        <Transition name="lang-drop">
          <div
            v-if="showLangMenu"
            class="absolute right-0 top-full mt-1 w-36 rounded-lg border bg-white py-1 shadow-lg"
          >
            <button
              v-for="opt in localeOptions"
              :key="opt.value"
              class="flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-gray-50"
              :class="localeStore.locale === opt.value ? 'text-purple-600 font-semibold' : 'text-gray-600'"
              @click="switchLocale(opt.value)"
            >
              <span>{{ opt.value === 'zh-CN' ? '🇨🇳' : '🇺🇸' }}</span>
              <span>{{ opt.nativeLabel }}</span>
              <span v-if="localeStore.locale === opt.value" class="ml-auto text-purple-500">✓</span>
            </button>
          </div>
        </Transition>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { localeOptions, type Locale } from '~/locales'

defineEmits<{
  toggleSidebar: []
}>()

const { t } = useI18n()
const localeStore = useLocaleStore()
const showLangMenu = ref(false)
const langMenuRef = ref<HTMLElement | null>(null)

function switchLocale(l: Locale) {
  localeStore.setLocale(l)
  localeStore.persist()
  showLangMenu.value = false
}

// 点击其他区域关闭下拉菜单
onMounted(() => {
  document.addEventListener('click', () => {
    showLangMenu.value = false
  })
})
</script>
