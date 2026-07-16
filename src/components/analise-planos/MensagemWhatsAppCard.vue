<script setup lang="ts">
defineProps<{ apresentacao?: string | null; fechamento?: string | null }>()

const emit = defineEmits<{
  copy: [text: string]
}>()
</script>

<template>
  <section class="panel copy-card">
    <div class="panel-header compact">
      <div>
        <span class="section-label">WhatsApp</span>
        <h3>Mensagem pronta</h3>
      </div>
      <button class="button secondary" type="button" :disabled="!apresentacao && !fechamento" @click="emit('copy', [apresentacao, fechamento].filter(Boolean).join('\n\n'))">
        Copiar
      </button>
    </div>
    <p v-if="apresentacao">{{ apresentacao }}</p>
    <p v-if="fechamento">{{ fechamento }}</p>
    <p v-if="!apresentacao && !fechamento" class="muted">Nenhuma mensagem retornada.</p>
  </section>
</template>
