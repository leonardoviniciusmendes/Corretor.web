<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import ListState from '@/components/ui/ListState.vue'
import { getErrorMessage } from '@/services/apiClient'
import { scriptsService } from '@/services/scriptsService'
import type { ScriptResponse } from '@/types/scripts'

const props = defineProps<{ id: string }>()
const script = ref<ScriptResponse | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

async function load() {
  loading.value = true
  error.value = null
  try {
    script.value = await scriptsService.get!(props.id)
  } catch (err) {
    error.value = getErrorMessage(err)
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <section class="page-intro">
    <div><span class="section-label">Script</span><h2>Detalhe do script</h2><p>GET /api/scripts/{id}</p></div>
    <div class="action-row"><RouterLink class="button" :to="`/scripts/${id}/editar`">Editar</RouterLink><RouterLink class="button secondary" to="/scripts">Voltar</RouterLink></div>
  </section>
  <section class="panel">
    <ListState :loading="loading" :error="error" @retry="load" />
    <div v-if="script" class="detail-grid">
      <div><small>ID</small><strong>{{ script.id }}</strong></div>
      <div><small>Etapa</small><strong>{{ script.etapa || '-' }}</strong></div>
      <div><small>Tipo</small><strong>{{ script.tipo || '-' }}</strong></div>
      <div><small>Mensagem</small><strong>{{ script.mensagem || '-' }}</strong></div>
    </div>
  </section>
</template>
