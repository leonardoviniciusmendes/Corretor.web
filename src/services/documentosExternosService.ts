import type {
  DocumentoDadosExtraidos,
  DocumentoExternoResponse,
  DocumentoExternoUploadResponse,
  DocumentoUploadRequest,
  PapelDocumento,
  TipoDocumento,
  TipoParentesco,
} from '@/types/documentos'

const documentosApiUrl = import.meta.env.VITE_DOCUMENTOS_API_URL ?? 'http://localhost:5001'

const tipoDocumentoApi: Record<TipoDocumento, number> = {
  RG: 0,
  CPF: 1,
  CNH: 2,
  ComprovanteResidencia: 3,
  ContaLuz: 4,
  CertidaoNascimento: 5,
  CertidaoCasamento: 6,
  ContratoSocial: 7,
  CartaoCNPJ: 8,
  ContaAgua: 9,
  ContaTelefone: 10,
  ContaInternet: 11,
  ContaGas: 12,
  FaturaCartaoCredito: 13,
  ExtratoBancario: 14,
  ContratoLocacao: 15,
  IPTU: 16,
  Elegibilidade: 17,
  FichaAssociativa: 18,
  DocumentoOficialComSelfie: 19,
  Outros: 99,
}

const papelDocumentoApi: Record<PapelDocumento, number> = {
  Titular: 0,
  Dependente: 1,
  Empresa: 2,
}

const tipoParentescoApi: Record<TipoParentesco, number> = {
  Titular: 0,
  Conjuge: 1,
  Filho: 2,
  Pai: 3,
  Mae: 4,
  Socio: 5,
  RepresentanteLegal: 6,
  Outros: 99,
}

function buildUrl(path: string) {
  const base = String(documentosApiUrl).replace(/\/$/, '')
  return `${base}${path.startsWith('/') ? path : `/${path}`}`
}

function onlyDigits(value?: string | null) {
  return (value ?? '').replace(/\D/g, '')
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
    form.append('Tipo', String(tipoDocumentoApi[payload.tipo]))
    form.append('Papel', String(papelDocumentoApi[payload.papel]))
    form.append('TipoParentesco', String(tipoParentescoApi[payload.tipoParentesco]))
    const cpf = onlyDigits(payload.cpf)
    const cpfDependente = onlyDigits(payload.cpfDependente)
    const cnpj = onlyDigits(payload.cnpj)
    if (cpf) form.append('Cpf', cpf)
    if (cpfDependente) form.append('CpfDependente', cpfDependente)
    if (cnpj) form.append('Cnpj', cnpj)
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
