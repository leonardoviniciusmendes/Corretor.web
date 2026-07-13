import type {
  DocumentoDadosExtraidos,
  DocumentoExternoResponse,
  DocumentoExternoUploadResponse,
  DocumentoUploadRequest,
} from '@/types/documentos'

const documentosApiUrl = import.meta.env.VITE_DOCUMENTOS_API_URL ?? 'http://localhost:5001'

function buildUrl(path: string) {
  const base = String(documentosApiUrl).replace(/\/$/, '')
  return `${base}${path.startsWith('/') ? path : `/${path}`}`
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || `Erro ${response.status} ao chamar API de documentos.`)
  }

  const text = await response.text()
  return text ? (JSON.parse(text) as T) : (undefined as T)
}

export const documentosExternosService = {
  async upload(payload: DocumentoUploadRequest) {
    const form = new FormData()
    form.append('Arquivo', payload.arquivo)
    form.append('Tipo', payload.tipo)
    form.append('Papel', payload.papel)
    form.append('TipoParentesco', payload.tipoParentesco)
    if (payload.cpf) form.append('Cpf', payload.cpf)
    if (payload.cpfDependente) form.append('CpfDependente', payload.cpfDependente)
    if (payload.cnpj) form.append('Cnpj', payload.cnpj)
    if (payload.observacoes) form.append('Observacoes', payload.observacoes)

    const response = await fetch(buildUrl('/api/Documentos'), {
      method: 'POST',
      body: form,
    })

    return parseResponse<DocumentoExternoUploadResponse>(response)
  },

  async get(id: string) {
    const response = await fetch(buildUrl(`/api/Documentos/${id}`))
    return parseResponse<DocumentoExternoResponse>(response)
  },

  async getDadosExtraidos(id: string) {
    const response = await fetch(buildUrl(`/api/Documentos/${id}/identificacao`))
    if (response.status === 404) return null
    return parseResponse<DocumentoDadosExtraidos>(response)
  },

  async reprocessar(id: string) {
    const response = await fetch(buildUrl(`/api/Documentos/${id}/extrair-identificacao`), {
      method: 'POST',
    })
    return parseResponse<DocumentoDadosExtraidos | void>(response)
  },

  async atualizarStatus(id: string, status: 3 | 4, observacoes?: string) {
    const response = await fetch(buildUrl(`/api/Documentos/${id}`), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status,
        observacoes,
        usuario: 'Corretor.web',
      }),
    })

    return parseResponse<void>(response)
  },

  downloadUrl(id: string) {
    return buildUrl(`/api/Documentos/${id}/download`)
  },
}
