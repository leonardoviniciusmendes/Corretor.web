<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import EmptyState from '@/components/ui/EmptyState.vue'
import ListState from '@/components/ui/ListState.vue'
import { getErrorMessage } from '@/services/apiClient'
import { leadsService } from '@/services/leadsService'
import { simulacoesService } from '@/services/simulacoesService'
import type { LeadResponse } from '@/types/leads'
import type { SimulacaoResponse } from '@/types/simulacoes'

const router = useRouter()
const leadSearch = ref('')
const leads = ref<LeadResponse[]>([])
const selectedLead = ref<LeadResponse | null>(null)
const simulacoes = ref<SimulacaoResponse[]>([])
const loadingLeads = ref(false)
const loadingSimulacoes = ref(false)
const error = ref<string | null>(null)

const filteredLeads = computed(() => {
  const term = leadSearch.value.trim().toLowerCase()
  if (!term) return leads.value.slice(0, 8)

  return leads.value
    .filter((lead) => `${lead.nome ?? ''} ${lead.telefone ?? ''}`.toLowerCase().includes(term))
    .slice(0, 8)
})

const simulacoesAprovadas = computed(() => simulacoes.value.filter((simulacao) => simulacao.aprovada))

async function searchLeads() {
  loadingLeads.value = true
  error.value = null

  try {
    leads.value = await leadsService.list()
  } catch (err) {
    error.value = getErrorMessage(err)
  } finally {
    loadingLeads.value = false
  }
}

async function selectLead(lead: LeadResponse) {
  selectedLead.value = lead
  leadSearch.value = `${lead.nome || 'Sem nome'} ${lead.telefone ? `- ${lead.telefone}` : ''}`.trim()
  loadingSimulacoes.value = true
  error.value = null

  try {
    simulacoes.value = await simulacoesService.list(lead.id)
  } catch (err) {
    error.value = getErrorMessage(err)
  } finally {
    loadingSimulacoes.value = false
  }
}

async function openDocumentacao(simulacao: SimulacaoResponse) {
  await router.push(`/simulacoes/${simulacao.id}/documentacao`)
}

onMounted(searchLeads)
</script>

<template>
  <section class="page-intro">
    <div>
      <span class="section-label">Documentacao</span>
      <h2>Envio de documentos</h2>
      <p>Selecione um lead e uma simulacao aprovada para enviar documentos.</p>
    </div>
  </section>

  <section class="filter-box">
    <div class="filter-content">
      <label class="field">
        Buscar lead
        <input v-model="leadSearch" placeholder="Nome ou telefone do lead" @keyup.enter="searchLeads" />
      </label>
      <button class="button" type="button" :disabled="loadingLeads" @click="searchLeads">
        {{ loadingLeads ? 'Buscando...' : 'Buscar' }}
      </button>
    </div>
    <div v-if="filteredLeads.length > 0" class="cards-list" style="padding: 0 18px 16px;">
      <article v-for="lead in filteredLeads" :key="lead.id">
        <div>
          <strong>{{ lead.nome || 'Sem nome' }}</strong>
          <small>{{ lead.telefone || 'Telefone nao informado' }} · {{ lead.quantidadeVidas ?? 0 }} vidas</small>
        </div>
        <button class="button secondary" type="button" @click="selectLead(lead)">Selecionar</button>
      </article>
    </div>
  </section>

  <section class="panel table-panel">
    <div class="panel-header">
      <div>
        <span class="section-label">Simulacoes aprovadas</span>
        <h3>{{ selectedLead?.nome || 'Nenhum lead selecionado' }}</h3>
      </div>
      <small>GET /api/leads/{leadId}/simulacoes</small>
    </div>

    <ListState :loading="loadingSimulacoes" :error="error" @retry="selectedLead && selectLead(selectedLead)" />
    <EmptyState
      v-if="!loadingSimulacoes && !error && simulacoesAprovadas.length === 0"
      :title="selectedLead ? 'Nenhuma simulacao aprovada' : 'Selecione um lead'"
      :message="selectedLead ? 'Este lead ainda nao possui simulacao aprovada para envio de documentos.' : 'Busque por nome ou telefone para iniciar o envio.'"
    />

    <div v-if="!loadingSimulacoes && !error && simulacoesAprovadas.length > 0" class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Link</th>
            <th>Data envio</th>
            <th>Acoes</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="simulacao in simulacoesAprovadas" :key="simulacao.id">
            <td><span class="id-chip">{{ simulacao.id.slice(0, 8) }}</span></td>
            <td>{{ simulacao.link || '-' }}</td>
            <td>{{ simulacao.dataEnvio || '-' }}</td>
            <td class="actions">
              <button class="button" type="button" @click="openDocumentacao(simulacao)">Enviar documentos</button>
              <RouterLink :to="`/simulacoes/${simulacao.id}`">Detalhe</RouterLink>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
