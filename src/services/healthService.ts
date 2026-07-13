import { httpClient } from '@/services/apiClient'

export const healthService = {
  check() {
    return httpClient.get<void>('/health')
  },
}
