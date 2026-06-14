<template>
  <span class="inline-flex items-center gap-1 rounded-full bg-purple-100 px-3 py-0.5 text-sm font-medium text-purple-700">
    <span>{{ icon }}</span>
    <span>{{ name }}</span>
  </span>
</template>

<script setup lang="ts">
defineProps<{
  icon: string
  name: string
}>()
</script>
