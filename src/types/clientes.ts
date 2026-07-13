export interface ClienteRequest {
  leadId: string
  pessoaFisicaId?: string | null
  pessoaJuridicaId?: string | null
}

export interface ClienteResponse {
  id: string
  leadId: string
  pessoaFisicaId?: string | null
  pessoaJuridicaId?: string | null
}
