import { Extension } from '@tiptap/core'

/**
 * Injected services (ADR-0001 family): the component family never performs
 * network or storage I/O itself. Hosts provide implementations through the
 * binding; the editor reads them from `editor.storage.tesseraServices`.
 */

export interface UploadedAsset {
  url: string
  name?: string
  mime?: string
}

export interface UploadService {
  uploadImage(file: File | Blob): Promise<UploadedAsset>
  uploadFile?(file: File | Blob): Promise<UploadedAsset>
}

/** v1.1: inline comments. */
export interface CommentEntry {
  id: string
  authorId: string
  authorName: string
  text: string
  ts: number
}

export interface CommentThread {
  id: string
  quote: string
  resolved: boolean
  createdAt: number
  entries: CommentEntry[]
}

export interface CommentStore {
  list(): Promise<CommentThread[]>
  upsert(thread: CommentThread): Promise<void>
  remove(id: string): Promise<void>
}

/** v1.1: who is editing (comment authorship). */
export interface IdentityService {
  getCurrentUser(): { id: string; name: string } | null
}

export interface TesseraServicesStorage {
  upload?: UploadService
  comments?: CommentStore
  identity?: IdentityService
}

export const TesseraServices = Extension.create({
  name: 'tesseraServices',

  addStorage() {
    return {
      upload: undefined,
      comments: undefined,
      identity: undefined,
    } satisfies TesseraServicesStorage
  },
})

type ServicesEditor = { storage: unknown }

function servicesBag(editor: ServicesEditor): TesseraServicesStorage | undefined {
  return (editor.storage as Record<string, TesseraServicesStorage | undefined>).tesseraServices
}

export function getUploadService(editor: ServicesEditor): UploadService | undefined {
  return servicesBag(editor)?.upload
}

export function getCommentStore(editor: ServicesEditor): CommentStore | undefined {
  return servicesBag(editor)?.comments
}

export function getIdentityService(editor: ServicesEditor): IdentityService | undefined {
  return servicesBag(editor)?.identity
}
