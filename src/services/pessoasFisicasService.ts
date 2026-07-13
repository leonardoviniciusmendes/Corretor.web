import { createResourceService } from './resourceFactory'
import type { PessoaFisicaRequest, PessoaFisicaResponse } from '@/types/pessoas'

export const pessoasFisicasService = createResourceService<PessoaFisicaResponse, PessoaFisicaRequest>(
  '/api/pessoas-fisicas',
  '/api/pessoas-fisicas/{id}',
)
