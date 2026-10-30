<template>
  <button
    :class="[
      'inline-flex min-h-11 items-center justify-center gap-1.5 rounded-sm px-5 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50',
      variantClass,
      sizeClass,
    ]"
    :disabled="disabled"
    v-bind="$attrs"
  >
    <slot />
  </button>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
}>(), { variant: 'primary', size: 'md', disabled: false })

const variantClass = computed(() => ({
  primary: 'bg-[#a84637] text-white hover:bg-[#843428]',
  secondary: 'border border-[#1c302d] bg-transparent text-[#1c302d] hover:bg-[#e9e5d9]',
  ghost: 'text-[#52615b] hover:bg-[#e9e5d9]',
  danger: 'bg-[#1c302d] text-white hover:bg-[#2e4a44]',
}[props.variant]))

const sizeClass = computed(() => ({
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
}[props.size]))
</script>
