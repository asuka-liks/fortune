<template>
  <div class="flex h-full flex-col">
    <!-- 技能标签栏 -->
    <div v-if="skillName" class="flex items-center gap-2 border-b bg-white px-4 py-2">
      <span class="text-sm font-medium text-gray-600">当前模式：</span>
      <span class="rounded-full bg-purple-100 px-3 py-0.5 text-sm font-medium text-purple-700">
        {{ skillName }}
      </span>
      <button
        class="ml-auto text-xs text-gray-400 hover:text-gray-600"
        @click="$emit('changeSkill')"
      >
        切换 →
      </button>
    </div>

    <!-- 错误提示 -->
    <div
      v-if="error"
      class="mx-4 mt-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700"
    >
      {{ error }}
      <button class="ml-2 underline" @click="$emit('dismissError')">关闭</button>
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

const inputPlaceholder = computed(() =>
  props.canChat ? '输入你的问题...' : '请先在左侧选择一种算命方式',
)
</script>
