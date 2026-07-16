<script setup lang="ts">
import type { ObjecaoVenda } from '@/types/analisePlanos'

defineProps<{ objecoes?: ObjecaoVenda[] | string[] | string | null; alertas?: string[] | string | null }>()

function asList(value: ObjecaoVenda[] | string[] | string | null | undefined) {
  if (Array.isArray(value)) return value
  return value ? [value] : []
}

function alertaList(value: string[] | string | null | undefined) {
  if (Array.isArray(value)) return value
  return value ? [value] : []
}

function objecaoTitulo(item: ObjecaoVenda | string) {
  return typeof item === 'string' ? item : item.objecao ?? item.objeção ?? 'Objecao'
}

function objecaoResposta(item: ObjecaoVenda | string) {
  return typeof item === 'string' ? '' : item.resposta ?? ''
}
</script>

<template>
  <section class="panel">
    <div class="panel-header compact">
      <div>
        <span class="section-label">Negociacao</span>
        <h3>Objecoes e respostas</h3>
      </div>
    </div>
    <div v-if="asList(objecoes).length" class="cards-list objection-list">
      <article v-for="(item, index) in asList(objecoes)" :key="index">
        <div>
          <strong>{{ objecaoTitulo(item) }}</strong>
          <small v-if="objecaoResposta(item)">{{ objecaoResposta(item) }}</small>
        </div>
      </article>
    </div>
    <p v-else class="muted">Nenhuma objecao retornada.</p>

    <div v-if="alertaList(alertas).length" class="alerts-list">
      <h4>Alertas</h4>
      <ul>
        <li v-for="alerta in alertaList(alertas)" :key="alerta">{{ alerta }}</li>
      </ul>
    </div>
  </section>
</template>
