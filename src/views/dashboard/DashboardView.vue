<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { clientesService } from '@/services/clientesService'
import { leadsService } from '@/services/leadsService'
import { getErrorMessage } from '@/services/apiClient'

const loading = ref(false)
const error = ref<string | null>(null)
const totalLeads = ref(0)
const totalClientes = ref(0)

async function loadDashboard() {
  loading.value = true
  error.value = null

  try {
    const [leads, clientes] = await Promise.all([
      leadsService.list(),
      clientesService.list(),
    ])
    totalLeads.value = leads.length
    totalClientes.value = clientes.length
  } catch (err) {
    error.value = getErrorMessage(err)
  } finally {
    loading.value = false
  }
}

onMounted(loadDashboard)
</script>

<template>
  <section class="page-intro">
    <div>
      <span class="section-label">Dashboard</span>
      <h2>Resumo comercial</h2>
      <p>Quantidade atual de leads e clientes cadastrados.</p>
    </div>
    <button class="button secondary" type="button" :disabled="loading" @click="loadDashboard">
      {{ loading ? 'Atualizando...' : 'Atualizar' }}
    </button>
  </section>

  <p v-if="error" class="form-error">{{ error }}</p>

  <section class="metric-grid dashboard-metrics">
    <article class="metric-card">
      <span class="metric-icon">L</span>
      <div>
        <span>Leads</span>
        <strong>{{ totalLeads }}</strong>
        <small>GET /api/leads</small>
      </div>
    </article>
    <article class="metric-card">
      <span class="metric-icon">C</span>
      <div>
        <span>Clientes</span>
        <strong>{{ totalClientes }}</strong>
        <small>GET /api/clientes</small>
      </div>
    </article>
  </section>
</template>
