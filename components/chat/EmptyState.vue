<template>
  <div class="flex h-full flex-col items-center justify-center px-4 py-16 text-center">
    <div class="mb-4 text-6xl">🔮</div>
    <h3 class="mb-2 text-lg font-semibold text-gray-700">{{ t('chat.emptyTitle') }}</h3>
    <p class="max-w-sm text-sm text-gray-400">
      {{ t('chat.emptyDesc') }}
    </p>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()
</script>
