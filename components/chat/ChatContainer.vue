<template>
  <div class="chat-shell">
    <!-- 技能标签栏 -->
    <div class="chat-topline">
      <span class="eyebrow">{{ t('chat.currentMode') }}</span>
      <span v-if="skillName" class="mode-pill">
        {{ skillName }}
      </span>
      <button
        class="quiet-button ml-auto"
        @click="$emit('changeSkill')"
      >
        {{ t('chat.switch') }}
      </button>
    </div>

    <!-- 错误提示 -->
    <div
      v-if="error"
      class="mx-4 mt-2 border-l-2 border-[#a84637] bg-[#f4e6e0] px-4 py-2 text-sm text-[#843428]"
      role="alert"
    >
      {{ error }}
      <button class="ml-2 min-h-11 underline" @click="$emit('dismissError')">{{ t('chat.dismiss') }}</button>
    </div>

    <!-- 消息列表 -->
    <MessageList :messages="messages" :is-streaming="isStreaming" />

    <!-- 输入区域 -->
    <ChatInput
      :is-streaming="isStreaming"
      :disabled="!canChat"
      :placeholder="inputPlaceholder"
      :remaining-quota="remainingQuota"
      :quota-total="quotaTotal"
      :allow-retry="messages.length >= 2 && messages[messages.length - 1]?.role === 'assistant' && !messages[messages.length - 1]?.content"
      @send="$emit('send', $event)"
      @stop="$emit('stop')"
    />
  </div>
</template>

<script setup lang="ts">
import type { ChatMessage } from '~/types/chat'

const props = defineProps<{
  messages: ChatMessage[]
  isStreaming: boolean
  error: string | null
  canChat: boolean
  skillName?: string
  remainingQuota: number
  quotaTotal: number
}>()

const emit = defineEmits<{
  send: [text: string]
  stop: []
  changeSkill: []
  dismissError: []
}>()

const { t } = useI18n()

const inputPlaceholder = computed(() =>
  props.canChat ? t('chat.inputPlaceholder') : t('chat.selectSkillFirst'),
)
</script>
