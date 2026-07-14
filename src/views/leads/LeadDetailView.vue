<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import ListState from '@/components/ui/ListState.vue'
import { clientesService } from '@/services/clientesService'
import { getErrorMessage } from '@/services/apiClient'
import { contratosService } from '@/services/contratosService'
import { dependentesService } from '@/services/dependentesService'
import { documentosApprovalStore } from '@/services/documentosApprovalStore'
import { documentosService } from '@/services/documentosService'
import { enderecosService } from '@/services/enderecosService'
import { leadsService } from '@/services/leadsService'
import { pessoasFisicasService } from '@/services/pessoasFisicasService'
import { simulacoesService } from '@/services/simulacoesService'
import type { ClienteResponse } from '@/types/clientes'
import type { ContratoResponse } from '@/types/contratos'
import type { DocumentoResponse } from '@/types/documentos'
import type { EnderecoResponse } from '@/types/enderecos'
import type { LeadResponse } from '@/types/leads'
import type { DependenteResponse, PessoaFisicaResponse } from '@/types/pessoas'
import type { SimulacaoResponse } from '@/types/simulacoes'

const props = defineProps<{ id: string }>()

const lead = ref<LeadResponse | null>(null)
const simulacoes = ref<SimulacaoResponse[]>([])
const documentos = ref<DocumentoResponse[]>([])
const contratos = ref<ContratoResponse[]>([])
const cliente = ref<ClienteResponse | null>(null)
const pessoaFisica = ref<PessoaFisicaResponse | null>(null)
const dependentes = ref<DependenteResponse[]>([])
const enderecos = ref<EnderecoResponse[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

const simulacaoAprovada = computed(() => simulacoes.value.find((simulacao) => simulacao.aprovada) ?? null)
const podeEnviarDocumentos = computed(() => Boolean(simulacaoAprovada.value))
const todosDocumentosAprovados = computed(
  () => documentos.value.length > 0 && documentos.value.every((documento) => documentosApprovalStore.isApproved(documento.id)),
)
const podeVerContratos = computed(() => todosDocumentosAprovados.value)
const etapaAtual = computed(() => {
  if (contratos.value.length > 0) return 'Contrato'
  if (todosDocumentosAprovados.value) return 'Documentacao aprovada'
  if (documentos.value.length > 0) return 'Documentacao pendente'
  if (simulacaoAprovada.value) return 'Simulacao aprovada'
  if (simulacoes.value.length > 0) return 'Simulacao pendente'
  return 'Lead cadastrado'
})
const clienteTelefoneDiferente = computed(() => Boolean(pessoaFisica.value?.telefone && pessoaFisica.value.telefone !== lead.value?.telefone))
const clienteEmailDiferente = computed(() => Boolean(pessoaFisica.value?.email && pessoaFisica.value.email !== lead.value?.email))

function anoNascimento(data?: string | null) {
  if (!data) return '-'
  const match = data.match(/\d{4}/)
  return match?.[0] ?? '-'
}

function nomeDependente(dependente: DependenteResponse) {
  return dependente.nomeCompleto || dependente.nome || dependente.cpf || '-'
}

async function load() {
  loading.value = true
  error.value = null
  try {
    const [leadData, simulacoesData, documentosData, contratosData, clientesData] = await Promise.all([
      leadsService.get!(props.id),
      simulacoesService.list(props.id),
      documentosService.list(props.id),
      contratosService.list(props.id),
      clientesService.list(),
    ])

    lead.value = leadData
    simulacoes.value = simulacoesData
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
      <RouterLink class="button secondary" :to="{ path: '/simulacoes', query: { leadId: id } }">Simulacoes</RouterLink>
      <RouterLink v-if="podeEnviarDocumentos && simulacaoAprovada" class="button secondary" :to="`/simulacoes/${simulacaoAprovada.id}/documentacao`">Documentos</RouterLink>
      <RouterLink v-if="podeVerContratos" class="button secondary" :to="{ path: '/contratos', query: { leadId: id } }">Contratos</RouterLink>
      <RouterLink class="button" :to="`/leads/${id}/editar`">Editar</RouterLink>
      <RouterLink class="button secondary" to="/leads">Voltar</RouterLink>
    </div>
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
