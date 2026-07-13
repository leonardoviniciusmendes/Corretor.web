import { createResourceService } from './resourceFactory'
import type { ClienteRequest, ClienteResponse } from '@/types/clientes'

export const clientesService = createResourceService<ClienteResponse, ClienteRequest>('/api/clientes', '/api/clientes/{id}')
