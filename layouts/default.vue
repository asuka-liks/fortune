<template>
  <div class="flex h-screen overflow-hidden bg-gray-50">
    <AppSidebar
      :mobile-open="sidebarOpen"
      @close-mobile="sidebarOpen = false"
    />
    <div class="flex flex-1 flex-col overflow-hidden">
      <AppHeader @toggle-sidebar="sidebarOpen = !sidebarOpen" />
      <main class="flex-1 overflow-hidden">
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
const pageTitle = computed(() =>
  localeStore.locale === 'en' ? '🔮 AI Fortune Teller' : '🔮 AI 算命',
)
useHead({ title: pageTitle })
</script>
