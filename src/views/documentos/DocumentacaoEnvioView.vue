<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import EmptyState from '@/components/ui/EmptyState.vue'
import ListState from '@/components/ui/ListState.vue'
import { useApiAction } from '@/composables/useApiAction'
import { getErrorMessage } from '@/services/apiClient'
import { documentosApprovalStore } from '@/services/documentosApprovalStore'
import { documentosService } from '@/services/documentosService'
import { leadsService } from '@/services/leadsService'
import { simulacoesService } from '@/services/simulacoesService'
import {
  documentoCategorias,
  documentoDeOpcoes,
  documentoEnderecoTipos,
  documentoIdentificacaoTipos,
  type DocumentoCategoria,
  type DocumentoDe,
  type DocumentoEnderecoTipo,
  type DocumentoIdentificacaoTipo,
  type DocumentoResponse,
  type DocumentoUploadRequest,
} from '@/types/documentos'
import type { LeadResponse } from '@/types/leads'
import type { SimulacaoResponse } from '@/types/simulacoes'

const props = defineProps<{ id: string }>()

const loading = ref(false)
const error = ref<string | null>(null)
const simulacao = ref<SimulacaoResponse | null>(null)
const lead = ref<LeadResponse | null>(null)
const documentos = ref<DocumentoResponse[]>([])
const viewingDocumento = ref<DocumentoResponse | null>(null)
const previewUrl = ref<string | null>(null)
const previewContentType = ref<string | null>(null)
const previewLoading = ref(false)
const previewError = ref<string | null>(null)
const action = useApiAction()

const form = reactive<{
  categoria: DocumentoCategoria | ''
  tipoIdentificacao: DocumentoIdentificacaoTipo | ''
  tipoEndereco: DocumentoEnderecoTipo | ''
  documentoDe: DocumentoDe | ''
  arquivo: File | null
}>({
  categoria: '',
  tipoIdentificacao: '',
  tipoEndereco: '',
  documentoDe: '',
  arquivo: null,
})

const canSend = computed(() => Boolean(simulacao.value?.aprovada && simulacao.value.leadId))
const showTipoIdentificacao = computed(() => form.categoria === 'Identificacao')
const showTipoEndereco = computed(() => form.categoria === 'Endereco')
const canPreviewInline = computed(() => {
  const contentType = previewContentType.value ?? viewingDocumento.value?.contentType ?? ''
  return contentType.startsWith('application/pdf') || contentType.startsWith('image/')
})
const isPreviewImage = computed(() => (previewContentType.value ?? viewingDocumento.value?.contentType ?? '').startsWith('image/'))

async function load() {
  loading.value = true
  error.value = null

  try {
    const simulacaoData = await simulacoesService.get!(props.id)
    simulacao.value = simulacaoData

    const [leadData, documentosData] = await Promise.all([
      leadsService.get!(simulacaoData.leadId),
      documentosService.list(simulacaoData.leadId),
    ])

    lead.value = leadData
    documentos.value = documentosData
  } catch (err) {
    error.value = getErrorMessage(err)
  } finally {
    loading.value = false
  }
}

function resetForm() {
  form.categoria = ''
  form.tipoIdentificacao = ''
  form.tipoEndereco = ''
  form.documentoDe = ''
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

  const payload: DocumentoUploadRequest = {
    categoria: form.categoria || undefined,
    tipoIdentificacao: form.tipoIdentificacao || undefined,
    tipoEndereco: form.tipoEndereco || undefined,
    documentoDe: form.documentoDe || undefined,
    arquivo: form.arquivo,
  }

  const result = await action.run(async () => {
    await documentosService.create(payload, simulacao.value!.leadId)
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
    const response = await fetch(documentosService.fileUrl(documento.id))
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
  documentosApprovalStore.approve(documento.id)
  clearPreview()
  await load()
}

function isDocumentoAprovado(documento: DocumentoResponse) {
  return documentosApprovalStore.isApproved(documento.id)
}

watch(
  () => form.categoria,
  (categoria) => {
    if (categoria === 'Identificacao') form.tipoEndereco = ''
    if (categoria === 'Endereco') form.tipoIdentificacao = ''
  },
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

    <EmptyState
      v-if="!loading && !error && !canSend"
      title="Simulacao nao aprovada"
      message="A documentacao so pode ser enviada depois que a simulacao estiver aprovada."
    />

    <form v-if="!loading && !error && canSend" @submit.prevent="submit">
      <p v-if="action.error.value" class="form-error">{{ action.error.value }}</p>

      <div class="form-grid">
        <label class="field">
          Categoria
          <select v-model="form.categoria" required>
            <option value="">Selecione</option>
            <option v-for="categoria in documentoCategorias" :key="categoria" :value="categoria">{{ categoria }}</option>
          </select>
        </label>
        <label class="field">
          Documento de
          <select v-model="form.documentoDe" required>
            <option value="">Selecione</option>
            <option v-for="opcao in documentoDeOpcoes" :key="opcao" :value="opcao">{{ opcao }}</option>
          </select>
        </label>
        <label v-if="showTipoIdentificacao" class="field">
          Tipo identificacao
          <select v-model="form.tipoIdentificacao">
            <option value="">Nao se aplica</option>
            <option v-for="tipo in documentoIdentificacaoTipos" :key="tipo" :value="tipo">{{ tipo }}</option>
          </select>
        </label>
        <label v-if="showTipoEndereco" class="field">
          Tipo endereco
          <select v-model="form.tipoEndereco">
            <option value="">Nao se aplica</option>
            <option v-for="tipo in documentoEnderecoTipos" :key="tipo" :value="tipo">{{ tipo }}</option>
          </select>
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
              <strong>{{ documento.nomeArquivo || '-' }}</strong>
              <small style="display: block; margin-top: 4px;">{{ documento.documentoDe || '-' }}</small>
            </td>
            <td>{{ documento.categoria || '-' }}</td>
            <td>{{ documento.tipoIdentificacao || documento.tipoEndereco || '-' }}</td>
            <td><span class="status-badge">{{ isDocumentoAprovado(documento) ? 'Aprovado' : 'Pendente' }}</span></td>
            <td>{{ fileSizeLabel(documento.tamanhoBytes) }}</td>
            <td class="actions">
              <button class="button secondary" type="button" @click="openDocumento(documento)">Visualizar</button>
              <a class="button secondary" :href="documentosService.fileUrl(documento.id)" target="_blank" rel="noreferrer">Baixar</a>
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
          <h3>{{ viewingDocumento.nomeArquivo || 'Visualizacao' }}</h3>
        </div>
        <button class="button secondary" type="button" @click="clearPreview">Fechar</button>
      </div>

      <div v-if="previewLoading" class="list-state">
        <span class="spinner"></span>
        <p>Carregando arquivo...</p>
      </div>
      <p v-else-if="previewError" class="form-error">{{ previewError }}</p>
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
        <a class="button secondary" :href="documentosService.fileUrl(viewingDocumento.id)" target="_blank" rel="noreferrer">Baixar</a>
        <button class="button" type="button" :disabled="isDocumentoAprovado(viewingDocumento)" @click="approveDocumento(viewingDocumento)">
          {{ isDocumentoAprovado(viewingDocumento) ? 'Aprovado' : 'Aprovar' }}
        </button>
      </div>
    </section>
  </div>
</template>
