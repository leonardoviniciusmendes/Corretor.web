<template>
  <div class="empty-state">
    <span>{{ icon }}</span>
    <strong>{{ title }}</strong>
    <p>{{ message }}</p>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    icon?: string
    title?: string
    message?: string
  }>(),
  {
    icon: '0',
    title: 'Nenhum registro encontrado',
    message: 'A API nao retornou dados para esta consulta.',
  },
)
</script>
