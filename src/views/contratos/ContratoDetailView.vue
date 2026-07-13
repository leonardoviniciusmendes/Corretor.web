<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import ListState from '@/components/ui/ListState.vue'
import { getErrorMessage } from '@/services/apiClient'
import { contratosService } from '@/services/contratosService'
import type { ContratoResponse } from '@/types/contratos'

const props = defineProps<{ id: string }>()
const contrato = ref<ContratoResponse | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

async function load() {
  loading.value = true
  error.value = null
  try {
    contrato.value = await contratosService.get!(props.id)
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
    <div><span class="section-label">Contrato</span>
      <h2>Detalhe do contrato</h2>
      <p>GET /api/contratos/{id}</p>
    </div>
    <RouterLink class="button secondary" to="/contratos">Voltar</RouterLink>
  </section>
  <section class="panel">
    <ListState :loading="loading" :error="error" @retry="load" />
    <div v-if="contrato" class="detail-grid">
      <div><small>ID</small><strong>{{ contrato.id }}</strong></div>
      <div><small>Lead ID</small><strong>{{ contrato.leadId }}</strong></div>
    </div>
  </section>
</template>
