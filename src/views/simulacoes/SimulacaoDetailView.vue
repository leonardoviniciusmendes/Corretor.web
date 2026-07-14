<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import ListState from '@/components/ui/ListState.vue'
import { useApiAction } from '@/composables/useApiAction'
import { getErrorMessage } from '@/services/apiClient'
import { simulacoesService } from '@/services/simulacoesService'
import type { SimulacaoResponse } from '@/types/simulacoes'

const props = defineProps<{ id: string }>()
const item = ref<SimulacaoResponse | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)
const approving = useApiAction()

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

async function approve() {
  if (!item.value || item.value.aprovada) return

  const result = await approving.run(async () => {
    await simulacoesService.update!(item.value!.id, {
      link: item.value!.link,
      aprovada: true,
    })
    return true
  }, 'Simulacao aprovada.')

  if (result) await load()
}

onMounted(load)
</script>

<template>
  <section class="page-intro">
    <div><span class="section-label">Simulacao</span>
      <h2>Detalhe da simulacao</h2>
    </div>
    <div class="action-row">
      <button v-if="item && !item.aprovada" class="button" type="button" :disabled="approving.loading.value" @click="approve">
        {{ approving.loading.value ? 'Aprovando...' : 'Aprovar' }}
      </button>
      <RouterLink v-if="item?.aprovada" class="button" :to="`/simulacoes/${id}/documentacao`">Enviar documentacao
      </RouterLink>
      <RouterLink class="button secondary" :to="`/simulacoes/${id}/editar`">Editar</RouterLink>
      <RouterLink class="button secondary" to="/simulacoes">Voltar</RouterLink>
    </div>
  </section>
  <section class="panel">
    <ListState :loading="loading" :error="error" @retry="load" />
    <p v-if="approving.error.value" class="form-error">{{ approving.error.value }}</p>
    <div v-if="item" class="detail-grid simulation-detail-grid">
   
      <div><small>Link</small><strong>{{ item.link || '-' }}</strong></div>
      <div><small>Data envio</small><strong>{{ item.dataEnvio || '-' }}</strong></div>
      <div><small>Status</small><strong>{{ item.aprovada ? 'Aprovada' : 'Pendente' }}</strong></div>
    </div>
  </section>
</template>
