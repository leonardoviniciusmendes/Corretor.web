import type { ApiError } from '@/types/common'

export async function toApiError(response: Response): Promise<ApiError> {
  const contentType = response.headers.get('content-type') ?? ''
  let details: unknown

  try {
    details = contentType.includes('application/json') ? await response.json() : await response.text()
  } catch {
    details = undefined
  }

  const detailMessage =
    typeof details === 'object' && details !== null
      ? String((details as { message?: unknown; mensagem?: unknown }).message ?? (details as { mensagem?: unknown }).mensagem ?? '')
      : undefined

  return {
    message: detailMessage || `Erro ${response.status} ao chamar a API`,
    status: response.status,
    details,
  }
}

export function getErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return String((error as { message?: unknown }).message)
  }

  return 'Nao foi possivel concluir a operacao.'
}
