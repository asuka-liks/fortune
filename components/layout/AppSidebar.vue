<template>
  <!-- 桌面端侧边栏 -->
  <aside class="sidebar hidden lg:flex">
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
          class="absolute inset-0 bg-[#1c302d]/40 backdrop-blur-sm"
          @click="$emit('closeMobile')"
        />
        <aside class="sidebar absolute left-0 top-0 flex h-full w-72 shadow-xl">
          <div class="flex items-center justify-between border-b border-[#d8d5c9] px-4 py-3">
            <span class="font-display text-lg font-semibold text-[#1c302d]">{{ t('sidebar.history') }}</span>
            <button
              class="quiet-button"
              :aria-label="t('chat.dismiss')"
              @click="$emit('closeMobile')"
            >
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <SidebarContent @select-session="$emit('closeMobile')" />
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
