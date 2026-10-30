<template>
  <div class="app-shell">
    <AppSidebar
      :mobile-open="sidebarOpen"
      @close-mobile="sidebarOpen = false"
    />
    <div class="app-workspace">
      <AppHeader @toggle-sidebar="sidebarOpen = !sidebarOpen" />
      <main class="app-main">
        <slot />
      </main>
      <AppFooter />
    </div>
    <LanguageModal v-model="showLanguageModal" />
  </div>
</template>

<script setup lang="ts">
const sidebarOpen = ref(false)

// 语言初始化：首次访问弹出语言选择框
const localeStore = useLocaleStore()
const showLanguageModal = ref(false)

onMounted(() => {
  const restored = localeStore.restore()
  if (!restored) {
    showLanguageModal.value = true
  }
})

// 根据语言动态设置页面标题
const pageTitle = computed(() => localeStore.locale === 'en' ? 'Fortune · Readings' : '观象 · AI 解读')
useHead({ title: pageTitle })
</script>
