<script setup lang="ts">
import { ref, watch } from 'vue'
import type { RankingPlano } from '@/types/analisePlanos'

const props = defineProps<{ ranking?: RankingPlano[] | null }>()

const expandedCards = ref<Set<number>>(new Set([0]))
const showTechnicalTable = ref(false)

watch(
  () => props.ranking,
  () => {
    expandedCards.value = new Set([0])
    showTechnicalTable.value = false
  },
)

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

function listFrom(item: RankingPlano, keys: string[]) {
  const value = valueFrom(item, keys, true)
  if (Array.isArray(value)) return value.map((entry) => (typeof entry === 'string' ? entry : compact(entry))).filter(Boolean)
  if (typeof value === 'string') return value.split(/[,;\n]/).map((entry) => entry.trim()).filter(Boolean)
  return []
}

function numberFrom(item: RankingPlano, keys: string[]) {
  const value = valueFrom(item, keys, true)
  if (typeof value === 'number') return value
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

function categoryMatches(value: unknown, categories: string[]) {
  if (typeof value !== 'string') return false
  const normalized = normalizeKey(value)
  return categories.some((category) => normalized.includes(normalizeKey(category)))
}

function providerName(value: Record<string, unknown>) {
  const name = valueFrom(value, ['nome', 'nomePrestador', 'prestador', 'razaoSocial', 'descricao'])
  return typeof name === 'string' && name.trim() ? name.trim() : null
}

function categorizedProvidersFrom(source: unknown, categories: string[], result = new Set<string>()) {
  if (!source || typeof source !== 'object') return result

  if (Array.isArray(source)) {
    for (const entry of source) categorizedProvidersFrom(entry, categories, result)
    return result
  }

  const record = source as Record<string, unknown>
  const typeValue = valueFrom(record, ['tipo', 'categoria', 'tipoPrestador', 'classificacao', 'grupo'])
  if (categoryMatches(typeValue, categories)) {
    result.add(providerName(record) ?? compact(record))
  }

  for (const value of Object.values(record)) {
    if (value && typeof value === 'object') categorizedProvidersFrom(value, categories, result)
  }

  return result
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

function hospitalList(item: RankingPlano) {
  const direct = listFrom(item, ['hospitais', 'hospitaisCredenciados', 'redeHospitalar'])
  return direct.length ? direct : Array.from(categorizedProvidersFrom(item, ['hospital']))
}

function clinicList(item: RankingPlano) {
  const direct = listFrom(item, ['clinicas', 'clinicasCredenciadas', 'redeClinica'])
  return direct.length ? direct : Array.from(categorizedProvidersFrom(item, ['clinica']))
}

function labList(item: RankingPlano) {
  const direct = listFrom(item, ['laboratorios', 'labs', 'laboratoriosCredenciados', 'redeLaboratorial'])
  return direct.length ? direct : Array.from(categorizedProvidersFrom(item, ['laboratorio', 'lab']))
}

function totalHospitais(item: RankingPlano) {
  return numberFrom(item, ['totalHospitais', 'quantidadeHospitais', 'qtdHospitais']) ?? hospitalList(item).length
}

function totalClinicas(item: RankingPlano) {
  return numberFrom(item, ['totalClinicas', 'quantidadeClinicas', 'qtdClinicas']) ?? clinicList(item).length
}

function totalLaboratorios(item: RankingPlano) {
  return numberFrom(item, ['totalLaboratorios', 'quantidadeLaboratorios', 'qtdLaboratorios', 'totalLabs', 'qtdLabs']) ?? labList(item).length
}

function totalPrestadores(item: RankingPlano) {
  return numberFrom(item, ['totalPrestadores', 'quantidadePrestadores', 'qtdPrestadores'])
    ?? totalHospitais(item) + totalClinicas(item) + totalLaboratorios(item)
}

function joinList(value: string[]) {
  return value.length ? value.join(', ') : '-'
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
    </div>

    <div v-if="ranking?.length" class="ranking-comparison">
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
              <p>{{ joinList(hospitalList(item)) }}</p>
            </div>
            <div>
              <small>Clinicas</small>
              <p>{{ joinList(clinicList(item)) }}</p>
            </div>
            <div>
              <small>Laboratorios</small>
              <p>{{ joinList(labList(item)) }}</p>
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

    <div v-if="ranking?.length" class="ranking-technical">
      <button class="technical-toggle" type="button" :aria-expanded="showTechnicalTable" @click="showTechnicalTable = !showTechnicalTable">
        <span>
          <strong>Comparativo tecnico completo</strong>
          <small>Tabela detalhada para conferencia interna</small>
        </span>
        <b>{{ showTechnicalTable ? '-' : '+' }}</b>
      </button>
    </div>

    <div v-if="ranking?.length && showTechnicalTable" class="table-wrap ranking-table-wrap">
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
          <tr v-for="(item, index) in ranking" :key="`${item.operadora}-${item.plano}-table-${index}`">
            <td>{{ item.posicao ?? index + 1 }}</td>
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
    <p v-else class="empty-row">Nenhum item no ranking.</p>
  </section>
</template>
