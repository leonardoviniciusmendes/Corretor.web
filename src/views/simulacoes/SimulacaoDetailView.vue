<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import ListState from '@/components/ui/ListState.vue'
import { getErrorMessage } from '@/services/apiClient'
import { simulacoesService } from '@/services/simulacoesService'
import type { SimulacaoResponse } from '@/types/simulacoes'

const props = defineProps<{ id: string }>()
const item = ref<SimulacaoResponse | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

async function load() {
  loading.value = true
  error.value = null
  try {
    item.value = await simulacoesService.get!(props.id)
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
    <div><span class="section-label">Simulacao</span>
      <h2>Detalhe da simulacao</h2>
    </div>
    <div class="action-row">
      <RouterLink v-if="item?.aprovada" class="button" :to="`/simulacoes/${id}/documentacao`">Enviar documentacao
      </RouterLink>
      <RouterLink class="button secondary" :to="`/simulacoes/${id}/editar`">Editar</RouterLink>
      <RouterLink class="button secondary" to="/simulacoes">Voltar</RouterLink>
    </div>
  </section>
  <section class="panel">
    <ListState :loading="loading" :error="error" @retry="load" />
    <div v-if="item" class="detail-grid">
   
      <div><small>Link</small><strong>{{ item.link || '-' }}</strong></div>
      <div><small>Aprovada</small><strong>{{ item.aprovada ? 'Sim' : 'Nao' }}</strong></div>
      <div><small>Data envio</small><strong>{{ item.dataEnvio || '-' }}</strong></div>
    </div>
  </section>
</template>
