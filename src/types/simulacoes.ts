export interface SimulacaoRequest {
  link?: string | null
  aprovada: boolean
}

export interface SimulacaoResponse extends SimulacaoRequest {
  id: string
  leadId: string
  dataEnvio?: string | null
}
