import type { DocumentoDadosExtraidos, DocumentoExternoUploadResponse } from '@/types/documentos'

const storageKey = 'corretor.documentos.externos'

export interface DocumentoExternoVinculo {
  documentoExternoId: string
  extracaoProcessada: boolean
  dadosExtraidos?: DocumentoDadosExtraidos | null
  reprocessarUrl?: string | null
  atualizadoEm: string
}

function readMap() {
  try {
    const raw = window.localStorage.getItem(storageKey)
    return raw ? (JSON.parse(raw) as Record<string, DocumentoExternoVinculo>) : {}
  } catch {
    return {}
  }
}

function writeMap(map: Record<string, DocumentoExternoVinculo>) {
  window.localStorage.setItem(storageKey, JSON.stringify(map))
}

export const documentosExternosStore = {
  get(documentoId: string) {
    return readMap()[documentoId] ?? null
  },

  save(documentoId: string, response: DocumentoExternoUploadResponse) {
    const map = readMap()
    map[documentoId] = {
      documentoExternoId: response.id,
      extracaoProcessada: response.extracaoProcessada,
      dadosExtraidos: response.dadosExtraidos ?? null,
      reprocessarUrl: response.reprocessarUrl,
      atualizadoEm: new Date().toISOString(),
    }
    writeMap(map)
    return map[documentoId]
  },

  updateDados(documentoId: string, dadosExtraidos: DocumentoDadosExtraidos | null, extracaoProcessada = true) {
    const map = readMap()
    const current = map[documentoId]
    if (!current) return null
    map[documentoId] = {
      ...current,
      extracaoProcessada,
      dadosExtraidos,
      atualizadoEm: new Date().toISOString(),
    }
    writeMap(map)
    return map[documentoId]
  },

  remove(documentoId: string) {
    const map = readMap()
    delete map[documentoId]
    writeMap(map)
  },
}
