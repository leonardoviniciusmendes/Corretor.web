import { createChildResourceService } from './resourceFactory'
import type { PessoaRequest, PessoaResponse } from '@/types/pessoas'

export const pessoasService = createChildResourceService<PessoaResponse, PessoaRequest>(
  '/api/clientes/{clienteId}/pessoas',
  '/api/pessoas/{id}',
  '{clienteId}',
  { get: true, update: true },
)
