export type DocumentoCategoria = 'Identificacao' | 'Endereco'
export type DocumentoIdentificacaoTipo = 'Cnpj' | 'Cnh' | 'Certidao'
export type DocumentoEnderecoTipo = 'ContaDeLuz' | 'ContaDeAgua' | 'ContaDeTelefone'
export type DocumentoDe = 'Titular' | 'Dependente' | 'Empresa'
export type TipoDocumento =
  | 'RG'
  | 'CPF'
  | 'CNH'
  | 'ComprovanteResidencia'
  | 'ContaLuz'
  | 'CertidaoNascimento'
  | 'CertidaoCasamento'
  | 'ContratoSocial'
  | 'CartaoCNPJ'
  | 'ContaAgua'
  | 'ContaTelefone'
  | 'ContaInternet'
  | 'ContaGas'
  | 'FaturaCartaoCredito'
  | 'ExtratoBancario'
  | 'ContratoLocacao'
  | 'IPTU'
  | 'Elegibilidade'
  | 'FichaAssociativa'
  | 'DocumentoOficialComSelfie'
  | 'Outros'
export type PapelDocumento = 'Titular' | 'Dependente' | 'Empresa'
export type TipoParentesco =
  | 'Titular'
  | 'Conjuge'
  | 'Filho'
  | 'Pai'
  | 'Mae'
  | 'Socio'
  | 'RepresentanteLegal'
  | 'Outros'

export const documentoCategorias: DocumentoCategoria[] = ['Identificacao', 'Endereco']
export const documentoIdentificacaoTipos: DocumentoIdentificacaoTipo[] = ['Cnpj', 'Cnh', 'Certidao']
export const documentoEnderecoTipos: DocumentoEnderecoTipo[] = ['ContaDeLuz', 'ContaDeAgua', 'ContaDeTelefone']
export const documentoDeOpcoes: DocumentoDe[] = ['Titular', 'Dependente', 'Empresa']
export const tipoDocumentoOpcoes: TipoDocumento[] = [
  'RG',
  'CPF',
  'CNH',
  'ComprovanteResidencia',
  'ContaLuz',
  'CertidaoNascimento',
  'CertidaoCasamento',
  'ContratoSocial',
  'CartaoCNPJ',
  'ContaAgua',
  'ContaTelefone',
  'ContaInternet',
  'ContaGas',
  'FaturaCartaoCredito',
  'ExtratoBancario',
  'ContratoLocacao',
  'IPTU',
  'Elegibilidade',
  'FichaAssociativa',
  'DocumentoOficialComSelfie',
  'Outros',
]
export const papelDocumentoOpcoes: PapelDocumento[] = ['Titular', 'Dependente', 'Empresa']
export const tipoParentescoOpcoes: TipoParentesco[] = [
  'Titular',
  'Conjuge',
  'Filho',
  'Pai',
  'Mae',
  'Socio',
  'RepresentanteLegal',
  'Outros',
]

export interface DocumentoMetadataRequest {
  documentoExternoId: string
  tipo: TipoDocumento
  papel: PapelDocumento
  tipoParentesco?: TipoParentesco | null
  cpf?: string | null
  cpfDependente?: string | null
  cnpj?: string | null
  extracaoProcessada: boolean
}

export interface DocumentoUploadRequest {
  tipo: TipoDocumento
  papel: PapelDocumento
  tipoParentesco: TipoParentesco
  cpf?: string | null
  cpfDependente?: string | null
  cnpj?: string | null
  observacoes?: string | null
  arquivo: File
}

export interface DocumentoExternoUploadResponse {
  id: string
  extracaoProcessada: boolean
  dadosExtraidos?: DocumentoDadosExtraidos | null
  reprocessarUrl?: string | null
}

export interface DocumentoExternoResponse {
  id: string
  cpf?: string | null
  cpfDependente?: string | null
  cnpj?: string | null
  papel: PapelDocumento | number
  tipoParentesco: TipoParentesco | number
  tipo: TipoDocumento | number
  status: number
  observacoes?: string | null
  versaoAtual: number
  excluido: boolean
  criadoEm: string
  atualizadoEm: string
  statusExtracao: number
  erroExtracao?: string | null
  extraidoEm?: string | null
}

export interface DocumentoDadosExtraidos {
  identificacao?: Record<string, unknown> | null
  enderecos?: Array<Record<string, unknown>>
  vinculo?: Record<string, unknown> | null
}

export interface DocumentoResponse {
  id: string
  leadId: string
  documentoExternoId: string
  tipo: TipoDocumento
  papel: PapelDocumento
  tipoParentesco?: TipoParentesco | null
  cpf?: string | null
  cpfDependente?: string | null
  cnpj?: string | null
  extracaoProcessada: boolean
  aprovado: boolean
  dataUpload: string
  dataAprovacao?: string | null
  motivoReprovacao?: string | null
  nomeArquivo?: string | null
  contentType?: string | null
}
