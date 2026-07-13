import { httpClient } from '@/services/apiClient'
import type { ResourceService } from '@/types/common'

export function createResourceService<TResponse, TPayload>(
  listPath: string,
  itemPath: string,
): ResourceService<TResponse, TPayload> {
  return {
    list() {
      return httpClient.get<TResponse[]>(listPath)
    },
    get(id: string) {
      return httpClient.get<TResponse>(itemPath.replace('{id}', id))
    },
    create(payload: TPayload) {
      return httpClient.post<TResponse>(listPath, payload)
    },
    update(id: string, payload: TPayload) {
      return httpClient.put<void>(itemPath.replace('{id}', id), payload)
    },
    remove(id: string) {
      return httpClient.delete<void>(itemPath.replace('{id}', id))
    },
  }
}

export function createChildResourceService<TResponse, TPayload>(
  listPath: string,
  itemPath: string,
  parentToken: string,
  options: { get?: boolean; update?: boolean } = {},
): ResourceService<TResponse, TPayload> {
  return {
    list(parentId?: string) {
      if (!parentId) return Promise.resolve([])
      return httpClient.get<TResponse[]>(listPath.replace(parentToken, parentId))
    },
    get: options.get
      ? (id: string) => httpClient.get<TResponse>(itemPath.replace('{id}', id))
      : undefined,
    create(payload: TPayload, parentId?: string) {
      if (!parentId) return Promise.reject(new Error('Informe o ID do recurso pai.'))
      return httpClient.post<TResponse>(listPath.replace(parentToken, parentId), payload)
    },
    update: options.update
      ? (id: string, payload: TPayload) => httpClient.put<void>(itemPath.replace('{id}', id), payload)
      : undefined,
    remove(id: string) {
      return httpClient.delete<void>(itemPath.replace('{id}', id))
    },
  }
}
