export interface JuridicaResponse {
  id: string
  clienteId: string
}

export interface PessoaJuridicaResponse {
  id: string
  nomeEmpresa: string
  cnpj: string
  ie: string
  email?: string | null
  telefone?: string | null
  dataAbertura: string
}
