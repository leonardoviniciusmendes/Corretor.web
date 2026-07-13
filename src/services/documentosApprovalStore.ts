const storageKey = 'corretor.documentos.aprovados'

function readApprovedIds() {
  try {
    const raw = window.localStorage.getItem(storageKey)
    return new Set<string>(raw ? (JSON.parse(raw) as string[]) : [])
  } catch {
    return new Set<string>()
  }
}

function writeApprovedIds(ids: Set<string>) {
  window.localStorage.setItem(storageKey, JSON.stringify(Array.from(ids)))
}

export const documentosApprovalStore = {
  isApproved(id: string) {
    return readApprovedIds().has(id)
  },
  approve(id: string) {
    const ids = readApprovedIds()
    ids.add(id)
    writeApprovedIds(ids)
  },
  remove(id: string) {
    const ids = readApprovedIds()
    ids.delete(id)
    writeApprovedIds(ids)
  },
}
