import { createResourceService } from './resourceFactory'
import type { PessoaJuridicaResponse } from '@/types/juridicas'

export const pessoasJuridicasService = createResourceService<PessoaJuridicaResponse, Record<string, never>>(
  '/api/pessoas-juridicas',
  '/api/pessoas-juridicas/{id}',
)
