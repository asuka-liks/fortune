import zhCN from '~/locales/zh-CN'
import en from '~/locales/en'
import type { TranslationMap } from '~/locales'

const translations: Record<string, TranslationMap> = {
  'zh-CN': zhCN,
  en,
}

/**
 * 响应式翻译 composable。
 * 用法：const { t } = useI18n(); t('chat.send') => "发送"
 * 支持参数插值：t('chat.quotaRemaining', { n: 3 }) => "🔮 剩余 3 次免费对话"
 */
export function useI18n() {
  const localeStore = useLocaleStore()

  function t(key: string, params?: Record<string, string | number>): string {
    const map = translations[localeStore.locale] ?? zhCN
    let text = map[key]
    if (text === undefined) {
      // 回退到中文
      text = zhCN[key] ?? key
    }
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        text = text.replaceAll(`{${k}}`, String(v))
      }
    }
    return text
  }

  return { t, locale: computed(() => localeStore.locale) }
}
