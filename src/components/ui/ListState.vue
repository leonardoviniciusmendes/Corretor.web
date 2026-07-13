<script setup lang="ts">
defineProps<{
  loading?: boolean
  error?: string | null
}>()

const emit = defineEmits<{
  retry: []
}>()
</script>

<template>
  <div v-if="loading" class="list-state">
    <span class="spinner"></span>
    <p>Carregando dados da API...</p>
  </div>
  <div v-else-if="error" class="list-state error-state">
    <strong>{{ error }}</strong>
    <button class="button secondary" type="button" @click="emit('retry')">Tentar novamente</button>
  </div>
</template>
