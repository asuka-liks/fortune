<template>
  <select
    :value="modelValue"
    :disabled="disabled"
    class="min-h-11 w-full rounded-sm border border-[#d8d5c9] bg-[#fffefa] px-3 py-2 text-sm text-[#1c302d] transition-colors focus:border-[#a84637] focus:outline-none focus:ring-1 focus:ring-[#a84637] disabled:bg-[#e9e5d9]"
    @change="$emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
  >
    <option v-if="placeholder" value="" disabled>{{ placeholder }}</option>
    <option
      v-for="opt in options"
      :key="opt.value"
      :value="opt.value"
    >
      {{ opt.label }}
    </option>
  </select>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: string
  options: Array<{ value: string; label: string }>
  placeholder?: string
  disabled?: boolean
}>()

defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>
