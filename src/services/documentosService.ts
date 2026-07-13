import { httpClient } from '@/services/apiClient'
import type { DocumentoMetadataRequest, DocumentoResponse } from '@/types/documentos'

export const documentosService = {
  list(leadId?: string) {
    if (!leadId) return Promise.resolve([])
    return httpClient.get<DocumentoResponse[]>(`/api/leads/${leadId}/documentos`)
  },
  create(payload: DocumentoMetadataRequest, leadId?: string) {
    if (!leadId) return Promise.reject(new Error('Informe o ID do lead.'))
    return httpClient.post<DocumentoResponse>(`/api/leads/${leadId}/documentos`, payload)
  },
  update(id: string, payload: DocumentoMetadataRequest) {
    return httpClient.put<void>(`/api/documentos/${id}`, payload)
  },
  remove(id: string) {
    return httpClient.delete<void>(`/api/documentos/${id}`)
  },
  approve(id: string) {
    return httpClient.post<void>(`/api/documentos/${id}/aprovar`)
  },
  reject(id: string, motivo: string) {
    return httpClient.post<void>(`/api/documentos/${id}/reprovar`, { motivo })
  },
  fileUrl(id: string) {
    return httpClient.url(`/api/documentos/${id}/identificacao`)
  },
}
