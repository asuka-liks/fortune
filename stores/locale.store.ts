import { defineStore } from 'pinia'
import type { Locale } from '~/locales'
import { defaultLocale } from '~/locales'

const STORAGE_KEY = 'fortune-locale'

export const useLocaleStore = defineStore('locale', () => {
  const locale = ref<Locale>(defaultLocale)

  function setLocale(l: Locale) {
    locale.value = l
  }

  /** 从 localStorage 恢复语言设置。返回 true 表示之前有保存过语言。 */
  function restore(): boolean {
    if (import.meta.server) return false
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'zh-CN' || stored === 'en') {
      locale.value = stored
      return true
    }
    return false
  }

  /** 持久化当前语言到 localStorage */
  function persist() {
    if (import.meta.server) return
    localStorage.setItem(STORAGE_KEY, locale.value)
  }

  return { locale, setLocale, restore, persist }
})
