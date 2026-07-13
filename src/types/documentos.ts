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
  categoria?: DocumentoCategoria
  tipoIdentificacao?: DocumentoIdentificacaoTipo
  tipoEndereco?: DocumentoEnderecoTipo
  documentoDe?: DocumentoDe
  dataUpload?: string | null
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

export interface DocumentoResponse extends DocumentoMetadataRequest {
  id: string
  leadId: string
  nomeArquivo?: string | null
  nomeArquivoArmazenado?: string | null
  contentType?: string | null
  tamanhoBytes: number
  caminhoArquivo?: string | null
}
