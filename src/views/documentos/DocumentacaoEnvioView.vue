<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import EmptyState from '@/components/ui/EmptyState.vue'
import ListState from '@/components/ui/ListState.vue'
import { useApiAction } from '@/composables/useApiAction'
import { clientesService } from '@/services/clientesService'
import { getErrorMessage } from '@/services/apiClient'
import { documentosApprovalStore } from '@/services/documentosApprovalStore'
import { documentosExternosService } from '@/services/documentosExternosService'
import { documentosExternosStore } from '@/services/documentosExternosStore'
import { documentosService } from '@/services/documentosService'
import { enderecosService } from '@/services/enderecosService'
import { fichaAssociativaService } from '@/services/fichaAssociativaService'
import { leadsService } from '@/services/leadsService'
import { pessoasFisicasService } from '@/services/pessoasFisicasService'
import {
  type DocumentoDadosExtraidos,
  type DocumentoResponse,
  type DocumentoUploadRequest,
  papelDocumentoOpcoes,
  tipoDocumentoOpcoes,
  tipoParentescoOpcoes,
  type PapelDocumento,
  type TipoDocumento,
  type TipoParentesco,
} from '@/types/documentos'
import type { LeadResponse } from '@/types/leads'

const props = defineProps<{ leadId: string }>()

const loading = ref(false)
const error = ref<string | null>(null)
const lead = ref<LeadResponse | null>(null)
const documentos = ref<DocumentoResponse[]>([])
const viewingDocumento = ref<DocumentoResponse | null>(null)
const previewUrl = ref<string | null>(null)
const previewContentType = ref<string | null>(null)
const previewLoading = ref(false)
const previewError = ref<string | null>(null)
const externalLoading = ref(false)
const externalError = ref<string | null>(null)
const action = useApiAction()
const fichaAction = useApiAction()
const tiposIdentificacaoTitular: TipoDocumento[] = ['RG', 'CPF', 'CNH', 'DocumentoOficialComSelfie']
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

const canSend = computed(() => Boolean(props.leadId && lead.value))
const isEndereco = computed(() => tiposEndereco.includes(form.tipo as TipoDocumento))
const isDependente = computed(() => form.papel === 'Dependente')
const isEmpresa = computed(() => form.papel === 'Empresa')
const cpfObrigatorio = computed(() => isEndereco.value || isDependente.value)
const identificacaoTitularEnviada = computed(() =>
  documentos.value.some((documento) => documento.papel === 'Titular' && ['RG', 'CPF', 'CNH'].includes(documento.tipo)),
)
const cpfTitular = computed(() => documentos.value.find((documento) => documento.papel === 'Titular' && documento.cpf)?.cpf ?? '')
const cpfTitularBloqueado = computed(() => form.papel === 'Titular' && Boolean(cpfTitular.value))
const cpfsDependentes = computed(() =>
  [...new Set(documentos.value
    .filter((documento) => documento.papel === 'Dependente' && documento.cpfDependente)
    .map((documento) => documento.cpfDependente!)
  )],
)
const canPreviewInline = computed(() => {
  const contentType = previewContentType.value ?? viewingDocumento.value?.contentType ?? ''
  return contentType.startsWith('application/pdf') || contentType.startsWith('image/')
})
const isPreviewImage = computed(() => (previewContentType.value ?? viewingDocumento.value?.contentType ?? '').startsWith('image/'))

async function load() {
  loading.value = true
  error.value = null

  try {
    const [leadData, documentosData] = await Promise.all([
      leadsService.get!(props.leadId),
      documentosService.list(props.leadId),
    ])

    lead.value = leadData
    documentos.value = documentosData
    if (form.papel === 'Titular' && cpfTitular.value) form.cpf = cpfTitular.value
  } catch (err) {
    error.value = getErrorMessage(err)
  } finally {
    loading.value = false
  }
}

function resetForm() {
  form.tipo = identificacaoTitularEnviada.value ? '' : 'RG'
  form.papel = identificacaoTitularEnviada.value ? '' : 'Titular'
  form.tipoParentesco = identificacaoTitularEnviada.value ? '' : 'Titular'
  form.cpf = cpfTitular.value
  form.cpfDependente = ''
  form.cnpj = ''
  form.arquivo = null
}

function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  form.arquivo = input.files?.[0] ?? null
}

async function baixarFichaAssociativa() {
  if (!props.leadId) return

  await fichaAction.run(async () => {
    const arquivo = await fichaAssociativaService.gerarArquivo(props.leadId)
    const url = URL.createObjectURL(arquivo)
    const link = document.createElement('a')
    link.href = url
    link.download = arquivo.name
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
    return true
  }, 'Ficha associativa baixada.')
}

function fileSizeLabel(bytes: number) {
  if (!bytes) return '-'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

async function submit() {
  if (!props.leadId || !form.arquivo) return
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
    const cpfDependenteExtraido = isDependente.value ? extrairCpfIdentificacao(externo.dadosExtraidos ?? null) : ''
    const documentoInterno = await documentosService.create({
      documentoExternoId: externo.id,
      tipo: payload.tipo,
      papel: payload.papel,
      tipoParentesco: payload.tipoParentesco,
      cpf: payload.cpf,
      cpfDependente: payload.cpfDependente || cpfDependenteExtraido || undefined,
      cnpj: payload.cnpj,
      extracaoProcessada: externo.extracaoProcessada,
    }, props.leadId)
    documentosExternosStore.save(documentoInterno.id, externo)
    await garantirClienteTitular(externo.dadosExtraidos ?? null, documentoInterno)
    await registrarEnderecosExtraidos(externo.dadosExtraidos ?? null)
    return true
  }, 'Documento enviado.')

  if (result) {
    resetForm()
    await load()
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

function asString(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function normalizar(valor?: string | null) {
  return (valor ?? '').trim().toLowerCase()
}

function onlyDigits(valor?: string | null) {
  return (valor ?? '').replace(/\D/g, '')
}

function extrairCpfIdentificacao(dados: DocumentoDadosExtraidos | null) {
  const identificacao = dados?.identificacao
  if (!identificacao) return ''

  const campos = [
    identificacao.cpf,
    identificacao.Cpf,
    identificacao.numeroCpf,
    identificacao.NumeroCpf,
    identificacao.documento,
    identificacao.Documento,
    identificacao.numeroDocumento,
    identificacao.NumeroDocumento,
  ]

  for (const campo of campos) {
    const digits = onlyDigits(asString(campo))
    if (digits.length === 11) return digits
  }

  return ''
}

function extrairNomeIdentificacao(dados: DocumentoDadosExtraidos | null) {
  const identificacao = dados?.identificacao
  if (!identificacao) return ''

  return asString(
    identificacao.nomeCompleto ??
    identificacao.NomeCompleto ??
    identificacao.nome ??
    identificacao.Nome,
  )
}

function extrairDataNascimentoIdentificacao(dados: DocumentoDadosExtraidos | null) {
  const identificacao = dados?.identificacao
  if (!identificacao) return ''

  return asString(
    identificacao.dataNascimento ??
    identificacao.DataNascimento ??
    identificacao.nascimento ??
    identificacao.Nascimento,
  )
}

function extrairCampoIdentificacao(dados: DocumentoDadosExtraidos | null, ...campos: string[]) {
  const identificacao = dados?.identificacao
  if (!identificacao) return ''

  for (const campo of campos) {
    const value = asString(identificacao[campo])
    if (value) return value
  }

  return ''
}

function faixaEtariaFromDataNascimento(value?: string | null) {
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

async function garantirClienteTitular(dados: DocumentoDadosExtraidos | null, documento: DocumentoResponse) {
  if (!props.leadId || documento.papel !== 'Titular') return null

  const clientes = await clientesService.list()
  const clienteAtual = clientes.find((item) => item.leadId === props.leadId)
  if (clienteAtual) return clienteAtual

  const cpf = extrairCpfIdentificacao(dados) || documento.cpf || form.cpf
  const nome = extrairNomeIdentificacao(dados) || lead.value?.nome || ''
  if (!cpf || !nome) return null

  const dataNascimento = extrairDataNascimentoIdentificacao(dados)
  const pessoa = await pessoasFisicasService.create({
    nome,
    cpf,
    email: lead.value?.email || undefined,
    telefone: lead.value?.telefone || undefined,
    faixaEtaria: faixaEtariaFromDataNascimento(dataNascimento) || undefined,
    dataNascimento: dataNascimento || undefined,
    nomeMae: extrairCampoIdentificacao(dados, 'nomeMae', 'NomeMae') || undefined,
    nomePai: extrairCampoIdentificacao(dados, 'nomePai', 'NomePai') || undefined,
  })

  return clientesService.create({
    leadId: props.leadId,
    pessoaFisicaId: pessoa.id,
    pessoaJuridicaId: null,
  })
}

async function atualizarDocumentoComDadosExtraidos(documento: DocumentoResponse, dados: DocumentoDadosExtraidos | null) {
  const cpfExtraido = extrairCpfIdentificacao(dados)
  if (!cpfExtraido) return

  const cpf = documento.cpf || (documento.papel === 'Titular' ? cpfExtraido : undefined)
  const cpfDependente = documento.cpfDependente || (documento.papel === 'Dependente' ? cpfExtraido : undefined)
  if (cpf === documento.cpf && cpfDependente === documento.cpfDependente) return

  await documentosService.update(documento.id, {
    documentoExternoId: documento.documentoExternoId,
    tipo: documento.tipo,
    papel: documento.papel,
    tipoParentesco: documento.tipoParentesco,
    cpf,
    cpfDependente,
    cnpj: documento.cnpj,
    extracaoProcessada: documento.extracaoProcessada,
  })
}

function mapearEnderecoExtraido(endereco: Record<string, unknown>) {
  const logradouroBase = asString(endereco.logradouro ?? endereco.Logradouro)
  const numero = asString(endereco.numero ?? endereco.Numero)
  const complemento = asString(endereco.complemento ?? endereco.Complemento)
  const logradouro = [logradouroBase, numero, complemento].filter(Boolean).join(', ')

  return {
    logradouro,
    estado: asString(endereco.uf ?? endereco.Uf ?? endereco.estado ?? endereco.Estado),
    cidade: asString(endereco.cidade ?? endereco.Cidade),
    cep: asString(endereco.cep ?? endereco.Cep),
  }
}

async function registrarEnderecosExtraidos(dados: DocumentoDadosExtraidos | null) {
  const enderecosExtraidos = dados?.enderecos ?? []
  if (!props.leadId || enderecosExtraidos.length === 0) return

  const clientes = await clientesService.list()
  const cliente = clientes.find((item) => item.leadId === props.leadId)
  if (!cliente) {
    externalError.value = 'Endereço extraído, mas este lead ainda não possui cliente cadastrado.'
    return
  }

  const enderecosAtuais = await enderecosService.list(cliente.id)
  for (const enderecoExtraido of enderecosExtraidos) {
    const endereco = mapearEnderecoExtraido(enderecoExtraido)
    if (!endereco.logradouro || !endereco.estado || !endereco.cidade || !endereco.cep) continue

    const jaExiste = enderecosAtuais.some((atual) =>
      normalizar(atual.cep) === normalizar(endereco.cep) &&
      normalizar(atual.logradouro) === normalizar(endereco.logradouro),
    )
    if (!jaExiste) {
      const criado = await enderecosService.create(endereco, cliente.id)
      enderecosAtuais.push(criado)
    }
  }
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
    await atualizarDocumentoComDadosExtraidos(documento, dados)
    await garantirClienteTitular(dados, documento)
    await registrarEnderecosExtraidos(dados)
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
    await atualizarDocumentoComDadosExtraidos(documento, dados)
    await garantirClienteTitular(dados, documento)
    await registrarEnderecosExtraidos(dados)
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
    if (papel === 'Titular' && cpfTitular.value) form.cpf = cpfTitular.value
    if (papel === 'Dependente') {
      if (cpfTitular.value) form.cpf = cpfTitular.value
      if (!form.cpfDependente && cpfsDependentes.value.length === 1) form.cpfDependente = cpfsDependentes.value[0]
    }
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
      <span class="section-label">Documentos</span>
      <h2>{{ lead?.nome || 'Envio de documentos' }}</h2>
      <p>{{ lead ? `${lead.telefone || 'Telefone nao informado'} · ${lead.quantidadeVidas ?? 0} vidas` : 'Documentos vinculados ao lead.' }}</p>
    </div>
    <RouterLink class="button secondary" :to="`/leads/${leadId}`">Voltar</RouterLink>
  </section>

  <section class="panel">
    <ListState :loading="loading" :error="error" @retry="load" />

    <EmptyState
      v-if="!loading && !error && !canSend"
      title="Lead nao encontrado"
      message="Nao foi possivel carregar o lead para envio de documentos."
    />

    <form v-if="!loading && !error && canSend" @submit.prevent="submit">
      <p v-if="action.error.value" class="form-error">{{ action.error.value }}</p>
      <p v-if="fichaAction.error.value" class="form-error">{{ fichaAction.error.value }}</p>
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
          <input v-model.trim="form.cpf" inputmode="numeric" :disabled="cpfTitularBloqueado" :required="cpfObrigatorio" placeholder="CPF do titular" />
        </label>
        <label v-if="isDependente" class="field">
          CPF dependente
          <input v-model.trim="form.cpfDependente" inputmode="numeric" list="cpfs-dependentes" placeholder="Preenche pela extracao se ficar em branco" />
          <datalist id="cpfs-dependentes">
            <option v-for="cpf in cpfsDependentes" :key="cpf" :value="cpf" />
          </datalist>
        </label>
        <label v-if="isEmpresa" class="field">
          CNPJ
          <input v-model.trim="form.cnpj" inputmode="numeric" required placeholder="CNPJ da empresa" />
        </label>
        <label class="field full">
          Arquivo
          <input type="file" @change="onFileChange" />
          <small v-if="form.arquivo">{{ form.arquivo.name }}</small>
        </label>
      </div>

      <div class="form-actions">
        <button class="button secondary" type="button" :disabled="fichaAction.loading.value" @click="baixarFichaAssociativa">
          {{ fichaAction.loading.value ? 'Gerando ficha...' : 'Baixar ficha associativa' }}
        </button>
        <button class="button secondary" type="button" @click="resetForm">Limpar</button>
        <button class="button" type="submit" :disabled="action.loading.value || !form.arquivo">Enviar documento</button>
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
              <small v-if="documento.cpf || documento.cpfDependente" style="display: block; margin-top: 4px;">
                {{ documento.papel === 'Dependente' ? 'CPF dependente' : 'CPF' }}: {{ documento.cpfDependente || documento.cpf }}
              </small>
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

</template>

