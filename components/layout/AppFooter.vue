<template>
  <footer class="border-t bg-white px-4 py-2 text-center text-xs text-gray-400">
    <p>{{ t('app.footer') }}</p>
    <div class="flex items-center justify-center gap-3 flex-wrap">
      <a
        href="https://beian.miit.gov.cn/"
        target="_blank"
        rel="noopener noreferrer"
        class="hover:text-gray-500 transition-colors"
      >
        苏ICP备2026041456号-1
      </a>
      <a
        href="https://beian.mps.gov.cn/#/query/webSearch?code=32021402004828"
        target="_blank"
        rel="noreferrer"
        class="flex items-center gap-1 hover:text-gray-500 transition-colors"
      >
        <img :src="beianIcon" alt="公安备案" class="w-3 h-3" />
        苏公网安备32021402004828号
      </a>
    </div>
  </footer>
</template>

<script setup lang="ts">
const { t } = useI18n()
const config = useRuntimeConfig()
const beianIcon = `${config.app.baseURL}beian.png`
</script>
