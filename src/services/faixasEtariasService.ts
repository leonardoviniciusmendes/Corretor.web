import { createChildResourceService } from './resourceFactory'
import type { FaixaEtariaRequest, FaixaEtariaResponse } from '@/types/faixasEtarias'

export const faixasEtariasService = createChildResourceService<FaixaEtariaResponse, FaixaEtariaRequest>(
  '/api/leads/{leadId}/faixas-etarias',
  '/api/faixas-etarias/{id}',
  '{leadId}',
  { update: true },
)
