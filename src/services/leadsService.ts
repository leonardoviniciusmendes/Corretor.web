import { createResourceService } from './resourceFactory'
import { httpClient } from '@/services/apiClient'
import type { LeadAnaliseRequest, LeadAnaliseResponse, LeadRequest, LeadResponse } from '@/types/leads'

export const leadsService = {
  ...createResourceService<LeadResponse, LeadRequest>('/api/leads', '/api/leads/{id}'),
  registrarAnalise(leadId: string, payload: LeadAnaliseRequest) {
    return httpClient.post<LeadAnaliseResponse>(`/api/leads/${leadId}/analise`, payload)
  },
}
