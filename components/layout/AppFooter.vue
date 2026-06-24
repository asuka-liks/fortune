<template>
  <footer class="border-t bg-white px-4 py-2 text-center text-xs text-gray-400">
    <p>{{ t('app.footer') }}</p>
    <a
      href="https://beian.miit.gov.cn/"
      target="_blank"
      rel="noopener noreferrer"
      class="hover:text-gray-500 transition-colors"
    >
      苏ICP备2026041456号-1
    </a>
  </footer>
</template>

<script setup lang="ts">
const { t } = useI18n()
</script>
