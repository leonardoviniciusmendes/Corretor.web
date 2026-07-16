export type ScriptEtapa =
  | 'CriacaoLead'
  | 'ConversaInicial'
  | 'FaixaEtaria'
  | 'EnvioAnalise'
  | 'RetornoContato'
  | 'AprovacaoAnalise'
  | 'Documentacao'
  | 'Contrato'
  | 'PosContrato'

export const scriptEtapas: ScriptEtapa[] = [
  'CriacaoLead',
  'ConversaInicial',
  'FaixaEtaria',
  'EnvioAnalise',
  'RetornoContato',
  'AprovacaoAnalise',
  'Documentacao',
  'Contrato',
  'PosContrato',
]

export interface ScriptRequest {
  etapa?: ScriptEtapa | null
  tipo?: string | null
  mensagem?: string | null
}

export interface ScriptResponse extends ScriptRequest {
  id: string
}
