<template>
  <!-- 桌面端侧边栏 -->
  <aside class="hidden w-64 flex-shrink-0 flex-col border-r bg-white lg:flex">
    <SidebarContent />
  </aside>

  <!-- 移动端抽屉 -->
  <Teleport to="body">
    <Transition name="drawer">
      <div
        v-if="mobileOpen"
        class="fixed inset-0 z-40 lg:hidden"
      >
        <div
          class="absolute inset-0 bg-black/40 backdrop-blur-sm"
          @click="$emit('closeMobile')"
        />
        <aside class="absolute left-0 top-0 flex h-full w-72 flex-col border-r bg-white shadow-xl">
          <div class="flex items-center justify-between border-b px-4 py-3">
            <span class="font-semibold text-purple-700">{{ t('sidebar.menu') }}</span>
            <button
              class="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              @click="$emit('closeMobile')"
            >
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <SidebarContent />
        </aside>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
defineProps<{
  mobileOpen: boolean
}>()

defineEmits<{
  closeMobile: []
}>()

const { t } = useI18n()
</script>

<style scoped>
.drawer-enter-active,
.drawer-leave-active {
  transition: opacity 0.25s ease;
}
.drawer-enter-active aside,
.drawer-leave-active aside {
  transition: transform 0.25s ease;
}
.drawer-enter-from,
.drawer-leave-to {
  opacity: 0;
}
.drawer-enter-from aside,
.drawer-leave-to aside {
  transform: translateX(-100%);
}
</style>
