import { httpClient } from '@/services/apiClient'

export const fichaAssociativaService = {
  async gerarArquivo(leadId: string) {
    const response = await fetch(httpClient.url(`/api/leads/${leadId}/ficha-associativa/pdf`))
    if (!response.ok) {
      const text = await response.text()
      throw new Error(text || `Erro ${response.status} ao gerar ficha associativa.`)
    }

    const blob = await response.blob()
    return new File([blob], `ficha-associativa-${leadId}.pdf`, { type: 'application/pdf' })
  },
}
