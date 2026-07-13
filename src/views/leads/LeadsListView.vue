<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import ConfirmActionModal from '@/components/ui/ConfirmActionModal.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import ListControls from '@/components/ui/ListControls.vue'
import ListState from '@/components/ui/ListState.vue'
import { useApiAction } from '@/composables/useApiAction'
import { usePagedList } from '@/composables/usePagedList'
import { getErrorMessage } from '@/services/apiClient'
import { leadsService } from '@/services/leadsService'
import type { LeadResponse } from '@/types/leads'

const leads = ref<LeadResponse[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const pendingDelete = ref<LeadResponse | null>(null)
const deleting = useApiAction()
const pager = usePagedList(() => leads.value)

async function load() {
  loading.value = true
  error.value = null
  try {
    leads.value = await leadsService.list()
  } catch (err) {
    error.value = getErrorMessage(err)
  } finally {
    loading.value = false
  }
}

async function confirmDelete() {
  if (!pendingDelete.value) return
  const result = await deleting.run(() => leadsService.remove(pendingDelete.value!.id), 'Lead removido.')
  if (result !== null) {
    pendingDelete.value = null
    await load()
  }
}

onMounted(load)
</script>

<template>
  <section class="page-intro">
    <div>
      <span class="section-label">Lead</span>
      <h2>Leads/Clientes</h2>
      <p>Cadastro operacional de leads e clientes.</p>
    </div>
    <RouterLink class="button" to="/leads/novo">Novo lead/cliente</RouterLink>
  </section>

  <ListControls v-model="pager.search.value" />

  <section class="panel table-panel">
    <div class="panel-header">
      <div>
        <span class="section-label">Registros</span>
        <h3>{{ pager.filteredItems.value.length }} encontrados</h3>
      </div>
    </div>

    <ListState :loading="loading" :error="error" @retry="load" />
    <EmptyState v-if="!loading && !error && pager.pagedItems.value.length === 0" />

    <div v-if="!loading && !error && pager.pagedItems.value.length > 0" class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Nome</th>
            <th>Telefone</th>
            <th>Vidas</th>
            <th>Operadora</th>
            <th>Email</th>
            <th>Acoes</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="lead in pager.pagedItems.value" :key="lead.id">
            <td>{{ lead.nome || '-' }}</td>
            <td>{{ lead.telefone || '-' }}</td>
            <td>{{ lead.quantidadeVidas ?? 0 }}</td>
            <td>{{ lead.operadora || '-' }}</td>
            <td>{{ lead.email || '-' }}</td>
            <td class="actions table-actions">
              <RouterLink class="action-button primary-action" :to="`/leads/${lead.id}`" :aria-label="`Abrir ${lead.nome || 'lead'}`">
                Abrir
              </RouterLink>
              <RouterLink class="action-button" :to="`/leads/${lead.id}/editar`" :aria-label="`Editar ${lead.nome || 'lead'}`">
                Editar
              </RouterLink>
              <button class="action-button danger-action" type="button" :aria-label="`Remover ${lead.nome || 'lead'}`" @click="pendingDelete = lead">
                Remover
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="!loading && !error && pager.filteredItems.value.length > 0" class="pagination">
      <span>Pagina {{ pager.page.value }} de {{ pager.totalPages.value }}</span>
      <select v-model.number="pager.pageSize.value">
        <option :value="10">10</option>
        <option :value="25">25</option>
        <option :value="50">50</option>
      </select>
      <button type="button" :disabled="pager.page.value === 1" @click="pager.previous">‹</button>
      <button type="button" :disabled="pager.page.value === pager.totalPages.value" @click="pager.next">›</button>
    </div>
  </section>

  <ConfirmActionModal
    v-if="pendingDelete"
    title="Excluir lead"
    message="Esta acao chamara DELETE /api/leads/{id} e recarregara a lista."
    confirm-label="Excluir"
    :loading="deleting.loading.value"
    @cancel="pendingDelete = null"
    @confirm="confirmDelete"
  />
</template>
