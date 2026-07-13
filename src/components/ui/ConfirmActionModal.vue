<script setup lang="ts">
defineProps<{
  title: string
  message: string
  confirmLabel?: string
  loading?: boolean
}>()

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()
</script>

<template>
  <div class="modal-backdrop">
    <section class="confirm-modal">
      <h3>{{ title }}</h3>
      <p>{{ message }}</p>
      <div class="form-actions">
        <button class="button secondary" type="button" :disabled="loading" @click="emit('cancel')">Cancelar</button>
        <button class="button danger" type="button" :disabled="loading" @click="emit('confirm')">
          {{ confirmLabel ?? 'Confirmar' }}
        </button>
      </div>
    </section>
  </div>
</template>
