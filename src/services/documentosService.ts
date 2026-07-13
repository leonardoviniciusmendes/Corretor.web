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
    form.append('arquivo', payload.arquivo)
    form.append('tipo', payload.tipo)
    form.append('papel', payload.papel)
    form.append('tipoParentesco', payload.tipoParentesco)
    form.append('categoria', payload.tipo === 'ComprovanteResidencia' ? 'Endereco' : 'Identificacao')
    form.append('documentoDe', payload.papel)
    if (payload.tipo === 'CNH') form.append('tipoIdentificacao', 'Cnh')
    if (payload.tipo !== 'ComprovanteResidencia' && payload.tipo !== 'CNH') form.append('tipoIdentificacao', 'Certidao')
    if (payload.tipo === 'ComprovanteResidencia') form.append('tipoEndereco', 'ContaDeLuz')
    if (payload.cpf) form.append('cpf', payload.cpf)
    if (payload.cpfDependente) form.append('cpfDependente', payload.cpfDependente)
    if (payload.cnpj) form.append('cnpj', payload.cnpj)
    if (payload.observacoes) form.append('observacoes', payload.observacoes)

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
