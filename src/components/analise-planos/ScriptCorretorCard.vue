<script setup lang="ts">
import type { AnaliseCorretor } from '@/types/analisePlanos'

const props = defineProps<{ analise?: AnaliseCorretor | null }>()

const emit = defineEmits<{
  copy: [text: string]
}>()

const sections: { key: keyof AnaliseCorretor; title: string }[] = [
  { key: 'argumentosDeVenda', title: 'Argumentos de venda' },
  { key: 'pontosDeAtencao', title: 'Pontos de atencao' },
  { key: 'perguntasParaQualificar', title: 'Perguntas para qualificar' },
  { key: 'comoConduzirConversa', title: 'Como conduzir a conversa' },
]

function asList(value: string[] | string | null | undefined) {
  if (Array.isArray(value)) return value.filter(Boolean)
  return value ? [value] : []
}

function scriptText() {
  const analise = props.analise
  if (!analise) return ''
  return [
    analise.resumoEstrategico,
    ...asList(analise.argumentosDeVenda),
    ...asList(analise.pontosDeAtencao),
    ...asList(analise.perguntasParaQualificar),
    ...asList(analise.comoConduzirConversa),
  ]
    .filter(Boolean)
    .join('\n\n')
}
</script>

<template>
  <section class="panel copy-card">
    <div class="panel-header compact">
      <div>
        <span class="section-label">Corretor</span>
        <h3>Script de venda</h3>
      </div>
      <button class="button secondary" type="button" :disabled="!scriptText()" @click="emit('copy', scriptText())">Copiar</button>
    </div>
    <div v-if="analise" class="script-grid">
      <p v-if="analise.resumoEstrategico">{{ analise.resumoEstrategico }}</p>
      <div v-for="section in sections" :key="section.key">
        <h4>{{ section.title }}</h4>
        <ul>
          <li v-for="item in asList(analise[section.key])" :key="item">{{ item }}</li>
        </ul>
      </div>
    </div>
    <p v-else class="muted">Nenhum script retornado.</p>
  </section>
</template>
