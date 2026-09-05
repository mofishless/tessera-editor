import { Extension } from '@tiptap/core'
import type { JSONContent } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { getStorageService, type DocSnapshot } from '../services'

/**
 * Version history capture (v1.1): snapshots the canonical JSON into the
 * injected StorageService. Auto-capture fires after `idleMs` of inactivity
 * (Slite: 5 minutes); manual capture is always available as a command.
 */

export interface HistorySnapshotOptions {
  /** idle window before auto-capture (default 5 minutes) */
  idleMs?: number
  /** minimum ms between two auto-captures (default 60s) */
  minIntervalMs?: number
  /** snapshot label source */
  label?: () => string | undefined
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    tesseraHistory: {
      captureSnapshot: (label?: string) => ReturnType
    }
  }
  interface EditorEvents {
    'tessera:snapshotSaved': { snapshot: DocSnapshot }
  }
}

export const historyKey = new PluginKey('tesseraHistory')

export const TesseraHistory = Extension.create<HistorySnapshotOptions>({
  name: 'tesseraHistory',

  addOptions() {
    return {
      idleMs: 5 * 60 * 1000,
      minIntervalMs: 60 * 1000,
      label: undefined,
    }
  },

  addCommands() {
    return {
      captureSnapshot:
        (label?: string) =>
        ({ editor, state }) => {
          const storage = getStorageService(editor)
          if (!storage) {
            return false
          }
          const doc = editor.getJSON() as JSONContent
          const snapshot: DocSnapshot = {
            id: `snap-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
            ts: Date.now(),
            doc,
            label: label ?? this.options.label?.(),
          }
          void storage.saveSnapshot(snapshot).then(() => {
            editor.emit('tessera:snapshotSaved', { snapshot })
          })
          const tr = state.tr.setMeta(historyKey, { type: 'captured', ts: snapshot.ts })
          editor.view.dispatch(tr)
          return true
        },
    }
  },

  addProseMirrorPlugins() {
    const editor = this.editor
    const options = this.options
    return [
      new Plugin({
        key: historyKey,
        state: {
          init: () => ({ lastChange: 0, lastCapture: 0, timer: null as ReturnType<typeof setTimeout> | null }),
          apply: (tr, prev) => {
            const meta = tr.getMeta(historyKey) as { type: string; ts?: number } | undefined
            if (meta?.type === 'captured') {
              return { ...prev, lastCapture: meta.ts ?? Date.now() }
            }
            if (!tr.docChanged) {
              return prev
            }
            return { ...prev, lastChange: Date.now() }
          },
        },
        view() {
          return {
            update: (_view, prevState) => {
              const before = historyKey.getState(prevState)
              const after = historyKey.getState(editor.state)
              if (!before || !after || after.lastChange === before.lastChange) {
                return
              }
              const storage = getStorageService(editor)
              if (!storage) {
                return
              }
              const s = historyKey.getState(editor.state)
              if (s?.timer) {
                clearTimeout(s.timer)
              }
              const timer = setTimeout(() => {
                const now = Date.now()
                const cur = historyKey.getState(editor.state)
                if (!cur || now - cur.lastChange < options.idleMs! - 50) {
                  return
                }
                if (now - cur.lastCapture < options.minIntervalMs!) {
                  return
                }
                editor.commands.captureSnapshot()
              }, options.idleMs!)
              const st = historyKey.getState(editor.state)
              if (st) {
                st.timer = timer
              }
            },
            destroy() {
              const s = historyKey.getState(editor.state)
              if (s?.timer) {
                clearTimeout(s.timer)
              }
            },
          }
        },
      }),
    ]
  },
})
