export interface LeadRequest {
  nome?: string | null
  telefone?: string | null
  quantidadeVidas: number
  operadora?: string | null
  email?: string | null
}

export interface LeadResponse extends LeadRequest {
  id: string
  dataEnvio?: string | null
  dataRetorno?: string | null
  dataAprovacao?: string | null
}
