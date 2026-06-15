<template>
  <div class="border-t bg-white px-4 py-3">
    <!-- 配额提示 -->
    <div
      v-if="quotaTotal > 0 && remainingQuota <= 2"
      class="mb-2 flex items-center justify-center gap-1 text-xs"
      :class="remainingQuota === 0 ? 'text-red-500' : 'text-amber-600'"
    >
      <span v-if="remainingQuota > 0">
        {{ t('chat.quotaRemaining', { n: remainingQuota }) }}
      </span>
      <span v-else>
        {{ t('chat.quotaExhausted') }}
      </span>
    </div>

    <form class="flex items-end gap-2" @submit.prevent="handleSubmit">
      <textarea
        ref="textareaRef"
        v-model="inputText"
        :disabled="disabled || isQuotaExhausted"
        :placeholder="isQuotaExhausted ? t('chat.quotaExhaustedShort') : placeholder"
        rows="1"
        class="flex-1 resize-none rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:border-purple-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-purple-500 disabled:opacity-50"
        :style="{ maxHeight: '120px' }"
        @keydown.enter.exact="handleSubmit"
        @input="autoResize"
      />
      <BaseButton
        v-if="!isStreaming"
        type="submit"
        variant="primary"
        :disabled="!inputText.trim() || disabled || isQuotaExhausted"
      >
        {{ t('chat.send') }}
      </BaseButton>
      <BaseButton
        v-else
        variant="danger"
        @click="$emit('stop')"
      >
        {{ t('chat.stop') }}
      </BaseButton>
    </form>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  isStreaming: boolean
  disabled: boolean
  placeholder?: string
  remainingQuota: number
  quotaTotal: number
}>()

const emit = defineEmits<{
  send: [text: string]
  stop: []
}>()

const { t } = useI18n()

const inputText = ref('')
const textareaRef = ref<HTMLTextAreaElement | null>(null)

const isQuotaExhausted = computed(() => props.remainingQuota <= 0)

function handleSubmit(e?: Event) {
  if (e && (e as KeyboardEvent).shiftKey) return // Shift+Enter 换行
  if (props.isStreaming) return
  e?.preventDefault()
  const text = inputText.value.trim()
  if (!text) return
  emit('send', text)
  inputText.value = ''
  nextTick(() => autoResize())
}

function autoResize() {
  const el = textareaRef.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = Math.min(el.scrollHeight, 120) + 'px'
}
</script>
