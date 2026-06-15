export type Locale = 'zh-CN' | 'en'

export interface LocaleOption {
  value: Locale
  label: string
  nativeLabel: string
}

export const localeOptions: LocaleOption[] = [
  { value: 'zh-CN', label: '简体中文', nativeLabel: '中文' },
  { value: 'en', label: 'English', nativeLabel: 'English' },
]

export const defaultLocale: Locale = 'zh-CN'

export type TranslationMap = Record<string, string>
