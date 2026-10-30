<template>
  <footer class="app-footer flex flex-wrap items-center justify-between gap-x-5 gap-y-1">
    <p>{{ t('app.footer') }}</p>
    <div class="flex items-center justify-center gap-3 flex-wrap">
      <a
        href="https://beian.miit.gov.cn/"
        target="_blank"
        rel="noopener noreferrer"
        class="transition-colors"
      >
        苏ICP备2026041456号-1
      </a>
      <a
        href="https://beian.mps.gov.cn/#/query/webSearch?code=32021402004828"
        target="_blank"
        rel="noreferrer"
        class="flex items-center gap-1 transition-colors"
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
