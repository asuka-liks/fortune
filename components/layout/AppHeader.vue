<template>
  <header class="app-header">
    <div class="flex items-center gap-3">
      <!-- 移动端菜单按钮 -->
      <button
        class="quiet-button lg:hidden"
        :aria-label="t('sidebar.history')"
        @click="$emit('toggleSidebar')"
      >
        <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      <span class="brand-mark" aria-hidden="true">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"><circle cx="12" cy="12" r="7"/><path d="M12 1v4m0 14v4M1 12h4m14 0h4M7 17 17 7"/></svg>
      </span>
      <div class="flex items-baseline gap-3">
        <span class="brand-name">{{ localeStore.locale === 'en' ? 'FORTUNE' : '观象' }}</span>
        <span class="hidden text-[10px] tracking-[.18em] text-[#738077] sm:inline">AI READINGS</span>
      </div>
    </div>
    <div class="flex items-center gap-2">
      <span class="hidden text-xs text-[#738077] md:block">{{ t('app.subtitle') }}</span>

      <!-- 语言切换 -->
      <div ref="langMenuRef" class="relative">
        <button
          class="quiet-button"
          :aria-label="localeStore.locale === 'en' ? 'Change language' : '切换语言'"
          @click.stop="showLangMenu = !showLangMenu"
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/></svg>
          <span>{{ localeStore.locale === 'en' ? 'EN' : '中文' }}</span>
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
            class="absolute right-0 top-full z-30 mt-1 w-36 border border-[#d8d5c9] bg-[#fbf9f4] py-1 shadow-lg"
          >
            <button
              v-for="opt in localeOptions"
              :key="opt.value"
              class="flex min-h-11 w-full items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-[#e9e5d9]"
              :class="localeStore.locale === opt.value ? 'text-[#a84637] font-semibold' : 'text-[#52615b]'"
              @click="switchLocale(opt.value)"
            >
              <span class="font-serif text-xs">{{ opt.value === 'zh-CN' ? '中' : 'EN' }}</span>
              <span>{{ opt.nativeLabel }}</span>
              <span v-if="localeStore.locale === opt.value" class="ml-auto text-[#a84637]">✓</span>
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
