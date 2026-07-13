export type DocumentoCategoria = 'Identificacao' | 'Endereco'
export type DocumentoIdentificacaoTipo = 'Cnpj' | 'Cnh' | 'Certidao'
export type DocumentoEnderecoTipo = 'ContaDeLuz' | 'ContaDeAgua' | 'ContaDeTelefone'
export type DocumentoDe = 'Titular' | 'Dependente' | 'Empresa'

export const documentoCategorias: DocumentoCategoria[] = ['Identificacao', 'Endereco']
export const documentoIdentificacaoTipos: DocumentoIdentificacaoTipo[] = ['Cnpj', 'Cnh', 'Certidao']
export const documentoEnderecoTipos: DocumentoEnderecoTipo[] = ['ContaDeLuz', 'ContaDeAgua', 'ContaDeTelefone']
export const documentoDeOpcoes: DocumentoDe[] = ['Titular', 'Dependente', 'Empresa']

export interface DocumentoMetadataRequest {
  categoria?: DocumentoCategoria
  tipoIdentificacao?: DocumentoIdentificacaoTipo
  tipoEndereco?: DocumentoEnderecoTipo
  documentoDe?: DocumentoDe
  dataUpload?: string | null
}

export interface DocumentoUploadRequest {
  categoria?: DocumentoCategoria
  tipoIdentificacao?: DocumentoIdentificacaoTipo
  tipoEndereco?: DocumentoEnderecoTipo
  documentoDe?: DocumentoDe
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
