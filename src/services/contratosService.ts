import { createChildResourceService } from './resourceFactory'
import type { ContratoResponse } from '@/types/contratos'

export const contratosService = createChildResourceService<ContratoResponse, Record<string, never>>(
  '/api/leads/{leadId}/contratos',
  '/api/contratos/{id}',
  '{leadId}',
  { get: true },
)
