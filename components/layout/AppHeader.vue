<template>
  <header class="flex items-center justify-between border-b bg-white px-4 py-3 shadow-sm">
    <div class="flex items-center gap-3">
      <!-- 移动端菜单按钮 -->
      <button
        class="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 lg:hidden"
        @click="$emit('toggleSidebar')"
      >
        <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      <h1 class="text-lg font-bold text-purple-700">{{ t('app.title') }}</h1>
    </div>
    <div class="flex items-center gap-2">
      <span class="hidden text-xs text-gray-400 sm:block">{{ t('app.subtitle') }}</span>
    </div>
  </header>
</template>

<script setup lang="ts">
defineEmits<{
  toggleSidebar: []
}>()

const { t } = useI18n()
</script>
