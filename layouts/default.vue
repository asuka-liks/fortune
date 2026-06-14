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
  </div>
</template>

<script setup lang="ts">
const sidebarOpen = ref(false)
</script>
