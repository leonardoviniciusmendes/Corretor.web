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
import { scriptsService } from '@/services/scriptsService'
import type { ScriptResponse } from '@/types/scripts'

const scripts = ref<ScriptResponse[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const pendingDelete = ref<ScriptResponse | null>(null)
const deleting = useApiAction()
const pager = usePagedList(() => scripts.value)

async function load() {
  loading.value = true
  error.value = null
  try {
    scripts.value = await scriptsService.list()
  } catch (err) {
    error.value = getErrorMessage(err)
  } finally {
    loading.value = false
  }
}

async function confirmDelete() {
  if (!pendingDelete.value) return
  const result = await deleting.run(() => scriptsService.remove(pendingDelete.value!.id), 'Script removido.')
  if (result !== null) {
    pendingDelete.value = null
    await load()
  }
}

onMounted(load)
</script>

<template>
  <section class="page-intro">
    <div><span class="section-label">Script</span><h2>Scripts</h2><p>Mensagens e roteiros por etapa.</p></div>
    <RouterLink class="button" to="/scripts/novo">Novo</RouterLink>
  </section>
  <ListControls v-model="pager.search.value" />
  <section class="panel table-panel">
    <div class="panel-header"><div><span class="section-label">Registros</span><h3>{{ pager.filteredItems.value.length }} encontrados</h3></div><small>GET /api/scripts</small></div>
    <ListState :loading="loading" :error="error" @retry="load" />
    <EmptyState v-if="!loading && !error && pager.pagedItems.value.length === 0" />
    <div v-if="!loading && !error && pager.pagedItems.value.length > 0" class="table-wrap">
      <table>
        <thead><tr><th>ID</th><th>Etapa</th><th>Tipo</th><th>Mensagem</th><th>Acoes</th></tr></thead>
        <tbody>
          <tr v-for="script in pager.pagedItems.value" :key="script.id">
            <td><span class="id-chip">{{ script.id.slice(0, 8) }}</span></td>
            <td>{{ script.etapa || '-' }}</td>
            <td>{{ script.tipo || '-' }}</td>
            <td>{{ script.mensagem || '-' }}</td>
            <td class="actions">
              <RouterLink :to="`/scripts/${script.id}`">Detalhe</RouterLink>
              <RouterLink :to="`/scripts/${script.id}/editar`">Editar</RouterLink>
              <button class="button secondary" type="button" @click="pendingDelete = script">Excluir</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-if="!loading && !error && pager.filteredItems.value.length > 0" class="pagination">
      <span>Pagina {{ pager.page.value }} de {{ pager.totalPages.value }}</span>
      <select v-model.number="pager.pageSize.value"><option :value="10">10</option><option :value="25">25</option><option :value="50">50</option></select>
      <button type="button" :disabled="pager.page.value === 1" @click="pager.previous">‹</button>
      <button type="button" :disabled="pager.page.value === pager.totalPages.value" @click="pager.next">›</button>
    </div>
  </section>
  <ConfirmActionModal v-if="pendingDelete" title="Excluir script" message="Esta acao chamara DELETE /api/scripts/{id}." confirm-label="Excluir" :loading="deleting.loading.value" @cancel="pendingDelete = null" @confirm="confirmDelete" />
</template>
