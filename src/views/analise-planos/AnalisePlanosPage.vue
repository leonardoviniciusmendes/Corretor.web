<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import AnalisePlanosForm from '@/components/analise-planos/AnalisePlanosForm.vue'
import AnaliseStatusCard from '@/components/analise-planos/AnaliseStatusCard.vue'
import ResultadoAnalisePlanos from '@/components/analise-planos/ResultadoAnalisePlanos.vue'
import ListState from '@/components/ui/ListState.vue'
import { useToast } from '@/composables/useToast'
import { analisePlanosApi } from '@/services/analisePlanosApi'
import { getErrorMessage } from '@/services/apiClient'
import { clientesService } from '@/services/clientesService'
import { dependentesService } from '@/services/dependentesService'
import { enderecosService } from '@/services/enderecosService'
import { faixasEtariasService } from '@/services/faixasEtariasService'
import { leadsService } from '@/services/leadsService'
import { pessoasFisicasService } from '@/services/pessoasFisicasService'
import type { ClienteResponse } from '@/types/clientes'
import type { EnderecoResponse } from '@/types/enderecos'
import type { FaixaEtariaResponse } from '@/types/faixasEtarias'
import type { AnalisePlanosStatusResponse, CriarAnalisePlanosPayload, ResultadoAnalisePlanos as ResultadoAnalisePlanosType } from '@/types/analisePlanos'
import type { LeadResponse } from '@/types/leads'
import type { DependenteResponse, PessoaFisicaResponse } from '@/types/pessoas'

const props = defineProps<{ leadId?: string }>()
const route = useRoute()
const toast = useToast()

const lead = ref<LeadResponse | null>(null)
const cliente = ref<ClienteResponse | null>(null)
const pessoaFisica = ref<PessoaFisicaResponse | null>(null)
const dependentes = ref<DependenteResponse[]>([])
const enderecos = ref<EnderecoResponse[]>([])
const faixasEtarias = ref<FaixaEtariaResponse[]>([])
const contextLoading = ref(false)
const contextError = ref<string | null>(null)
const tokenConsulta = ref<string | null>(null)
const status = ref('')
const loading = ref(false)
const polling = ref(false)
const error = ref<string | null>(null)
const resultado = ref<ResultadoAnalisePlanosType | null>(null)
const formCollapsed = ref(false)
let pollTimer: number | undefined

const activeLeadId = computed(() => props.leadId || String(route.query.leadId ?? ''))
const routeTokenConsulta = computed(() => String(route.query.tokenConsulta ?? ''))
const initialCep = computed(() => enderecos.value[0]?.cep ?? String(route.query.cep ?? ''))
const initialPerfil = computed(() => {
  if (lead.value) return (lead.value.quantidadeVidas ?? 0) > 1 ? 'familiar' : 'individual'
  return String(route.query.perfilCliente ?? '')
})
const initialIdades = computed(() => {
  const idades = [idadePorDataNascimento(pessoaFisica.value?.dataNascimento), ...dependentes.value.map((dependente) => idadePorDataNascimento(dependente.dataNascimento))]
    .filter((idade): idade is number => idade !== null)
  return (idades.length > 0 ? idades : idadesPorFaixasEtarias()).join(', ')
})
const initialNecessidades = computed(() => {
  if (!lead.value) return ''
  return [
    'Cliente avaliando plano de saude.',
    lead.value.operadora ? `Operadora atual/preferida: ${lead.value.operadora}.` : '',
  ].filter(Boolean).join(' ')
})
const initialObservacoes = computed(() => String(route.query.observacoesCorretor ?? ''))
function parseResultadoSalvo(value?: string | null) {
  if (!value) return null
  try {
    return JSON.parse(value) as ResultadoAnalisePlanosType
  } catch {
    return null
  }
}

function idadePorDataNascimento(data?: string | null) {
  if (!data) return null
  const parsed = new Date(data)
  if (Number.isNaN(parsed.getTime())) return null

  const today = new Date()
  let age = today.getFullYear() - parsed.getFullYear()
  const monthDelta = today.getMonth() - parsed.getMonth()
  if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < parsed.getDate())) {
    age -= 1
  }
  return age >= 0 ? age : null
}

function idadeRepresentativaFaixa(faixa?: string | null) {
  if (!faixa) return null
  const numeros = faixa.match(/\d+/g)?.map((item) => Number.parseInt(item, 10)).filter((item) => Number.isFinite(item)) ?? []
  if (numeros.length === 0) return null
  if (numeros.length === 1) return numeros[0]
  return Math.round((numeros[0] + numeros[1]) / 2)
}

function idadesPorFaixasEtarias() {
  return faixasEtarias.value.flatMap((faixa) => {
    const idade = idadeRepresentativaFaixa(faixa.faixa)
    if (idade === null) return []
    return Array.from({ length: Math.max(faixa.quantidade ?? 0, 0) }, () => idade)
  })
}

function clearPoll() {
  if (pollTimer) {
    window.clearTimeout(pollTimer)
    pollTimer = undefined
  }
}

function isConcluido(value: string) {
  return value.trim().toLowerCase() === 'concluido' || value.trim().toLowerCase() === 'concluído'
}

function isErro(value: string) {
  return value.trim().toLowerCase() === 'erro'
}

function readStatus(response: AnalisePlanosStatusResponse) {
  return response.status || ''
}

async function carregarResultado(token: string) {
  loading.value = true
  try {
    resultado.value = await analisePlanosApi.obterResultado(token)
    if (activeLeadId.value) {
      await leadsService.registrarAnalise(activeLeadId.value, {
        tokenConsulta: token,
        retornoAnalise: resultado.value,
      })
    }
    status.value = 'Concluido'
  } catch (err) {
    error.value = getErrorMessage(err)
  } finally {
    loading.value = false
    polling.value = false
  }
}

async function consultarStatus() {
  if (!tokenConsulta.value) return

  try {
    const statusResponse = await analisePlanosApi.obterStatus(tokenConsulta.value)
    const statusAtual = readStatus(statusResponse)
    status.value = statusAtual || 'Analise em processamento'

    if (isConcluido(statusAtual)) {
      clearPoll()
      await carregarResultado(tokenConsulta.value)
      return
    }

    if (isErro(statusAtual)) {
      clearPoll()
      polling.value = false
      error.value = statusResponse.mensagem || statusResponse.erro || 'A analise retornou erro. Tente novamente ou revise os dados enviados.'
      return
    }

    pollTimer = window.setTimeout(consultarStatus, 5000)
  } catch (err) {
    clearPoll()
    polling.value = false
    loading.value = false
    error.value = getErrorMessage(err)
  }
}

async function abrirAnaliseExistente(token: string) {
  clearPoll()
  tokenConsulta.value = token
  error.value = null
  resultado.value = null
  loading.value = true
  polling.value = false
  status.value = 'Consultando analise'

  try {
    const statusResponse = await analisePlanosApi.obterStatus(token)
    const statusAtual = readStatus(statusResponse)
    status.value = statusAtual || 'Analise em processamento'

    if (isConcluido(statusAtual)) {
      await carregarResultado(token)
      return
    }

    if (isErro(statusAtual)) {
      error.value = statusResponse.mensagem || statusResponse.erro || 'A analise retornou erro.'
      loading.value = false
      return
    }

    loading.value = false
    polling.value = true
    pollTimer = window.setTimeout(consultarStatus, 5000)
  } catch (err) {
    error.value = getErrorMessage(err)
    loading.value = false
  }
}

async function criarAnalise(payload: CriarAnalisePlanosPayload) {
  clearPoll()
  loading.value = true
  polling.value = false
  error.value = null
  resultado.value = null
  tokenConsulta.value = null
  status.value = 'Enviando solicitacao'
  formCollapsed.value = true

  try {
    const response = await analisePlanosApi.criarAnalise({
      ...payload,
      leadId: activeLeadId.value || undefined,
      linkSimulacao: '',
    })
    tokenConsulta.value = response.tokenConsulta
    if (activeLeadId.value) {
      await leadsService.registrarAnalise(activeLeadId.value, {
        tokenConsulta: response.tokenConsulta,
        retornoAnalise: '',
      })
    }
    status.value = 'Analise em processamento'
    polling.value = true
    loading.value = false
    pollTimer = window.setTimeout(consultarStatus, 5000)
  } catch (err) {
    status.value = ''
    error.value = getErrorMessage(err)
    loading.value = false
  }
}

async function loadLeadContext() {
  if (!activeLeadId.value) return

  contextLoading.value = true
  contextError.value = null
  try {
    const [leadData, clientesData, faixasData] = await Promise.all([
      leadsService.get!(activeLeadId.value),
      clientesService.list(),
      faixasEtariasService.list(activeLeadId.value),
    ])

    lead.value = leadData
    faixasEtarias.value = faixasData
    cliente.value = clientesData.find((item) => item.leadId === activeLeadId.value) ?? null
    pessoaFisica.value = cliente.value?.pessoaFisicaId ? await pessoasFisicasService.get!(cliente.value.pessoaFisicaId) : null
    dependentes.value = cliente.value?.pessoaFisicaId ? await dependentesService.list(cliente.value.pessoaFisicaId) : []
    enderecos.value = cliente.value ? await enderecosService.list(cliente.value.id) : []

    if (!tokenConsulta.value && leadData.tokenConsultaAnalise) {
      tokenConsulta.value = leadData.tokenConsultaAnalise
      const resultadoSalvo = parseResultadoSalvo(leadData.retornoAnalise)
      if (resultadoSalvo) {
        resultado.value = resultadoSalvo
        status.value = 'Concluido'
        formCollapsed.value = true
      } else {
        await abrirAnaliseExistente(leadData.tokenConsultaAnalise)
      }
    }
  } catch (err) {
    contextError.value = getErrorMessage(err)
  } finally {
    contextLoading.value = false
  }
}

async function copyText(text: string) {
  if (!text) return
  try {
    await navigator.clipboard.writeText(text)
    toast.success('Texto copiado.')
  } catch {
    toast.error('Nao foi possivel copiar automaticamente.')
  }
}

watch(activeLeadId, loadLeadContext)
onMounted(async () => {
  await loadLeadContext()
  if (routeTokenConsulta.value && (!resultado.value || tokenConsulta.value !== routeTokenConsulta.value)) {
    await abrirAnaliseExistente(routeTokenConsulta.value)
  }
})
onBeforeUnmount(clearPoll)
</script>

<template>
  <section class="page-intro">
    <div>
      <span class="section-label">Estrategia comercial</span>
      <h2>Analise de Planos</h2>
      <p v-if="lead">Analise vinculada ao lead {{ lead.nome || lead.id }}.</p>
      <p v-else>Envie os dados, acompanhe o token e consulte automaticamente ate a conclusao.</p>
    </div>
  </section>

  <section v-if="activeLeadId" class="panel lead-analysis-context">
    <ListState :loading="contextLoading" :error="contextError" @retry="loadLeadContext" />
    <div v-if="lead" class="detail-grid">
      <div><small>Lead vinculado</small><strong>{{ lead.nome || '-' }}</strong></div>
      <div><small>Telefone</small><strong>{{ lead.telefone || '-' }}</strong></div>
      <div><small>Vidas</small><strong>{{ lead.quantidadeVidas ?? 0 }}</strong></div>
      <div><small>CEP</small><strong>{{ initialCep || '-' }}</strong></div>
    </div>
  </section>

  <div class="analise-layout">
    <div>
      <button
        class="button secondary form-collapse-toggle"
        type="button"
        @click="formCollapsed = !formCollapsed"
      >
        {{ formCollapsed ? 'Expandir dados da solicitacao' : 'Esconder dados da solicitacao' }}
      </button>
      <AnalisePlanosForm
        :key="activeLeadId || 'standalone'"
        :collapsed="formCollapsed"
        :submitting="loading && !polling"
        :initial-cep="initialCep"
        :initial-perfil="initialPerfil"
        :initial-observacoes="initialObservacoes"
        :initial-idades="initialIdades"
        :initial-necessidades="initialNecessidades"
        @submit="criarAnalise"
      />
    </div>
    <AnaliseStatusCard :token-consulta="tokenConsulta" :status="status" :loading="loading || polling" :error="error" />
  </div>

  <ResultadoAnalisePlanos v-if="resultado" :resultado="resultado" @copy="copyText" />
</template>
