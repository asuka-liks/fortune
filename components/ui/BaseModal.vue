<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="modelValue"
        class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto pt-10 sm:items-center sm:pt-0"
        @click.self="$emit('update:modelValue', false)"
      >
        <!-- 背景遮罩 -->
        <div class="fixed inset-0 bg-[#1c302d]/45 backdrop-blur-sm transition-opacity" />

        <!-- 内容面板 -->
        <div class="relative z-10 mx-4 w-full max-w-lg border border-[#d8d5c9] bg-[#fbf9f4] p-6 shadow-xl transition-all">
          <slot />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: boolean
}>()

defineEmits<{
  'update:modelValue': [value: boolean]
}>()
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
