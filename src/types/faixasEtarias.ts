export interface FaixaEtariaRequest {
  faixa?: string | null
  quantidade: number
}

export interface FaixaEtariaResponse extends FaixaEtariaRequest {
  id: string
  leadId: string
}
