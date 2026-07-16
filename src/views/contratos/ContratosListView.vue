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
import { contratosService } from '@/services/contratosService'
import type { ContratoResponse } from '@/types/contratos'

const props = defineProps<{ leadId: string }>()
const contratos = ref<ContratoResponse[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const pendingDelete = ref<ContratoResponse | null>(null)
const deleting = useApiAction()
const pager = usePagedList(() => contratos.value)

async function load() {
  if (!props.leadId) {
    contratos.value = []
    return
  }
  loading.value = true
  error.value = null
  try {
    contratos.value = await contratosService.list(props.leadId)
  } catch (err) {
    error.value = getErrorMessage(err)
  } finally {
    loading.value = false
  }
}

async function confirmDelete() {
  if (!pendingDelete.value) return
  const result = await deleting.run(() => contratosService.remove(pendingDelete.value!.id), 'Contrato removido.')
  if (result !== null) {
    pendingDelete.value = null
    await load()
  }
}

onMounted(load)
</script>

<template>
  <section class="page-intro">
    <div><span class="section-label">Contrato</span><h2>Contratos</h2><p>Contratos vinculados a um lead.</p></div>
    <RouterLink class="button" :to="`/leads/${props.leadId}/contratos/novo`">Novo</RouterLink>
  </section>
  <ListControls v-model="pager.search.value" />
  <section class="panel table-panel">
    <div class="panel-header"><div><span class="section-label">Registros</span><h3>{{ pager.filteredItems.value.length }} encontrados</h3></div><small>GET /api/leads/{leadId}/contratos</small></div>
    <ListState :loading="loading" :error="error" @retry="load" />
    <EmptyState v-if="!loading && !error && pager.pagedItems.value.length === 0" message="Este lead ainda nao possui contrato." />
    <div v-if="!loading && !error && pager.pagedItems.value.length > 0" class="table-wrap">
      <table>
        <thead><tr><th>ID</th><th>Lead ID</th><th>Acoes</th></tr></thead>
        <tbody>
          <tr v-for="contrato in pager.pagedItems.value" :key="contrato.id">
            <td><span class="id-chip">{{ contrato.id.slice(0, 8) }}</span></td>
            <td>{{ contrato.leadId }}</td>
            <td class="actions"><RouterLink :to="`/contratos/${contrato.id}`">Detalhe</RouterLink><button class="button secondary" type="button" @click="pendingDelete = contrato">Excluir</button></td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-if="!loading && !error && pager.filteredItems.value.length > 0" class="pagination"><span>Pagina {{ pager.page.value }} de {{ pager.totalPages.value }}</span><select v-model.number="pager.pageSize.value"><option :value="10">10</option><option :value="25">25</option><option :value="50">50</option></select><button type="button" :disabled="pager.page.value === 1" @click="pager.previous">‹</button><button type="button" :disabled="pager.page.value === pager.totalPages.value" @click="pager.next">›</button></div>
  </section>
  <ConfirmActionModal v-if="pendingDelete" title="Excluir contrato" message="Esta acao chamara DELETE /api/contratos/{id}." confirm-label="Excluir" :loading="deleting.loading.value" @cancel="pendingDelete = null" @confirm="confirmDelete" />
</template>
