<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import ConfirmActionModal from '@/components/ui/ConfirmActionModal.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import ListControls from '@/components/ui/ListControls.vue'
import ListState from '@/components/ui/ListState.vue'
import { useApiAction } from '@/composables/useApiAction'
import { usePagedList } from '@/composables/usePagedList'
import { getErrorMessage } from '@/services/apiClient'
import { leadsService } from '@/services/leadsService'
import { simulacoesService } from '@/services/simulacoesService'
import type { LeadResponse } from '@/types/leads'
import type { SimulacaoResponse } from '@/types/simulacoes'

const route = useRoute()
const router = useRouter()
const leadId = ref('')
const lead = ref<LeadResponse | null>(null)
const leadSearch = ref('')
const leads = ref<LeadResponse[]>([])
const loadingLeads = ref(false)
const leadSearchError = ref<string | null>(null)
const simulacoes = ref<SimulacaoResponse[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const pendingDelete = ref<SimulacaoResponse | null>(null)
const deleting = useApiAction()
const pager = usePagedList(() => simulacoes.value)

const filteredLeads = computed(() => {
  const term = leadSearch.value.trim().toLowerCase()
  if (!term) return leads.value.slice(0, 8)

  return leads.value
    .filter((item) => `${item.nome ?? ''} ${item.telefone ?? ''}`.toLowerCase().includes(term))
    .slice(0, 8)
})

const hasSelectedLead = computed(() => Boolean(leadId.value))

async function load() {
  if (!leadId.value) {
    simulacoes.value = []
    lead.value = null
    return
  }
  loading.value = true
  error.value = null
  try {
    const [leadData, simulacoesData] = await Promise.all([
      leadsService.get!(leadId.value),
      simulacoesService.list(leadId.value),
    ])
    lead.value = leadData
    simulacoes.value = simulacoesData
  } catch (err) {
    error.value = getErrorMessage(err)
  } finally {
    loading.value = false
  }
}

async function searchLeads() {
  loadingLeads.value = true
  leadSearchError.value = null

  try {
    leads.value = await leadsService.list()
  } catch (err) {
    leadSearchError.value = getErrorMessage(err)
  } finally {
    loadingLeads.value = false
  }
}

async function selectLead(selectedLead: LeadResponse) {
  lead.value = selectedLead
  leadId.value = selectedLead.id
  leadSearch.value = `${selectedLead.nome || 'Sem nome'} ${selectedLead.telefone ? `- ${selectedLead.telefone}` : ''}`.trim()
  pager.search.value = ''
  await router.replace({ query: { leadId: selectedLead.id } })
  await load()
}

async function clearLead() {
  leadId.value = ''
  lead.value = null
  simulacoes.value = []
  pager.search.value = ''
  await router.replace({ query: {} })
  await searchLeads()
}

async function confirmDelete() {
  if (!pendingDelete.value) return
  const result = await deleting.run(() => simulacoesService.remove(pendingDelete.value!.id), 'Simulacao removida.')
  if (result !== null) {
    pendingDelete.value = null
    await load()
  }
}

onMounted(() => {
  leadId.value = String(route.query.leadId ?? '')
  load()
  if (!leadId.value) searchLeads()
})
</script>

<template>
  <section class="page-intro">
    <div>
      <span class="section-label">Simulação</span>
      <h2>{{ lead?.nome || 'Simulacoes' }}</h2>
      <p>{{ lead ? `${lead.telefone || 'Telefone nao informado'} · ${lead.quantidadeVidas ?? 0} vidas` : 'Simulacoes vinculadas a um lead.' }}</p>
    </div>
    <div class="action-row">
      <button v-if="hasSelectedLead" class="button secondary" type="button" @click="clearLead">Trocar lead</button>
      <RouterLink v-if="leadId" class="button" :to="{ path: '/simulacoes/novo', query: { leadId } }">Novo</RouterLink>
    </div>
  </section>

  <section class="panel table-panel">
    <div class="panel-header">
      <div><span class="section-label">Registros</span>
        <h3>{{ pager.filteredItems.value.length }} encontrados</h3>
      </div>
    </div>
    <ListState :loading="loading" :error="error" @retry="load" />
    <EmptyState v-if="!loading && !error && pager.pagedItems.value.length === 0"
      :message="leadId ? 'A API retornou uma lista vazia.' : 'Busque e selecione um lead por nome ou telefone para consultar a API.'" />
    <div v-if="!loading && !error && pager.pagedItems.value.length > 0" class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Link</th>
            <th>Aprovada</th>
            <th>Data envio</th>
            <th>Acoes</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in pager.pagedItems.value" :key="item.id">
            <td>{{ item.link || '-' }}</td>
            <td>{{ item.aprovada ? 'Sim' : 'Nao' }}</td>
            <td>{{ item.dataEnvio || '-' }}</td>
            <td class="actions table-actions">
              <RouterLink class="action-button primary-action" :to="`/simulacoes/${item.id}`" aria-label="Abrir simulacao">
                Abrir
              </RouterLink>
              <RouterLink class="action-button" :to="`/simulacoes/${item.id}/editar?leadId=${leadId}`" aria-label="Editar simulacao">
                Editar
              </RouterLink>
              <button class="action-button danger-action" type="button" aria-label="Remover simulacao" @click="pendingDelete = item">
                Remover
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-if="!loading && !error && pager.filteredItems.value.length > 0" class="pagination"><span>Pagina {{
      pager.page.value }} de {{ pager.totalPages.value }}</span><select v-model.number="pager.pageSize.value">
        <option :value="10">10</option>
        <option :value="25">25</option>
        <option :value="50">50</option>
      </select><button type="button" :disabled="pager.page.value === 1" @click="pager.previous">‹</button><button
        type="button" :disabled="pager.page.value === pager.totalPages.value" @click="pager.next">›</button></div>
  </section>
  <ConfirmActionModal v-if="pendingDelete" title="Excluir simulacao"
    message="Esta acao chamara DELETE /api/simulacoes/{id}." confirm-label="Excluir" :loading="deleting.loading.value"
    @cancel="pendingDelete = null" @confirm="confirmDelete" />
</template>
