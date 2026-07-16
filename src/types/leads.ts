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
  tokenConsultaAnalise?: string | null
  retornoAnalise?: string | null
  dataHoraEnvioAnalise?: string | null
  workflowEtapa?: 'Lead' | 'Analise' | 'Documentacao' | 'Contrato' | 'PosContrato'
}

export interface LeadAnaliseRequest {
  tokenConsulta: string
  retornoAnalise: unknown
}

export interface LeadAnaliseResponse {
  leadId: string
  tokenConsulta?: string | null
  retornoAnalise?: string | null
  dataHoraEnvioAnalise?: string | null
  workflowEtapa: 'Lead' | 'Analise' | 'Documentacao' | 'Contrato' | 'PosContrato'
}
