import { createChildResourceService } from './resourceFactory'
import type { DependenteResponse } from '@/types/pessoas'

export const dependentesService = createChildResourceService<DependenteResponse, Record<string, never>>(
  '/api/pessoas-fisicas/{pessoaId}/dependentes',
  '/api/dependentes/{id}',
  '{pessoaId}',
)
