import { toApiError } from './http/errorHandler'
import type {
  AnalisePlanosStatusResponse,
  CriarAnalisePlanosPayload,
  CriarAnalisePlanosResponse,
  ResultadoAnalisePlanos,
} from '@/types/analisePlanos'

const analisePlanosApiUrl = import.meta.env.VITE_ANALISE_PLANOS_API_URL ?? 'https://localhost:7225'

function buildUrl(path: string) {
  const base = String(analisePlanosApiUrl || 'https://localhost:7225').replace(/\/$/, '')
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${base}${normalizedPath}`
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers)

  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  let response: Response
  try {
    response = await fetch(buildUrl(path), { ...init, headers })
  } catch {
    throw new Error('Nao foi possivel conectar a API de analise. Verifique se https://localhost:7225 esta em execucao.')
  }

  if (!response.ok) {
    throw await toApiError(response)
  }

  if (response.status === 204) {
    return undefined as T
  }

  const text = await response.text()
  return text ? (JSON.parse(text) as T) : (undefined as T)
}

export const analisePlanosApi = {
  criarAnalise(payload: CriarAnalisePlanosPayload) {
    return request<CriarAnalisePlanosResponse>('/api/analises-comerciais', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },
  obterStatus(tokenConsulta: string) {
    return request<AnalisePlanosStatusResponse>(`/api/analises-comerciais/${encodeURIComponent(tokenConsulta)}/status`)
  },
  obterResultado(tokenConsulta: string) {
    return request<ResultadoAnalisePlanos>(`/api/analises-comerciais/${encodeURIComponent(tokenConsulta)}/resultado`)
  },
}
