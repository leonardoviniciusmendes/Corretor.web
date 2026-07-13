import { httpClient } from '@/services/apiClient'
import type { DocumentoMetadataRequest, DocumentoResponse, DocumentoUploadRequest } from '@/types/documentos'

export const documentosService = {
  list(leadId?: string) {
    if (!leadId) return Promise.resolve([])
    return httpClient.get<DocumentoResponse[]>(`/api/leads/${leadId}/documentos`)
  },
  create(payload: DocumentoUploadRequest, leadId?: string) {
    if (!leadId) return Promise.reject(new Error('Informe o ID do lead.'))

    const form = new FormData()
    if (payload.categoria) form.append('Categoria', payload.categoria)
    if (payload.tipoIdentificacao) form.append('TipoIdentificacao', payload.tipoIdentificacao)
    if (payload.tipoEndereco) form.append('TipoEndereco', payload.tipoEndereco)
    if (payload.documentoDe) form.append('DocumentoDe', payload.documentoDe)
    form.append('Arquivo', payload.arquivo)

    return httpClient.postForm<DocumentoResponse>(`/api/leads/${leadId}/documentos`, form)
  },
  update(id: string, payload: DocumentoMetadataRequest) {
    return httpClient.put<void>(`/api/documentos/${id}`, payload)
  },
  remove(id: string) {
    return httpClient.delete<void>(`/api/documentos/${id}`)
  },
  fileUrl(id: string) {
    return httpClient.url(`/api/documentos/${id}/arquivo`)
  },
}
