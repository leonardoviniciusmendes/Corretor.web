<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import ListState from '@/components/ui/ListState.vue'
import { useToast } from '@/composables/useToast'
import { clientesService } from '@/services/clientesService'
import { getErrorMessage } from '@/services/apiClient'
import { contratosService } from '@/services/contratosService'
import { dependentesService } from '@/services/dependentesService'
import { documentosApprovalStore } from '@/services/documentosApprovalStore'
import { documentosService } from '@/services/documentosService'
import { enderecosService } from '@/services/enderecosService'
import { leadsService } from '@/services/leadsService'
import { pessoasFisicasService } from '@/services/pessoasFisicasService'
import type { ClienteResponse } from '@/types/clientes'
import type { ContratoResponse } from '@/types/contratos'
import type { DocumentoResponse } from '@/types/documentos'
import type { EnderecoResponse } from '@/types/enderecos'
import type { LeadResponse } from '@/types/leads'
import type { ResultadoAnalisePlanos } from '@/types/analisePlanos'
import type { DependenteResponse, PessoaFisicaResponse } from '@/types/pessoas'

const props = defineProps<{ id: string }>()
const toast = useToast()

const lead = ref<LeadResponse | null>(null)
const documentos = ref<DocumentoResponse[]>([])
const contratos = ref<ContratoResponse[]>([])
const cliente = ref<ClienteResponse | null>(null)
const pessoaFisica = ref<PessoaFisicaResponse | null>(null)
const dependentes = ref<DependenteResponse[]>([])
const enderecos = ref<EnderecoResponse[]>([])
const analiseToken = ref<string | null>(null)
const resultadoAnalise = ref<ResultadoAnalisePlanos | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

const temAnalisePlanos = computed(() => Boolean(analiseToken.value))
const todosDocumentosAprovados = computed(
  () => documentos.value.length > 0 && documentos.value.every((documento) => documentosApprovalStore.isApproved(documento.id)),
)
const podeVerContratos = computed(() => todosDocumentosAprovados.value)
const etapaAtual = computed(() => {
  if (contratos.value.length > 0) return 'Contrato'
  if (todosDocumentosAprovados.value) return 'Documentacao aprovada'
  if (documentos.value.length > 0) return 'Documentacao pendente'
  if (temAnalisePlanos.value) return 'Analise de planos'
  return 'Lead cadastrado'
})
const etapas = computed(() => [
  {
    key: 'lead',
    title: 'Cadastro do lead',
    status: 'Concluido',
    detail: lead.value?.nome || 'Lead cadastrado',
    complete: true,
    active: false,
  },
  {
    key: 'analise',
    title: 'Analise de planos',
    status: temAnalisePlanos.value ? 'Gerada' : 'Pendente',
    detail: temAnalisePlanos.value ? `Token ${analiseToken.value}` : 'Gerar estrategia comercial para o lead',
    complete: temAnalisePlanos.value,
    active: !temAnalisePlanos.value,
    to: temAnalisePlanos.value
      ? { path: `/leads/${props.id}/analise-planos`, query: { tokenConsulta: analiseToken.value } }
      : `/leads/${props.id}/analise-planos`,
    action: temAnalisePlanos.value ? 'Ver analise' : 'Gerar analise',
  },
  {
    key: 'documentos',
    title: 'Documentos',
    status: todosDocumentosAprovados.value ? 'Aprovados' : documentos.value.length > 0 ? 'Em andamento' : 'Pendente',
    detail: documentos.value.length > 0 ? `${documentos.value.length} documento(s)` : 'Enviar documentos do cliente',
    complete: todosDocumentosAprovados.value,
    active: temAnalisePlanos.value && !todosDocumentosAprovados.value,
    to: { path: '/documentacao', query: { leadId: props.id } },
    action: documentos.value.length > 0 ? 'Ver documentos' : 'Enviar documentos',
  },
  {
    key: 'contrato',
    title: 'Contrato',
    status: contratos.value.length > 0 ? 'Gerado' : 'Pendente',
    detail: contratos.value.length > 0 ? `${contratos.value.length} contrato(s)` : 'Disponivel apos documentos aprovados',
    complete: contratos.value.length > 0,
    active: todosDocumentosAprovados.value && contratos.value.length === 0,
    to: { path: '/contratos', query: { leadId: props.id } },
    action: contratos.value.length > 0 ? 'Ver contrato' : 'Criar contrato',
  },
])
const clienteTelefoneDiferente = computed(() => Boolean(pessoaFisica.value?.telefone && pessoaFisica.value.telefone !== lead.value?.telefone))
const clienteEmailDiferente = computed(() => Boolean(pessoaFisica.value?.email && pessoaFisica.value.email !== lead.value?.email))
const mensagemInicialCliente = computed(() => resultadoAnalise.value?.mensagensCliente?.apresentacaoOpcoes?.trim() ?? '')

function parseResultadoAnalise(value?: string | null) {
  if (!value) return null
  try {
    return JSON.parse(value) as ResultadoAnalisePlanos
  } catch {
    return null
  }
}

function anoNascimento(data?: string | null) {
  if (!data) return '-'
  const match = data.match(/\d{4}/)
  return match?.[0] ?? '-'
}

function nomeDependente(dependente: DependenteResponse) {
  return dependente.nomeCompleto || dependente.nome || dependente.cpf || '-'
}

async function copiarMensagemInicial() {
  if (!mensagemInicialCliente.value) return
  try {
    await navigator.clipboard.writeText(mensagemInicialCliente.value)
    toast.success('Mensagem copiada.')
  } catch {
    toast.error('Nao foi possivel copiar automaticamente.')
  }
}

async function load() {
  loading.value = true
  error.value = null
  try {
    const [leadData, documentosData, contratosData, clientesData] = await Promise.all([
      leadsService.get!(props.id),
      documentosService.list(props.id),
      contratosService.list(props.id),
      clientesService.list(),
    ])

    lead.value = leadData
    analiseToken.value = leadData.tokenConsultaAnalise ?? null
    resultadoAnalise.value = parseResultadoAnalise(leadData.retornoAnalise)
    documentos.value = documentosData
    contratos.value = contratosData
    cliente.value = clientesData.find((item) => item.leadId === props.id) ?? null
    pessoaFisica.value = cliente.value?.pessoaFisicaId ? await pessoasFisicasService.get!(cliente.value.pessoaFisicaId) : null
    dependentes.value = cliente.value?.pessoaFisicaId ? await dependentesService.list(cliente.value.pessoaFisicaId) : []
    enderecos.value = cliente.value ? await enderecosService.list(cliente.value.id) : []
  } catch (err) {
    error.value = getErrorMessage(err)
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <section class="page-intro">
    <div>
      <span class="section-label">Lead</span>
      <h2>Detalhe do lead</h2>
    </div>
    <div class="action-row">
      <RouterLink class="button secondary" :to="`/leads/${id}/analise-planos`">Gerar analise de planos</RouterLink>
      <RouterLink v-if="podeVerContratos" class="button secondary" :to="{ path: '/contratos', query: { leadId: id } }">Contratos</RouterLink>
      <RouterLink class="button" :to="`/leads/${id}/editar`">Editar</RouterLink>
      <RouterLink class="button secondary" to="/leads">Voltar</RouterLink>
    </div>
  </section>

  <section class="lead-steps">
    <article
      v-for="(etapa, index) in etapas"
      :key="etapa.key"
      class="lead-step"
      :class="{ complete: etapa.complete, active: etapa.active }"
    >
      <span class="step-index">{{ index + 1 }}</span>
      <div>
        <small>{{ etapa.status }}</small>
        <strong>{{ etapa.title }}</strong>
        <p>{{ etapa.detail }}</p>
      </div>
      <RouterLink v-if="'to' in etapa && etapa.to" class="action-button" :to="etapa.to">{{ etapa.action }}</RouterLink>
    </article>
  </section>

  <section v-if="mensagemInicialCliente" class="panel lead-message-panel">
    <div class="panel-header">
      <div>
        <span class="section-label">Mensagem inicial</span>
        <h3>Mensagem para o cliente</h3>
      </div>
      <button class="button secondary" type="button" @click="copiarMensagemInicial">Copiar</button>
    </div>
    <p>{{ mensagemInicialCliente }}</p>
  </section>

  <section class="panel">
    <ListState :loading="loading" :error="error" @retry="load" />
    <div v-if="lead" class="detail-grid">
      <div><small>Etapa atual</small><strong>{{ etapaAtual }}</strong></div>
      <div><small>Nome</small><strong>{{ lead.nome || '-' }}</strong></div>
      <div><small>Telefone</small><strong>{{ lead.telefone || '-' }}</strong></div>
      <div><small>Quantidade de vidas</small><strong>{{ lead.quantidadeVidas ?? 0 }}</strong></div>
      <div><small>Operadora</small><strong>{{ lead.operadora || '-' }}</strong></div>
      <div><small>Email</small><strong>{{ lead.email || '-' }}</strong></div>
      <div v-if="cliente"><small>Cliente</small><strong>Cadastrado</strong></div>
      <div v-if="cliente"><small>CPF do cliente</small><strong>{{ pessoaFisica?.cpf || '-' }}</strong></div>
      <div v-if="cliente && pessoaFisica?.faixaEtaria"><small>Faixa etaria</small><strong>{{ pessoaFisica.faixaEtaria }}</strong></div>
      <div v-if="cliente && clienteTelefoneDiferente"><small>Telefone do cliente</small><strong>{{ pessoaFisica?.telefone }}</strong></div>
      <div v-if="cliente && clienteEmailDiferente"><small>Email do cliente</small><strong>{{ pessoaFisica?.email }}</strong></div>
      <div v-if="cliente" class="detail-grid-full">
        <div class="panel-header compact">
          <div>
            <span class="section-label">Dependentes</span>
            <h3>{{ dependentes.length }} vinculados</h3>
          </div>
        </div>
        <div v-if="dependentes.length === 0" class="empty-row">Nenhum dependente vinculado.</div>
        <div v-else class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Ano</th>
                <th>Vinculo</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="dependente in dependentes" :key="dependente.id">
                <td>{{ nomeDependente(dependente) }}</td>
                <td>{{ anoNascimento(dependente.dataNascimento) }}</td>
                <td>{{ dependente.tipoParentesco || '-' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <template v-for="(endereco, index) in enderecos" :key="endereco.id">
        <div><small>{{ enderecos.length > 1 ? `Endereco ${index + 1}` : 'Endereco' }}</small><strong>{{ endereco.logradouro || '-' }}</strong></div>
        <div><small>Cidade/UF</small><strong>{{ [endereco.cidade, endereco.estado].filter(Boolean).join(' / ') || '-' }}</strong></div>
        <div><small>CEP</small><strong>{{ endereco.cep || '-' }}</strong></div>
      </template>
    </div>
  </section>
</template>
