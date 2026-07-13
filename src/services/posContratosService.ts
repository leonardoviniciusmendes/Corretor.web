import { createChildResourceService } from './resourceFactory'
import type { PosContratoResponse } from '@/types/contratos'

export const posContratosService = createChildResourceService<PosContratoResponse, Record<string, never>>(
  '/api/contratos/{contratoId}/pos-contratos',
  '/api/pos-contratos/{id}',
  '{contratoId}',
)
