import { createChildResourceService } from './resourceFactory'
import type { EnderecoRequest, EnderecoResponse } from '@/types/enderecos'

export const enderecosService = createChildResourceService<EnderecoResponse, EnderecoRequest>(
  '/api/clientes/{clienteId}/enderecos',
  '/api/enderecos/{id}',
  '{clienteId}',
  { update: true },
)
