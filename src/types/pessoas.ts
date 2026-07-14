export interface PessoaRequest {
  nome?: string | null
  cpf?: string | null
  email?: string | null
  telefone?: string | null
  faixaEtaria?: string | null
}

export interface PessoaResponse extends PessoaRequest {
  id: string
  clienteId: string
}

export interface PessoaFisicaRequest {
  nome: string
  cpf: string
  email?: string | null
  telefone?: string | null
  faixaEtaria?: string | null
  dataNascimento?: string | null
  nomeMae?: string | null
  nomePai?: string | null
}

export interface PessoaFisicaResponse extends PessoaFisicaRequest {
  id: string
}

export interface DependenteResponse {
  id: string
  pessoaId?: string
  pessoaFisicaId?: string
  nome?: string | null
  nomeCompleto?: string | null
  cpf?: string | null
  tipoParentesco?: string | null
  dataNascimento?: string | null
  nomeMae?: string | null
  nomePai?: string | null
}
