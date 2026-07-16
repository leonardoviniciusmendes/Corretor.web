export type TipoTabela =
  | 'Adesao'
  | 'Familiar'
  | 'Individual'
  | 'PmeEmpresarial'
  | 'AdesaoPmeEmpresarial'
  | 'NaoInformado'

export interface CriarAnalisePlanosPayload {
  leadId?: string
  idades: number[]
  necessidadesCliente: string[]
  perfilCliente: string
  prioridadeVenda: string
  cep: string
  operadorasPreferidas: string[]
  tipoTabela: TipoTabela
  observacoesCorretor: string
}

export interface CriarAnalisePlanosResponse {
  tokenConsulta: string
}

export interface AnalisePlanosStatusResponse {
  tokenConsulta?: string
  status: string
  mensagem?: string | null
  erro?: string | null
}

export interface PlanoResumo {
  plano?: string | null
  operadora?: string | null
  tipoTabela?: string | null
  valorTotal?: number | null
  papelComercial?: string | null
  justificativa?: string | null
  motivo?: string | null
}

export interface RankingPlano extends PlanoResumo {
  [key: string]: unknown
  posicao?: number | null
  valoresPorFaixaEtaria?: unknown
  hospitais: number
  clinicas: number
  laboratorios: number
  totalPrestadores: number
  amostraHospitais: string[]
  amostraClinicas?: string[] | null
  amostraLaboratorios?: string[] | null
  notaCliente?: number | null
  notaVenda?: number | null
  notaCustoBeneficio?: number | null
  motivoNaoEscolhidoParaCorretor?: string | null
}

export interface EstrategiaFechamento {
  maisCaroPremium?: PlanoResumo | string | null
  intermediario?: PlanoResumo | string | null
  custoBeneficio?: PlanoResumo | string | null
  maisBarato?: PlanoResumo | string | null
}

export interface MensagensCliente {
  apresentacaoOpcoes?: string | null
  fechamento?: string | null
}

export interface AnaliseCorretor {
  resumoEstrategico?: string | null
  argumentosDeVenda?: string[] | string | null
  pontosDeAtencao?: string[] | string | null
  perguntasParaQualificar?: string[] | string | null
  comoConduzirConversa?: string[] | string | null
}

export interface ObjecaoVenda {
  objecao?: string | null
  objeção?: string | null
  resposta?: string | null
}

export interface ResultadoAnalisePlanos {
  melhorParaCorretorVender?: PlanoResumo | string | null
  melhorParaCliente?: PlanoResumo | string | null
  maisEconomico?: PlanoResumo | string | null
  melhorRede?: PlanoResumo | string | null
  estrategiaFechamento?: EstrategiaFechamento | null
  ranking?: RankingPlano[] | null
  mensagensCliente?: MensagensCliente | null
  analiseCorretor?: AnaliseCorretor | null
  objecoes?: ObjecaoVenda[] | string[] | string | null
  alertas?: string[] | string | null
}
