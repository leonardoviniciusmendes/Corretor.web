import { createChildResourceService } from './resourceFactory'
import type { JuridicaResponse } from '@/types/juridicas'

export const juridicasService = createChildResourceService<JuridicaResponse, Record<string, never>>(
  '/api/clientes/{clienteId}/juridicas',
  '/api/juridicas/{id}',
  '{clienteId}',
)
