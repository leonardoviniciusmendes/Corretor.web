<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import ListState from '@/components/ui/ListState.vue'
import { getErrorMessage } from '@/services/apiClient'
import { contratosService } from '@/services/contratosService'
import { documentosApprovalStore } from '@/services/documentosApprovalStore'
import { documentosService } from '@/services/documentosService'
import { leadsService } from '@/services/leadsService'
import { simulacoesService } from '@/services/simulacoesService'
import type { ContratoResponse } from '@/types/contratos'
import type { DocumentoResponse } from '@/types/documentos'
import type { LeadResponse } from '@/types/leads'
import type { SimulacaoResponse } from '@/types/simulacoes'

const props = defineProps<{ id: string }>()

const lead = ref<LeadResponse | null>(null)
const simulacoes = ref<SimulacaoResponse[]>([])
const documentos = ref<DocumentoResponse[]>([])
const contratos = ref<ContratoResponse[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

const simulacaoAprovada = computed(() => simulacoes.value.find((simulacao) => simulacao.aprovada) ?? null)
const podeEnviarDocumentos = computed(() => Boolean(simulacaoAprovada.value))
const todosDocumentosAprovados = computed(
  () => documentos.value.length > 0 && documentos.value.every((documento) => documentosApprovalStore.isApproved(documento.id)),
)
const podeVerContratos = computed(() => todosDocumentosAprovados.value)
const etapaAtual = computed(() => {
  if (contratos.value.length > 0) return 'Contrato'
  if (todosDocumentosAprovados.value) return 'Documentacao aprovada'
  if (documentos.value.length > 0) return 'Documentacao pendente'
  if (simulacaoAprovada.value) return 'Simulacao aprovada'
  if (simulacoes.value.length > 0) return 'Simulacao pendente'
  return 'Lead cadastrado'
})

async function load() {
  loading.value = true
  error.value = null
  try {
    const [leadData, simulacoesData, documentosData, contratosData] = await Promise.all([
      leadsService.get!(props.id),
      simulacoesService.list(props.id),
      documentosService.list(props.id),
      contratosService.list(props.id),
    ])

    lead.value = leadData
    simulacoes.value = simulacoesData
    documentos.value = documentosData
    contratos.value = contratosData
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
    <div>
      <span class="section-label">Lead</span>
      <h2>Detalhe do lead</h2>
    </div>
    <div class="action-row">
      <RouterLink class="button secondary" :to="{ path: '/simulacoes', query: { leadId: id } }">Simulacoes</RouterLink>
      <RouterLink v-if="podeEnviarDocumentos && simulacaoAprovada" class="button secondary" :to="`/simulacoes/${simulacaoAprovada.id}/documentacao`">Documentos</RouterLink>
      <RouterLink v-if="podeVerContratos" class="button secondary" :to="{ path: '/contratos', query: { leadId: id } }">Contratos</RouterLink>
      <RouterLink class="button" :to="`/leads/${id}/editar`">Editar</RouterLink>
      <RouterLink class="button secondary" to="/leads">Voltar</RouterLink>
    </div>
  </section>

  <section class="panel">
    <ListState :loading="loading" :error="error" @retry="load" />
    <div v-if="lead" class="detail-grid">
      <div><small>Etapa atual</small><strong>{{ etapaAtual }}</strong></div>
      <div><small>Nome</small><strong>{{ lead.nome || '-' }}</strong></div>
      <div><small>Telefone</small><strong>{{ lead.telefone || '-' }}</strong></div>
      <div><small>Quantidade de vidas</small><strong>{{ lead.quantidadeVidas ?? 0 }}</strong></div>
      <div><small>Operadora</small><strong>{{ lead.operadora || '-' }}</strong></div>
      <div><small>Email</small><strong>{{ lead.email || '-' }}</strong></div>
    </div>
  </section>
</template>
