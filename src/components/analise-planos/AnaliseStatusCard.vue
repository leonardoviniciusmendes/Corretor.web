<script setup lang="ts">
defineProps<{
  tokenConsulta: string | null
  status: string
  loading: boolean
  error: string | null
  embedded?: boolean
}>()
</script>

<template>
  <section v-if="tokenConsulta || loading || error" class="status-card" :class="{ panel: !embedded, embedded }">
    <div v-if="loading" class="spinner"></div>
    <div>
      <span class="section-label">Status</span>
      <h3>{{ status || 'Aguardando envio' }}</h3>
      <p v-if="tokenConsulta">Token: <span class="id-chip">{{ tokenConsulta }}</span></p>
      <p v-if="error" class="status-error">{{ error }}</p>
    </div>
  </section>
</template>
