<template>
  <Teleport to="body">
    <Transition name="lang-modal">
      <div v-if="visible" class="fixed inset-0 z-50 flex items-center justify-center bg-[#1c302d]/50 px-4 backdrop-blur-sm">
        <div class="w-full max-w-sm border border-[#d8d5c9] bg-[#fbf9f4] p-7 shadow-2xl">
          <div class="mb-7 text-center">
            <div class="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full border border-[#1c302d] font-serif text-xl text-[#a84637]" aria-hidden="true">✧</div>
            <h2 class="font-display text-2xl font-semibold text-[#1c302d]">Language / 语言</h2>
            <p class="mt-2 text-sm text-[#52615b]">Choose your language / 选择你的语言</p>
          </div>

          <div class="space-y-3">
            <button
              v-for="opt in localeOptions"
              :key="opt.value"
              class="flex min-h-16 w-full items-center gap-4 border px-5 py-3 text-left transition-colors hover:border-[#a84637] hover:bg-[#f4e6e0]"
              :class="selected === opt.value
                ? 'border-[#a84637] bg-[#f4e6e0]'
                : 'border-[#d8d5c9]'"
              @click="selected = opt.value"
            >
              <span class="font-display w-8 text-lg text-[#a84637]">{{ opt.value === 'zh-CN' ? '中' : 'EN' }}</span>
              <div class="flex-1">
                <div class="font-semibold text-[#1c302d]">{{ opt.label }}</div>
                <div class="text-sm text-[#52615b]">{{ opt.nativeLabel }}</div>
              </div>
              <div
                v-if="selected === opt.value"
                class="flex h-6 w-6 items-center justify-center rounded-full bg-[#a84637] text-sm text-white"
              >
                ✓
              </div>
            </button>
          </div>

          <button
            class="mt-6 min-h-12 w-full bg-[#a84637] py-3 font-semibold text-white transition-colors hover:bg-[#843428] disabled:opacity-50"
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
