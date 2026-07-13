<template>
  <span class="status-badge">{{ label }}</span>
</template>

<script setup lang="ts">
defineProps<{ label: string }>()
</script>
