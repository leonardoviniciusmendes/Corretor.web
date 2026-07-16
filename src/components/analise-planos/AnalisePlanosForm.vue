<script setup lang="ts">
import { reactive, watch } from 'vue'
import type { CriarAnalisePlanosPayload, TipoTabela } from '@/types/analisePlanos'

const props = defineProps<{
  submitting?: boolean
  collapsed?: boolean
  status?: string
  tokenConsulta?: string | null
  initialCep?: string
  initialPerfil?: string
  initialObservacoes?: string
  initialIdades?: string
  initialNecessidades?: string
}>()

const emit = defineEmits<{
  submit: [payload: CriarAnalisePlanosPayload]
  toggle: []
}>()

const tiposTabela: TipoTabela[] = ['Adesao', 'Familiar', 'Individual', 'PmeEmpresarial', 'AdesaoPmeEmpresarial', 'NaoInformado']

const form = reactive({
  idades: props.initialIdades ?? '',
  necessidadesCliente: props.initialNecessidades ?? '',
  perfilCliente: props.initialPerfil ?? '',
  cep: props.initialCep ?? '',
  tipoTabela: 'Adesao' as TipoTabela,
  observacoesCorretor: props.initialObservacoes ?? '',
})

watch(
  () => [props.initialCep, props.initialPerfil, props.initialObservacoes, props.initialIdades, props.initialNecessidades],
  () => {
    form.cep = props.initialCep ?? ''
    form.perfilCliente = props.initialPerfil ?? ''
    form.observacoesCorretor = props.initialObservacoes ?? ''
    form.idades = props.initialIdades ?? ''
    form.necessidadesCliente = props.initialNecessidades ?? ''
  },
)

function parseLines(value: string) {
  return value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function parseIdades(value: string) {
  return value
    .split(/[,\s;]+/)
    .map((item) => Number.parseInt(item.trim(), 10))
    .filter((idade) => Number.isFinite(idade) && idade >= 0)
}

function submit() {
  emit('submit', {
    idades: parseIdades(form.idades),
    necessidadesCliente: parseLines(form.necessidadesCliente),
    perfilCliente: form.perfilCliente.trim(),
    prioridadeVenda: '',
    cep: form.cep.trim(),
    operadorasPreferidas: [],
    tipoTabela: form.tipoTabela,
    observacoesCorretor: form.observacoesCorretor.trim(),
  })
}
</script>

<template>
  <form class="panel form-panel analise-form" :class="{ collapsed }" @submit.prevent="submit">
    <div class="panel-header">
      <div>
        <span class="section-label">Solicitacao</span>
        <h3>Dados para analise comercial</h3>
      </div>
      <div v-if="status || tokenConsulta" class="solicitation-status-inline">
        <span>Status: <strong>{{ status || '-' }}</strong></span>
        <span v-if="tokenConsulta">Token: <strong class="id-chip">{{ tokenConsulta }}</strong></span>
      </div>
      <button class="button secondary" type="button" @click="emit('toggle')">
        {{ collapsed ? 'Expandir' : 'Esconder' }}
      </button>
    </div>

    <slot name="status"></slot>

    <div v-if="!collapsed" class="form-grid">
      <label class="field">
        Idades
        <input v-model="form.idades" required placeholder="12, 42, 45" />
      </label>
      <label class="field">
        Tipo de tabela
        <select v-model="form.tipoTabela">
          <option v-for="tipo in tiposTabela" :key="tipo" :value="tipo">{{ tipo }}</option>
        </select>
      </label>
      <label class="field">
        Perfil do cliente
        <input v-model="form.perfilCliente" placeholder="familiar" />
      </label>
      <label class="field">
        CEP
        <input v-model="form.cep" inputmode="numeric" placeholder="Opcional" />
      </label>
      <label class="field full">
        Necessidades do cliente
        <textarea v-model="form.necessidadesCliente" required placeholder="Uma necessidade por linha"></textarea>
      </label>
      <label class="field full">
        Observacoes do corretor
        <textarea v-model="form.observacoesCorretor" placeholder="Contexto adicional para a estrategia"></textarea>
      </label>
    </div>

    <div v-if="!collapsed" class="form-actions">
      <button class="button" type="submit" :disabled="submitting">
        {{ submitting ? 'Enviando...' : 'Enviar analise' }}
      </button>
    </div>
  </form>
</template>
