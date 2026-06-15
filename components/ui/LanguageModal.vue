<template>
  <Teleport to="body">
    <Transition name="lang-modal">
      <div
        v-if="visible"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      >
        <div class="mx-4 w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
          <div class="mb-6 text-center">
            <h2 class="text-2xl font-bold text-gray-800">Language</h2>
            <p class="mt-1 text-sm text-gray-400">Choose your language / 选择你的语言</p>
          </div>

          <div class="space-y-3">
            <button
              v-for="opt in localeOptions"
              :key="opt.value"
              class="flex w-full items-center gap-4 rounded-xl border-2 px-5 py-4 text-left transition-all hover:border-purple-300 hover:bg-purple-50"
              :class="selected === opt.value
                ? 'border-purple-500 bg-purple-50'
                : 'border-gray-200'"
              @click="selected = opt.value"
            >
              <span class="text-2xl">{{ opt.value === 'zh-CN' ? '🇨🇳' : '🇺🇸' }}</span>
              <div class="flex-1">
                <div class="font-semibold text-gray-800">{{ opt.label }}</div>
                <div class="text-sm text-gray-400">{{ opt.nativeLabel }}</div>
              </div>
              <div
                v-if="selected === opt.value"
                class="flex h-6 w-6 items-center justify-center rounded-full bg-purple-500 text-white text-sm"
              >
                ✓
              </div>
            </button>
          </div>

          <button
            class="mt-6 w-full rounded-xl bg-purple-500 py-3 font-semibold text-white transition-colors hover:bg-purple-600 disabled:opacity-50"
            @click="handleConfirm"
          >
            {{ selected === 'zh-CN' ? '开始使用' : 'Get Started' }}
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { localeOptions, type Locale } from '~/locales'

const props = withDefaults(defineProps<{
  modelValue: boolean
}>(), { modelValue: false })

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  selected: [locale: Locale]
}>()

const localeStore = useLocaleStore()
const selected = ref<Locale>(localeStore.locale)

const visible = computed(() => props.modelValue)

function handleConfirm() {
  localeStore.setLocale(selected.value)
  localeStore.persist()
  emit('selected', selected.value)
  emit('update:modelValue', false)
}
</script>

<style scoped>
.lang-modal-enter-active,
.lang-modal-leave-active {
  transition: opacity 0.25s ease;
}
.lang-modal-enter-active > div,
.lang-modal-leave-active > div {
  transition: transform 0.25s ease, opacity 0.25s ease;
}
.lang-modal-enter-from,
.lang-modal-leave-to {
  opacity: 0;
}
.lang-modal-enter-from > div,
.lang-modal-leave-to > div {
  transform: scale(0.95);
  opacity: 0;
}
</style>
