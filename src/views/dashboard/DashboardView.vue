<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { healthService } from '@/services/healthService'
import { visibleResources } from '@/resources'
import { getErrorMessage } from '@/services/apiClient'

const loading = ref(false)
const apiStatus = ref<'online' | 'offline' | 'checking'>('checking')
const error = ref<string | null>(null)
const apiUrl = import.meta.env.VITE_API_URL

async function checkHealth() {
  loading.value = true
  error.value = null
  apiStatus.value = 'checking'

  try {
    await healthService.check()
    apiStatus.value = 'online'
  } catch (err) {
    apiStatus.value = 'offline'
    error.value = getErrorMessage(err)
  } finally {
    loading.value = false
  }
}

onMounted(checkHealth)
</script>

<template>
  <section class="page-intro">
    <div>
      <span class="section-label">Contrato principal</span>
      <h2>API Corretor</h2>
      <p>Frontend Vue 3 montado sobre os caminhos publicados no Swagger.</p>
    </div>
    <button class="button secondary" type="button" :disabled="loading" @click="checkHealth">Verificar API</button>
  </section>

  <section class="metric-grid">
    <article class="metric-card">
      <span class="metric-icon">A</span>
      <div>
        <span>Status da API</span>
        <strong>{{ apiStatus }}</strong>
        <small>{{ error ?? 'GET /health' }}</small>
      </div>
    </article>
    <article class="metric-card">
      <span class="metric-icon">R</span>
      <div>
        <span>Recursos</span>
        <strong>{{ Object.keys(visibleResources).length }}</strong>
        <small>Modulos mapeados do Swagger</small>
      </div>
    </article>
    <article class="metric-card">
      <span class="metric-icon">U</span>
      <div>
        <span>URL base</span>
        <strong>58507</strong>
        <small>{{ apiUrl }}</small>
      </div>
    </article>
    <article class="metric-card">
      <span class="metric-icon">S</span>
      <div>
        <span>Autenticacao</span>
        <strong>Nao aplicada</strong>
        <small>Swagger nao exige auth</small>
      </div>
    </article>
  </section>

  <section class="dashboard-grid">
    <div class="panel">
      <div class="panel-header">
        <div>
          <span class="section-label">Modulos</span>
          <h3>Telas criadas</h3>
        </div>
      </div>
      <div class="cards-list">
        <article v-for="resource in visibleResources" :key="resource.config.key">
          <div>
            <strong>{{ resource.config.title }}</strong>
            <small>{{ resource.config.description }}</small>
          </div>
          <RouterLink class="button secondary" :to="resource.config.basePath">Abrir</RouterLink>
        </article>
      </div>
    </div>

    <div class="panel">
      <div class="panel-header">
        <div>
          <span class="section-label">Contrato</span>
          <h3>Origem</h3>
        </div>
      </div>
      <p class="muted">Swagger esperado em:</p>
      <p><span class="id-chip">https://localhost:58507/swagger/v1/swagger.json</span></p>
      <p class="muted">Se o navegador bloquear HTTPS local, confie no certificado dev da API ou use a porta HTTP da mesma aplicacao.</p>
    </div>
  </section>
</template>
