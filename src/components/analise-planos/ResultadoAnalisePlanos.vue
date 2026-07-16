<script setup lang="ts">
import RankingPlanosTable from './RankingPlanosTable.vue'
import MensagemWhatsAppCard from './MensagemWhatsAppCard.vue'
import ScriptCorretorCard from './ScriptCorretorCard.vue'
import ObjecoesCard from './ObjecoesCard.vue'
import type { PlanoResumo, ResultadoAnalisePlanos } from '@/types/analisePlanos'

defineProps<{ resultado: ResultadoAnalisePlanos }>()

const emit = defineEmits<{
  copy: [text: string]
}>()

function money(value: number | null | undefined) {
  if (value === null || value === undefined) return null
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

function title(value: PlanoResumo | string | null | undefined) {
  if (!value) return '-'
  if (typeof value === 'string') return value
  return [value.operadora, value.plano].filter(Boolean).join(' - ') || value.papelComercial || '-'
}

function details(value: PlanoResumo | string | null | undefined) {
  if (!value || typeof value === 'string') return []
  return [
    value.tipoTabela,
    money(value.valorTotal),
    value.papelComercial,
    value.justificativa,
    value.motivo,
  ].filter((item): item is string => Boolean(item))
}
</script>

<template>
  <div class="resultado-analise">
    <section class="strategy-grid">
      <article class="panel strategy-card">
        <span class="section-label">Venda</span>
        <h3>Melhor para o corretor vender</h3>
        <strong>{{ title(resultado.melhorParaCorretorVender) }}</strong>
        <small v-for="(item, index) in details(resultado.melhorParaCorretorVender)" :key="`${item}-${index}`">{{ item }}</small>
      </article>
      <article class="panel strategy-card">
        <span class="section-label">Cliente</span>
        <h3>Melhor custo-beneficio</h3>
        <strong>{{ title(resultado.estrategiaFechamento?.custoBeneficio ?? resultado.melhorParaCliente) }}</strong>
        <small v-for="(item, index) in details(resultado.estrategiaFechamento?.custoBeneficio ?? resultado.melhorParaCliente)" :key="`${item}-${index}`">{{ item }}</small>
      </article>
      <article class="panel strategy-card">
        <span class="section-label">Premium</span>
        <h3>Premium / mais caro</h3>
        <strong>{{ title(resultado.estrategiaFechamento?.maisCaroPremium) }}</strong>
        <small v-for="(item, index) in details(resultado.estrategiaFechamento?.maisCaroPremium)" :key="`${item}-${index}`">{{ item }}</small>
      </article>
      <article class="panel strategy-card">
        <span class="section-label">Meio termo</span>
        <h3>Intermediario</h3>
        <strong>{{ title(resultado.estrategiaFechamento?.intermediario) }}</strong>
        <small v-for="(item, index) in details(resultado.estrategiaFechamento?.intermediario)" :key="`${item}-${index}`">{{ item }}</small>
      </article>
      <article class="panel strategy-card">
        <span class="section-label">Entrada</span>
        <h3>Mais barato</h3>
        <strong>{{ title(resultado.estrategiaFechamento?.maisBarato ?? resultado.maisEconomico) }}</strong>
        <small v-for="(item, index) in details(resultado.estrategiaFechamento?.maisBarato ?? resultado.maisEconomico)" :key="`${item}-${index}`">{{ item }}</small>
      </article>
      <article class="panel strategy-card">
        <span class="section-label">Rede</span>
        <h3>Melhor rede</h3>
        <strong>{{ title(resultado.melhorRede) }}</strong>
        <small v-for="(item, index) in details(resultado.melhorRede)" :key="`${item}-${index}`">{{ item }}</small>
      </article>
    </section>

    <RankingPlanosTable :ranking="resultado.ranking" />
    <MensagemWhatsAppCard
      :apresentacao="resultado.mensagensCliente?.apresentacaoOpcoes"
      :fechamento="resultado.mensagensCliente?.fechamento"
      @copy="emit('copy', $event)"
    />
    <ScriptCorretorCard :analise="resultado.analiseCorretor" @copy="emit('copy', $event)" />
    <ObjecoesCard :objecoes="resultado.objecoes" :alertas="resultado.alertas" />
  </div>
</template>
