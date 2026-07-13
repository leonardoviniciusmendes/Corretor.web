import { createResourceService } from './resourceFactory'
import type { LeadRequest, LeadResponse } from '@/types/leads'

export const leadsService = createResourceService<LeadResponse, LeadRequest>('/api/leads', '/api/leads/{id}')
