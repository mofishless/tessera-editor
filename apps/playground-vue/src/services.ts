import type { CommentStore, IdentityService, CommentThread } from '@tessera-editor/core'

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
