<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { RankingPlano } from '@/types/analisePlanos'

const props = defineProps<{ ranking?: RankingPlano[] | null }>()

const expandedCards = ref<Set<number>>(new Set([0]))
const comparisonCollapsed = ref(false)
const showTechnicalTable = ref(false)
const technicalPage = ref(1)
const technicalPageSize = ref(5)

watch(
  () => props.ranking,
  () => {
    expandedCards.value = new Set([0])
    showTechnicalTable.value = false
    technicalPage.value = 1
  },
)

const technicalTotal = computed(() => props.ranking?.length ?? 0)
const technicalTotalPages = computed(() => Math.max(Math.ceil(technicalTotal.value / technicalPageSize.value), 1))
const pagedRanking = computed(() => {
  const ranking = props.ranking ?? []
  const start = (technicalPage.value - 1) * technicalPageSize.value
  return ranking.slice(start, start + technicalPageSize.value)
})

watch(technicalPageSize, () => {
  technicalPage.value = 1
})

function money(value: number | null | undefined) {
  if (value === null || value === undefined) return '-'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

function normalizeKey(key: string) {
  return key
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
}

function isFilled(value: unknown) {
  return value !== undefined && value !== null && value !== ''
}

function compact(value: unknown): string {
  if (!isFilled(value)) return '-'
  if (Array.isArray(value)) return value.map(compact).filter((item) => item !== '-').join(', ')
  if (typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>)
      .map(([key, item]) => `${key}: ${compact(item)}`)
      .join(' | ')
  }
  return String(value)
}

function valueFrom(source: unknown, keys: string[], deep = false): unknown {
  if (!source || typeof source !== 'object') return undefined

  const normalizedKeys = keys.map(normalizeKey)
  const entries = Object.entries(source as Record<string, unknown>)
  const direct = entries.find(([key, value]) => normalizedKeys.includes(normalizeKey(key)) && isFilled(value))
  if (direct) return direct[1]

  if (!deep) return undefined

  for (const [, value] of entries) {
    if (!value || typeof value !== 'object') continue

    if (Array.isArray(value)) {
      for (const entry of value) {
        const nested = valueFrom(entry, keys, true)
        if (isFilled(nested)) return nested
      }
    } else {
      const nested = valueFrom(value, keys, true)
      if (isFilled(nested)) return nested
    }
  }

  return undefined
}

function faixaValue(item: RankingPlano) {
  return valueFrom(item, [
    'valoresPorFaixaEtaria',
    'valoresPorFaixa',
    'faixasEtarias',
    'faixas',
    'idades',
    'valorPorFaixaEtaria',
    'valoresFaixaEtaria',
  ])
}

function faixaEntries(item: RankingPlano) {
  const value = faixaValue(item)
  if (!value) return []

  if (Array.isArray(value)) {
    return value.map((entry) => compact(entry)).filter((entry) => entry !== '-')
  }

  if (typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>).map(([key, entry]) => `${key}: ${compact(entry)}`)
  }

  return [String(value)]
}

function totalHospitais(item: RankingPlano) {
  return item.hospitais ?? 0
}

function totalClinicas(item: RankingPlano) {
  return item.clinicas ?? 0
}

function totalLaboratorios(item: RankingPlano) {
  return item.laboratorios ?? 0
}

function totalPrestadores(item: RankingPlano) {
  return item.totalPrestadores ?? 0
}

function sampleText(value?: string[] | null) {
  return value?.length ? value.join(', ') : 'Detalhamento nao disponivel'
}

function score(value: number | null | undefined) {
  return value === null || value === undefined ? '-' : value
}

function isExpanded(index: number) {
  return expandedCards.value.has(index)
}

function toggleCard(index: number) {
  const next = new Set(expandedCards.value)
  if (next.has(index)) {
    next.delete(index)
  } else {
    next.add(index)
  }
  expandedCards.value = next
}
</script>

<template>
  <section class="panel table-panel ranking-panel">
    <div class="panel-header">
      <div>
        <span class="section-label">Comparativo</span>
        <h3>Comparativo para apresentacao</h3>
      </div>
      <button class="button secondary" type="button" @click="comparisonCollapsed = !comparisonCollapsed">
        {{ comparisonCollapsed ? 'Expandir' : 'Esconder' }}
      </button>
    </div>

    <div v-if="ranking?.length && !comparisonCollapsed" class="ranking-comparison">
      <article v-for="(item, index) in ranking" :key="`${item.operadora}-${item.plano}-${index}`" class="ranking-card">
        <button class="ranking-card-head" type="button" :aria-expanded="isExpanded(index)" @click="toggleCard(index)">
          <span class="ranking-position">#{{ item.posicao ?? index + 1 }}</span>
          <div>
            <strong>{{ item.plano || '-' }}</strong>
            <small>{{ item.operadora || '-' }} - {{ item.tipoTabela || '-' }}</small>
          </div>
          <b>{{ money(item.valorTotal) }}</b>
          <span class="collapse-indicator">{{ isExpanded(index) ? '-' : '+' }}</span>
        </button>

        <div class="ranking-metrics">
          <div><small>Hospitais</small><strong>{{ totalHospitais(item) }}</strong></div>
          <div><small>Clinicas</small><strong>{{ totalClinicas(item) }}</strong></div>
          <div><small>Labs</small><strong>{{ totalLaboratorios(item) }}</strong></div>
          <div><small>Prestadores</small><strong>{{ totalPrestadores(item) }}</strong></div>
        </div>

        <div class="ranking-scores">
          <span>Cliente {{ score(item.notaCliente) }}</span>
          <span>Venda {{ score(item.notaVenda) }}</span>
          <span>Custo-beneficio {{ score(item.notaCustoBeneficio) }}</span>
        </div>

        <div v-if="isExpanded(index)" class="ranking-card-details">
          <div class="ranking-faixas">
            <small>Valores por faixa etaria</small>
            <div v-if="faixaEntries(item).length" class="chip-list">
              <span v-for="faixa in faixaEntries(item)" :key="faixa">{{ faixa }}</span>
            </div>
            <p v-else class="muted">Sem faixas retornadas pela API.</p>
          </div>

          <div class="ranking-network">
            <div>
              <small>Hospitais</small>
              <p>{{ sampleText(item.amostraHospitais) }}</p>
            </div>
            <div>
              <small>Clinicas</small>
              <p>{{ sampleText(item.amostraClinicas) }}</p>
            </div>
            <div>
              <small>Laboratorios</small>
              <p>{{ sampleText(item.amostraLaboratorios) }}</p>
            </div>
          </div>

          <p v-if="item.papelComercial" class="commercial-role">{{ item.papelComercial }}</p>
          <p v-if="item.motivoNaoEscolhidoParaCorretor" class="ranking-reason">{{ item.motivoNaoEscolhidoParaCorretor }}</p>
          <a v-if="item.linkSimulacao" class="button secondary ranking-link" :href="item.linkSimulacao" target="_blank" rel="noreferrer">
            Abrir simulacao
          </a>
        </div>
      </article>
    </div>

    <p v-else-if="!ranking?.length" class="empty-row">Nenhum item no ranking.</p>
  </section>

  <section v-if="ranking?.length" class="panel table-panel ranking-panel ranking-technical-panel">
    <div class="panel-header">
      <div>
        <span class="section-label">Conferencia</span>
        <h3>Comparativo tecnico completo</h3>
        <small>Tabela detalhada para conferencia interna</small>
      </div>
      <button class="button secondary" type="button" :aria-expanded="showTechnicalTable" @click="showTechnicalTable = !showTechnicalTable">
        {{ showTechnicalTable ? 'Esconder' : 'Expandir' }}
      </button>
    </div>

    <div v-if="showTechnicalTable" class="table-wrap ranking-table-wrap">
      <table>
        <thead>
          <tr class="table-group-row">
            <th colspan="5">Plano</th>
            <th colspan="5">Rede e valores</th>
            <th colspan="3">Notas</th>
            <th colspan="3">Decisao comercial</th>
          </tr>
          <tr>
            <th>Rank</th>
            <th>Plano indicado</th>
            <th>Operadora</th>
            <th>Tabela</th>
            <th>Mensalidade</th>
            <th>Faixas etarias</th>
            <th>Hospitais</th>
            <th>Clinicas</th>
            <th>Laboratorios</th>
            <th>Total rede</th>
            <th>Cliente</th>
            <th>Venda</th>
            <th>Custo/beneficio</th>
            <th>Papel comercial</th>
            <th>Observacao</th>
            <th>Simulacao</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in pagedRanking" :key="`${item.operadora}-${item.plano}-table-${index}`">
            <td>{{ item.posicao ?? ((technicalPage - 1) * technicalPageSize) + index + 1 }}</td>
            <td>{{ item.plano || '-' }}</td>
            <td>{{ item.operadora || '-' }}</td>
            <td>{{ item.tipoTabela || '-' }}</td>
            <td>{{ money(item.valorTotal) }}</td>
            <td>{{ compact(faixaValue(item)) }}</td>
            <td>{{ totalHospitais(item) }}</td>
            <td>{{ totalClinicas(item) }}</td>
            <td>{{ totalLaboratorios(item) }}</td>
            <td>{{ totalPrestadores(item) }}</td>
            <td>{{ item.notaCliente ?? '-' }}</td>
            <td>{{ item.notaVenda ?? '-' }}</td>
            <td>{{ item.notaCustoBeneficio ?? '-' }}</td>
            <td>{{ item.papelComercial || '-' }}</td>
            <td>{{ item.motivoNaoEscolhidoParaCorretor || '-' }}</td>
            <td>
              <a v-if="item.linkSimulacao" :href="item.linkSimulacao" target="_blank" rel="noreferrer">Abrir</a>
              <span v-else>-</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-if="showTechnicalTable" class="technical-pagination">
      <span>{{ technicalTotal }} item(ns)</span>
      <label>
        Por pagina
        <select v-model.number="technicalPageSize">
          <option :value="5">5</option>
          <option :value="10">10</option>
          <option :value="20">20</option>
        </select>
      </label>
      <button type="button" :disabled="technicalPage <= 1" @click="technicalPage--">Anterior</button>
      <strong>{{ technicalPage }} / {{ technicalTotalPages }}</strong>
      <button type="button" :disabled="technicalPage >= technicalTotalPages" @click="technicalPage++">Proxima</button>
    </div>
  </section>
</template>
