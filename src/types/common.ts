export type EntityId = string

export interface ApiError {
  message: string
  status?: number
  details?: unknown
}

export interface FieldConfig<TPayload extends Record<string, unknown> = Record<string, unknown>> {
  key: keyof TPayload & string
  label: string
  type?: 'text' | 'email' | 'number' | 'textarea'
  required?: boolean
}

export interface ResourceConfig<TResponse extends Record<string, unknown>, TPayload extends Record<string, unknown>> {
  key: string
  title: string
  singular: string
  description: string
  basePath: string
  parentParam?: string
  parentLabel?: string
  createLabel?: string
  fields: FieldConfig<TPayload>[]
  columns: Array<keyof TResponse & string>
  idPrefix?: string
}

export interface ResourceService<TResponse, TPayload> {
  list(parentId?: string): Promise<TResponse[]>
  get?(id: string): Promise<TResponse>
  create(payload: TPayload, parentId?: string): Promise<TResponse>
  update?(id: string, payload: TPayload): Promise<void>
  remove(id: string): Promise<void>
}
