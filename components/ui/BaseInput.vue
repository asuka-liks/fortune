<template>
  <input
    :type="type"
    :value="modelValue"
    :placeholder="placeholder"
    :disabled="disabled"
    class="min-h-11 w-full rounded-sm border border-[#d8d5c9] bg-[#fffefa] px-3 py-2 text-sm text-[#1c302d] placeholder-[#738077] transition-colors focus:border-[#a84637] focus:outline-none focus:ring-1 focus:ring-[#a84637] disabled:bg-[#e9e5d9]"
    v-bind="$attrs"
    @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
  />
</template>

<script setup lang="ts">
defineProps<{
  modelValue: string
  type?: string
  placeholder?: string
  disabled?: boolean
}>()

defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>
