<template>
  <div class="message-line" role="status" :aria-label="locale === 'en' ? 'Reading in progress' : '正在解读'">
    <div class="message-role" aria-hidden="true">{{ locale === 'en' ? 'F' : '象' }}</div>
    <div class="message-body flex items-center gap-2">
      <span class="text-xs text-[#52615b]">{{ locale === 'en' ? 'Reading' : '解读中' }}</span>
      <span class="h-1.5 w-1.5 animate-bounce rounded-full bg-[#a84637]" style="animation-delay: 0ms" />
      <span class="h-1.5 w-1.5 animate-bounce rounded-full bg-[#a84637]" style="animation-delay: 150ms" />
      <span class="h-1.5 w-1.5 animate-bounce rounded-full bg-[#a84637]" style="animation-delay: 300ms" />
    </div>
  </div>
</template>
<script setup lang="ts">
const { locale } = useI18n()
</script>
