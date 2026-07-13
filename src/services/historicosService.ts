import { createChildResourceService } from './resourceFactory'
import type { HistoricoRequest, HistoricoResponse } from '@/types/historicos'

export const historicosService = createChildResourceService<HistoricoResponse, HistoricoRequest>(
  '/api/leads/{leadId}/historicos',
  '/api/historicos/{id}',
  '{leadId}',
  { update: true },
)
