<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import EmptyState from '@/components/ui/EmptyState.vue'
import ListState from '@/components/ui/ListState.vue'
import { useApiAction } from '@/composables/useApiAction'
import { getErrorMessage } from '@/services/apiClient'
import { clientesService } from '@/services/clientesService'
import { documentosApprovalStore } from '@/services/documentosApprovalStore'
import { documentosExternosService } from '@/services/documentosExternosService'
import { documentosExternosStore } from '@/services/documentosExternosStore'
import { documentosService } from '@/services/documentosService'
import { leadsService } from '@/services/leadsService'
import { pessoasFisicasService } from '@/services/pessoasFisicasService'
import { simulacoesService } from '@/services/simulacoesService'
import {
  type DocumentoResponse,
  type DocumentoUploadRequest,
  papelDocumentoOpcoes,
  tipoDocumentoOpcoes,
  tipoParentescoOpcoes,
  type PapelDocumento,
  type TipoDocumento,
  type TipoParentesco,
} from '@/types/documentos'
import type { ClienteResponse } from '@/types/clientes'
import type { LeadResponse } from '@/types/leads'
import type { SimulacaoResponse } from '@/types/simulacoes'

const props = defineProps<{ id: string }>()

const loading = ref(false)
const error = ref<string | null>(null)
const simulacao = ref<SimulacaoResponse | null>(null)
const lead = ref<LeadResponse | null>(null)
const documentos = ref<DocumentoResponse[]>([])
const clientes = ref<ClienteResponse[]>([])
const viewingDocumento = ref<DocumentoResponse | null>(null)
const previewUrl = ref<string | null>(null)
const previewContentType = ref<string | null>(null)
const previewLoading = ref(false)
const previewError = ref<string | null>(null)
const externalLoading = ref(false)
const externalError = ref<string | null>(null)
const activeTab = ref<'documentos' | 'cliente'>('documentos')
const clienteDocumentoId = ref('')
const confirmClienteCreation = ref(false)
const action = useApiAction()
const clienteAction = useApiAction()
const tiposIdentificacaoTitular: TipoDocumento[] = ['RG', 'CPF', 'CNH']
const tiposEndereco: TipoDocumento[] = [
  'ComprovanteResidencia',
  'ContaLuz',
  'ContaAgua',
  'ContaTelefone',
  'ContaInternet',
  'ContaGas',
  'FaturaCartaoCredito',
  'ExtratoBancario',
  'ContratoLocacao',
  'IPTU',
]

const form = reactive<{
  tipo: TipoDocumento | ''
  papel: PapelDocumento | ''
  tipoParentesco: TipoParentesco | ''
  cpf: string
  cpfDependente: string
  cnpj: string
  arquivo: File | null
}>({
  tipo: '',
  papel: '',
  tipoParentesco: '',
  cpf: '',
  cpfDependente: '',
  cnpj: '',
  arquivo: null,
})

const clienteForm = reactive({
  nome: '',
  cpf: '',
  email: '',
  telefone: '',
  faixaEtaria: '',
})

const canSend = computed(() => Boolean(simulacao.value?.aprovada && simulacao.value.leadId))
const isEndereco = computed(() => tiposEndereco.includes(form.tipo as TipoDocumento))
const isDependente = computed(() => form.papel === 'Dependente')
const isEmpresa = computed(() => form.papel === 'Empresa')
const cpfObrigatorio = computed(() => isEndereco.value || isDependente.value)
const identificacaoTitularEnviada = computed(() =>
  documentos.value.some((documento) => documento.papel === 'Titular' && ['RG', 'CPF', 'CNH'].includes(documento.tipo)),
)
const canPreviewInline = computed(() => {
  const contentType = previewContentType.value ?? viewingDocumento.value?.contentType ?? ''
  return contentType.startsWith('application/pdf') || contentType.startsWith('image/')
})
const isPreviewImage = computed(() => (previewContentType.value ?? viewingDocumento.value?.contentType ?? '').startsWith('image/'))
const clienteExistente = computed(() => clientes.value.find((cliente) => cliente.leadId === simulacao.value?.leadId) ?? null)
const documentosIdentificacao = computed(() => documentos.value.filter((documento) => ['RG', 'CPF', 'CNH'].includes(documento.tipo)))
const selectedClienteDocumento = computed(() => documentos.value.find((documento) => documento.id === clienteDocumentoId.value) ?? documentosIdentificacao.value[0] ?? null)
const dadosClienteExtraidos = computed(() => {
  const documento = selectedClienteDocumento.value
  if (!documento) return null
  return getDocumentoExterno(documento)?.dadosExtraidos?.identificacao ?? null
})

async function load() {
  loading.value = true
  error.value = null

  try {
    const simulacaoData = await simulacoesService.get!(props.id)
    simulacao.value = simulacaoData

    const [leadData, documentosData, clientesData] = await Promise.all([
      leadsService.get!(simulacaoData.leadId),
      documentosService.list(simulacaoData.leadId),
      clientesService.list(),
    ])

    lead.value = leadData
    documentos.value = documentosData
    clientes.value = clientesData
    if (!clienteDocumentoId.value && documentosData.length > 0) {
      clienteDocumentoId.value = documentosData.find((documento) => ['RG', 'CPF', 'CNH'].includes(documento.tipo))?.id ?? ''
    }
  } catch (err) {
    error.value = getErrorMessage(err)
  } finally {
    loading.value = false
  }
}

function asString(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function faixaEtariaFromDataNascimento(value: unknown) {
  const raw = asString(value)
  if (!raw) return ''
  const data = new Date(raw)
  if (Number.isNaN(data.getTime())) return ''

  const hoje = new Date()
  let idade = hoje.getFullYear() - data.getFullYear()
  const aniversarioPassou = hoje.getMonth() > data.getMonth() || (hoje.getMonth() === data.getMonth() && hoje.getDate() >= data.getDate())
  if (!aniversarioPassou) idade -= 1
  return idade > 0 ? `${idade} anos` : ''
}

function carregarDadosCliente() {
  const identificacao = dadosClienteExtraidos.value
  const documento = selectedClienteDocumento.value
  clienteForm.nome = asString(identificacao?.nomeCompleto) || lead.value?.nome || ''
  clienteForm.cpf = asString(identificacao?.cpf) || documento?.cpf || ''
  clienteForm.email = lead.value?.email || ''
  clienteForm.telefone = lead.value?.telefone || ''
  clienteForm.faixaEtaria = faixaEtariaFromDataNascimento(identificacao?.dataNascimento)
}

async function buscarExtracaoParaCliente() {
  const documento = selectedClienteDocumento.value
  if (!documento) return
  await consultarExtracao(documento)
  carregarDadosCliente()
}

async function criarCliente() {
  if (!simulacao.value?.leadId) return
  if (clienteExistente.value) {
    clienteAction.error.value = 'Este lead ja possui cliente criado.'
    return
  }

  const result = await clienteAction.run(async () => {
    const pessoa = await pessoasFisicasService.create({
      nome: clienteForm.nome.trim(),
      cpf: clienteForm.cpf.trim(),
      email: clienteForm.email.trim() || undefined,
      telefone: clienteForm.telefone.trim() || undefined,
      faixaEtaria: clienteForm.faixaEtaria.trim() || undefined,
    })

    await clientesService.create({
      leadId: simulacao.value!.leadId,
      pessoaFisicaId: pessoa.id,
      pessoaJuridicaId: null,
    })

    return true
  }, 'Cliente criado.')

  if (result) await load()
  confirmClienteCreation.value = false
}

function abrirConfirmacaoCliente() {
  clienteAction.error.value = null
  if (!clienteForm.nome.trim() || !clienteForm.cpf.trim()) {
    clienteAction.error.value = 'Confira nome e CPF antes de criar o cliente.'
    return
  }
  confirmClienteCreation.value = true
}

function resetForm() {
  form.tipo = identificacaoTitularEnviada.value ? '' : 'RG'
  form.papel = identificacaoTitularEnviada.value ? '' : 'Titular'
  form.tipoParentesco = identificacaoTitularEnviada.value ? '' : 'Titular'
  form.cpf = ''
  form.cpfDependente = ''
  form.cnpj = ''
  form.arquivo = null
}

function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  form.arquivo = input.files?.[0] ?? null
}

function fileSizeLabel(bytes: number) {
  if (!bytes) return '-'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

async function submit() {
  if (!simulacao.value?.leadId || !form.arquivo) return
  if (
    !identificacaoTitularEnviada.value &&
    (form.papel !== 'Titular' || !tiposIdentificacaoTitular.includes(form.tipo as TipoDocumento))
  ) {
    action.error.value = 'Envie primeiro a identificacao do titular.'
    return
  }
  if (cpfObrigatorio.value && !form.cpf.trim()) {
    action.error.value = 'Informe o CPF do titular.'
    return
  }
  if (isDependente.value && !form.cpfDependente.trim()) {
    action.error.value = 'Informe o CPF do dependente.'
    return
  }
  if (isEmpresa.value && !form.cnpj.trim()) {
    action.error.value = 'Informe o CNPJ da empresa.'
    return
  }

  const payload: DocumentoUploadRequest = {
    tipo: form.tipo as TipoDocumento,
    papel: form.papel as PapelDocumento,
    tipoParentesco: (form.tipoParentesco || 'Titular') as TipoParentesco,
    cpf: form.cpf.trim() || undefined,
    cpfDependente: isDependente.value ? form.cpfDependente.trim() : undefined,
    cnpj: isEmpresa.value ? form.cnpj.trim() : undefined,
    arquivo: form.arquivo,
  }

  const result = await action.run(async () => {
    const externo = await documentosExternosService.upload(payload)
    const documentoInterno = await documentosService.create({
      documentoExternoId: externo.id,
      tipo: payload.tipo,
      papel: payload.papel,
      tipoParentesco: payload.tipoParentesco,
      cpf: payload.cpf,
      cpfDependente: payload.cpfDependente,
      cnpj: payload.cnpj,
      extracaoProcessada: externo.extracaoProcessada,
    }, simulacao.value!.leadId)
    documentosExternosStore.save(documentoInterno.id, externo)
    return true
  }, 'Documento enviado.')

  if (result) {
    resetForm()
    await load()
    activeTab.value = 'cliente'
  }
}

async function removeDocumento(documento: DocumentoResponse) {
  const result = await action.run(async () => {
    await documentosService.remove(documento.id)
    return true
  }, 'Documento removido.')

  if (result) {
    documentosApprovalStore.remove(documento.id)
    documentosExternosStore.remove(documento.id)
    if (viewingDocumento.value?.id === documento.id) viewingDocumento.value = null
    await load()
  }
}

function clearPreview() {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
  previewUrl.value = null
  previewContentType.value = null
  previewError.value = null
  viewingDocumento.value = null
}

async function openDocumento(documento: DocumentoResponse) {
  clearPreview()
  viewingDocumento.value = documento
  previewLoading.value = true

  try {
    const response = await fetch(documentosExternosService.downloadUrl(documento.documentoExternoId))
    if (!response.ok) throw new Error(`Erro ${response.status} ao carregar o arquivo.`)

    const blob = await response.blob()
    previewContentType.value = blob.type || documento.contentType || null
    previewUrl.value = URL.createObjectURL(blob)
  } catch (err) {
    previewError.value = getErrorMessage(err)
  } finally {
    previewLoading.value = false
  }
}

async function approveDocumento(documento: DocumentoResponse) {
  const vinculo = documentosExternosStore.get(documento.id)
  if (vinculo) await documentosExternosService.atualizarStatus(vinculo.documentoExternoId, 3, 'Aprovado no Corretor.web')
  await documentosService.approve(documento.id)
  documentosApprovalStore.approve(documento.id)
  clearPreview()
  await load()
}

async function rejectDocumento(documento: DocumentoResponse) {
  const vinculo = documentosExternosStore.get(documento.id)
  const motivo = 'Rejeitado no Corretor.web'
  if (vinculo) await documentosExternosService.atualizarStatus(vinculo.documentoExternoId, 4, motivo)
  await documentosService.reject(documento.id, motivo)
  documentosApprovalStore.remove(documento.id)
  clearPreview()
  await load()
}

function isDocumentoAprovado(documento: DocumentoResponse) {
  return documento.aprovado || documentosApprovalStore.isApproved(documento.id)
}

function getDocumentoExterno(documento: DocumentoResponse) {
  return documentosExternosStore.get(documento.id) ?? {
    documentoExternoId: documento.documentoExternoId,
    extracaoProcessada: documento.extracaoProcessada,
  }
}

function getDocumentoExternoId(documento: DocumentoResponse) {
  return getDocumentoExterno(documento)?.documentoExternoId ?? documento.documentoExternoId
}

async function consultarExtracao(documento: DocumentoResponse) {
  const documentoExternoId = getDocumentoExternoId(documento)
  if (!documentoExternoId) {
    externalError.value = 'Documento sem retorno externo salvo.'
    return
  }

  externalLoading.value = true
  externalError.value = null

  try {
    const dados = await documentosExternosService.getDadosExtraidos(documentoExternoId)
    const atualizado = documentosExternosStore.updateDados(documento.id, dados, Boolean(dados))
    if (!atualizado) {
      documentosExternosStore.save(documento.id, {
        id: documentoExternoId,
        extracaoProcessada: Boolean(dados),
        dadosExtraidos: dados,
      })
    }
    if (selectedClienteDocumento.value?.id === documento.id) carregarDadosCliente()
    await load()
  } catch (err) {
    externalError.value = getErrorMessage(err)
  } finally {
    externalLoading.value = false
  }
}

async function reprocessarDocumento(documento: DocumentoResponse) {
  const documentoExternoId = getDocumentoExternoId(documento)
  if (!documentoExternoId) {
    externalError.value = 'Documento sem retorno externo salvo.'
    return
  }

  externalLoading.value = true
  externalError.value = null

  try {
    await documentosExternosService.reprocessar(documentoExternoId)
    const dados = await documentosExternosService.getDadosExtraidos(documentoExternoId)
    const atualizado = documentosExternosStore.updateDados(documento.id, dados, Boolean(dados))
    if (!atualizado) {
      documentosExternosStore.save(documento.id, {
        id: documentoExternoId,
        extracaoProcessada: Boolean(dados),
        dadosExtraidos: dados,
      })
    }
    if (selectedClienteDocumento.value?.id === documento.id) carregarDadosCliente()
    await load()
  } catch (err) {
    externalError.value = getErrorMessage(err)
  } finally {
    externalLoading.value = false
  }
}

watch(
  () => form.papel,
  (papel) => {
    if (papel === 'Titular') form.tipoParentesco = 'Titular'
    if (papel !== 'Dependente') form.cpfDependente = ''
    if (papel !== 'Empresa') form.cnpj = ''
  },
)

watch(
  identificacaoTitularEnviada,
  (enviada) => {
    if (!enviada) {
      form.tipo = 'RG'
      form.papel = 'Titular'
      form.tipoParentesco = 'Titular'
    }
  },
  { immediate: true },
)

onMounted(load)
onUnmounted(clearPreview)
</script>

<template>
  <section class="page-intro">
    <div>
      <span class="section-label">Documentacao</span>
      <h2>{{ lead?.nome || 'Envio de documentacao' }}</h2>
      <p>{{ lead ? `${lead.telefone || 'Telefone nao informado'} · ${lead.quantidadeVidas ?? 0} vidas` : 'Documentos vinculados ao lead da simulacao.' }}</p>
    </div>
    <RouterLink class="button secondary" :to="`/simulacoes/${id}`">Voltar</RouterLink>
  </section>

  <section class="panel">
    <ListState :loading="loading" :error="error" @retry="load" />

    <div v-if="!loading && !error && canSend" class="tabs">
      <button type="button" :class="{ active: activeTab === 'documentos' }" @click="activeTab = 'documentos'">Documentos</button>
      <button type="button" :class="{ active: activeTab === 'cliente' }" @click="activeTab = 'cliente'">Cliente</button>
    </div>

    <EmptyState
      v-if="!loading && !error && !canSend"
      title="Simulacao nao aprovada"
      message="A documentacao so pode ser enviada depois que a simulacao estiver aprovada."
    />

    <form v-if="!loading && !error && canSend && activeTab === 'documentos'" @submit.prevent="submit">
      <p v-if="action.error.value" class="form-error">{{ action.error.value }}</p>
      <p v-if="!identificacaoTitularEnviada" class="form-error">
        Envie primeiro a identificacao do titular para liberar os demais documentos.
      </p>

      <div class="form-grid">
        <label class="field">
          Tipo
          <select v-model="form.tipo" required>
            <option value="">Selecione</option>
            <option v-for="tipo in tipoDocumentoOpcoes" :key="tipo" :value="tipo">{{ tipo }}</option>
          </select>
        </label>
        <label class="field">
          Papel
          <select v-model="form.papel" required :disabled="!identificacaoTitularEnviada">
            <option value="">Selecione</option>
            <option v-for="opcao in papelDocumentoOpcoes" :key="opcao" :value="opcao">{{ opcao }}</option>
          </select>
        </label>
        <label class="field">
          Parentesco
          <select v-model="form.tipoParentesco" required :disabled="form.papel === 'Titular'">
            <option value="">Selecione</option>
            <option v-for="tipo in tipoParentescoOpcoes" :key="tipo" :value="tipo">{{ tipo }}</option>
          </select>
        </label>
        <label class="field">
          CPF titular
          <input v-model.trim="form.cpf" inputmode="numeric" :required="cpfObrigatorio" placeholder="CPF do titular" />
        </label>
        <label v-if="isDependente" class="field">
          CPF dependente
          <input v-model.trim="form.cpfDependente" inputmode="numeric" required placeholder="CPF do dependente" />
        </label>
        <label v-if="isEmpresa" class="field">
          CNPJ
          <input v-model.trim="form.cnpj" inputmode="numeric" required placeholder="CNPJ da empresa" />
        </label>
        <label class="field full">
          Arquivo
          <input type="file" required @change="onFileChange" />
        </label>
      </div>

      <div class="form-actions">
        <button class="button secondary" type="button" @click="resetForm">Limpar</button>
        <button class="button" type="submit" :disabled="action.loading.value || !form.arquivo">Enviar documento</button>
      </div>
    </form>

    <form v-if="!loading && !error && canSend && activeTab === 'cliente'" @submit.prevent>
      <p v-if="clienteAction.error.value" class="form-error">{{ clienteAction.error.value }}</p>

      <div v-if="clienteExistente" class="empty-state" style="min-height: 90px;">
        <strong>Cliente ja criado</strong>
        <p>ID {{ clienteExistente.id }}</p>
      </div>

      <div v-else>
        <div class="form-grid">
          <label class="field full">
            Documento de origem
            <select v-model="clienteDocumentoId">
              <option value="">Selecione</option>
              <option v-for="documento in documentosIdentificacao" :key="documento.id" :value="documento.id">
                {{ documento.tipo }} - {{ documento.papel }} - {{ documento.documentoExternoId }}
              </option>
            </select>
          </label>
          <label class="field">
            Nome
            <input v-model.trim="clienteForm.nome" required />
          </label>
          <label class="field">
            CPF
            <input v-model.trim="clienteForm.cpf" required inputmode="numeric" />
          </label>
          <label class="field">
            Email
            <input v-model.trim="clienteForm.email" type="email" />
          </label>
          <label class="field">
            Telefone
            <input v-model.trim="clienteForm.telefone" inputmode="tel" />
          </label>
          <label class="field">
            Faixa etaria
            <input v-model.trim="clienteForm.faixaEtaria" />
          </label>
        </div>

        <div class="form-actions">
          <button class="button secondary" type="button" :disabled="externalLoading || !selectedClienteDocumento" @click="buscarExtracaoParaCliente">
            Carregar extração
          </button>
          <button class="button" type="button" :disabled="clienteAction.loading.value || !clienteForm.nome || !clienteForm.cpf" @click="abrirConfirmacaoCliente">
            Conferir criação
          </button>
        </div>
      </div>
    </form>
  </section>

  <section v-if="!loading && !error && canSend" class="panel table-panel" style="margin-top: 18px;">
    <div class="panel-header">
      <div>
        <span class="section-label">Documentos</span>
        <h3>{{ documentos.length }} enviados</h3>
      </div>
    </div>

    <EmptyState v-if="documentos.length === 0" title="Nenhum documento" message="Ainda nao ha documentos enviados para este lead." />

    <div v-else class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Arquivo</th>
            <th>Categoria</th>
            <th>Tipo</th>
            <th>Status</th>
            <th>Tamanho</th>
            <th>Acoes</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="documento in documentos" :key="documento.id">
            <td>
              <strong>{{ documento.nomeArquivo || documento.tipo }}</strong>
              <small style="display: block; margin-top: 4px;">{{ documento.papel || '-' }}</small>
            </td>
            <td>{{ ['RG', 'CPF', 'CNH'].includes(documento.tipo) ? 'Identificacao' : 'Endereco' }}</td>
            <td>{{ documento.tipo }}</td>
            <td>
              <span class="status-badge">{{ isDocumentoAprovado(documento) ? 'Aprovado' : 'Pendente' }}</span>
              <small v-if="getDocumentoExterno(documento)" style="display: block; margin-top: 4px;">
                Extração {{ getDocumentoExterno(documento)?.extracaoProcessada ? 'processada' : 'pendente' }}
              </small>
            </td>
            <td>{{ fileSizeLabel(0) }}</td>
            <td class="actions">
              <button class="button secondary" type="button" @click="openDocumento(documento)">Visualizar</button>
              <button class="button secondary" type="button" :disabled="externalLoading || !getDocumentoExterno(documento)" @click="consultarExtracao(documento)">
                Consultar extração
              </button>
              <button class="button secondary" type="button" :disabled="externalLoading || !getDocumentoExterno(documento)" @click="reprocessarDocumento(documento)">
                Reprocessar
              </button>
              <a class="button secondary" :href="documentosExternosService.downloadUrl(documento.documentoExternoId)" target="_blank" rel="noreferrer">Baixar</a>
              <button class="button secondary" type="button" :disabled="action.loading.value" @click="removeDocumento(documento)">Excluir</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>

  <div v-if="viewingDocumento" class="modal-backdrop">
    <section class="confirm-modal" style="width: min(900px, 100%);">
      <div class="panel-header">
        <div>
          <span class="section-label">Documento</span>
          <h3>{{ viewingDocumento.nomeArquivo || viewingDocumento.tipo || 'Visualizacao' }}</h3>
        </div>
        <button class="button secondary" type="button" @click="clearPreview">Fechar</button>
      </div>

      <div v-if="previewLoading" class="list-state">
        <span class="spinner"></span>
        <p>Carregando arquivo...</p>
      </div>
      <p v-else-if="previewError" class="form-error">{{ previewError }}</p>
      <p v-if="externalError" class="form-error">{{ externalError }}</p>
      <img
        v-else-if="previewUrl && isPreviewImage"
        :src="previewUrl"
        alt="Visualizacao do documento"
        style="width: 100%; max-height: 60vh; object-fit: contain; border: 1px solid #d7e1e5; border-radius: 8px;"
      />
      <iframe
        v-else-if="previewUrl && canPreviewInline"
        :src="previewUrl"
        style="width: 100%; height: 60vh; border: 1px solid #d7e1e5; border-radius: 8px;"
        title="Visualizacao do documento"
      ></iframe>
      <div v-else class="empty-state">
        <strong>Pre-visualizacao indisponivel</strong>
        <p>Este tipo de arquivo nao pode ser exibido no navegador. Use Baixar para abrir localmente.</p>
      </div>

      <div v-if="getDocumentoExterno(viewingDocumento)" class="panel" style="margin-top: 16px;">
        <div class="panel-header">
          <div>
            <span class="section-label">Extração</span>
            <h3>Dados extraídos</h3>
          </div>
          <small>{{ getDocumentoExterno(viewingDocumento)?.documentoExternoId }}</small>
        </div>
        <pre style="white-space: pre-wrap; overflow: auto; max-height: 220px; font-size: 12px;">{{ JSON.stringify(getDocumentoExterno(viewingDocumento)?.dadosExtraidos ?? { status: 'Sem dados extraidos salvos. Use Consultar extração ou Reprocessar.' }, null, 2) }}</pre>
      </div>

      <div class="form-actions">
        <a class="button secondary" :href="documentosExternosService.downloadUrl(viewingDocumento.documentoExternoId)" target="_blank" rel="noreferrer">Baixar</a>
        <button class="button secondary" type="button" :disabled="externalLoading || isDocumentoAprovado(viewingDocumento)" @click="rejectDocumento(viewingDocumento)">
          Reprovar
        </button>
        <button class="button" type="button" :disabled="externalLoading || isDocumentoAprovado(viewingDocumento) || !getDocumentoExterno(viewingDocumento)?.dadosExtraidos" @click="approveDocumento(viewingDocumento)">
          {{ isDocumentoAprovado(viewingDocumento) ? 'Aprovado' : 'Aprovar' }}
        </button>
      </div>
    </section>
  </div>

  <div v-if="confirmClienteCreation" class="modal-backdrop">
    <section class="confirm-modal">
      <h3>Confirmar cliente</h3>
      <div class="detail-grid" style="grid-template-columns: 1fr;">
        <div>
          <small>Nome</small>
          <strong>{{ clienteForm.nome }}</strong>
        </div>
        <div>
          <small>CPF</small>
          <strong>{{ clienteForm.cpf }}</strong>
        </div>
        <div>
          <small>Email</small>
          <strong>{{ clienteForm.email || '-' }}</strong>
        </div>
        <div>
          <small>Telefone</small>
          <strong>{{ clienteForm.telefone || '-' }}</strong>
        </div>
        <div>
          <small>Faixa etaria</small>
          <strong>{{ clienteForm.faixaEtaria || '-' }}</strong>
        </div>
      </div>
      <div class="form-actions">
        <button class="button secondary" type="button" @click="confirmClienteCreation = false">Voltar</button>
        <button class="button" type="button" :disabled="clienteAction.loading.value" @click="criarCliente">Confirmar criação</button>
      </div>
    </section>
  </div>
</template>
