import { createChildResourceService } from './resourceFactory'
import type { SimulacaoRequest, SimulacaoResponse } from '@/types/simulacoes'

export const simulacoesService = createChildResourceService<SimulacaoResponse, SimulacaoRequest>(
  '/api/leads/{leadId}/simulacoes',
  '/api/simulacoes/{id}',
  '{leadId}',
  { get: true, update: true },
)
