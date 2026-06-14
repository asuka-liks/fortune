<template>
  <div
    :class="[
      'flex gap-3 px-4 py-3',
      message.role === 'user' ? 'justify-end' : 'justify-start',
    ]"
  >
    <!-- AI 头像 -->
    <div v-if="message.role === 'assistant'" class="flex-shrink-0">
      <div class="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 text-sm">
        🔮
      </div>
    </div>

    <!-- 消息气泡 -->
    <div
      :class="[
        'max-w-[80%] rounded-2xl px-4 py-3',
        message.role === 'user'
          ? 'bg-purple-600 text-white'
          : 'bg-white text-gray-800 shadow-sm border border-gray-100',
      ]"
    >
      <template v-if="message.role === 'user'">
        <p class="whitespace-pre-wrap text-sm leading-relaxed">{{ message.content }}</p>
      </template>
      <template v-else>
        <MarkdownRenderer :content="message.content" />
      </template>
    </div>

    <!-- 用户头像 -->
    <div v-if="message.role === 'user'" class="flex-shrink-0">
      <div class="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-sm">
        👤
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ChatMessage } from '~/types/chat'

defineProps<{
  message: ChatMessage
}>()
</script>
