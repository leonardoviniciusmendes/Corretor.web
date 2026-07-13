export interface HistoricoRequest {
  etapa?: string | null
  data?: string | null
  tipo?: string | null
  mensagem?: string | null
}

export interface HistoricoResponse extends HistoricoRequest {
  id: string
  leadId: string
}
