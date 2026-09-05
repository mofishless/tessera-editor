import type { StorageService, CommentStore, IdentityService, CommentThread, DocSnapshot } from '@tessera-editor/core'

/** localStorage-backed snapshot storage (playground stand-in for a real backend). */
export function createLocalStorage(): StorageService {
  const KEY = 'tessera-playground-snapshots'
  const read = (): DocSnapshot[] => {
    try {
      return JSON.parse(localStorage.getItem(KEY) ?? '[]') as DocSnapshot[]
    } catch {
      return []
    }
  }
  const write = (list: DocSnapshot[]) => localStorage.setItem(KEY, JSON.stringify(list))
  return {
    async saveSnapshot(snapshot) {
      const list = read().filter(s => s.id !== snapshot.id)
      list.push(snapshot)
      write(list.slice(-50))
    },
    async listSnapshots() {
      return read()
    },
    async deleteSnapshot(id) {
      write(read().filter(s => s.id !== id))
    },
  }
}

/** In-memory comment store (playground stand-in). */
export function createMemoryComments(): CommentStore {
  let threads: CommentThread[] = []
  return {
    async list() {
      return threads
    },
    async upsert(thread) {
      threads = threads.filter(t => t.id !== thread.id).concat(thread)
    },
    async remove(id) {
      threads = threads.filter(t => t.id !== id)
    },
  }
}

export const demoIdentity: IdentityService = {
  getCurrentUser() {
    return { id: 'u-1', name: 'Demo 用户' }
  },
}
