import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'

/**
 * Find & replace (acceptance §3: ⌘F). The core plugin owns match computation
 * and decorations; the binding renders the panel and calls these commands.
 */

export interface FindMatch {
  from: number
  to: number
}

export interface FindReplaceState {
  query: string
  matches: FindMatch[]
  active: number
  visible: boolean
}

interface FindReplaceStorage extends FindReplaceState {}

export const findReplaceKey = new PluginKey<FindReplaceState>('tesseraFindReplace')

function computeMatches(doc: import('@tiptap/pm/model').Node, query: string): FindMatch[] {
  if (!query) {
    return []
  }
  const matches: FindMatch[] = []
  const needle = query.toLowerCase()
  doc.descendants((node, pos) => {
    if (node.isText && node.text) {
      const haystack = node.text.toLowerCase()
      let idx = haystack.indexOf(needle)
      while (idx !== -1) {
        matches.push({ from: pos + idx, to: pos + idx + needle.length })
        idx = haystack.indexOf(needle, idx + needle.length)
      }
    }
    return true
  })
  return matches
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    findReplace: {
      openFindPanel: () => ReturnType
      closeFindPanel: () => ReturnType
      setFindQuery: (query: string) => ReturnType
      findNext: () => ReturnType
      findPrev: () => ReturnType
      replaceCurrent: (replacement: string) => ReturnType
      replaceAll: (replacement: string) => ReturnType
    }
  }
}

export const TesseraFindReplace = Extension.create<Record<string, never>, FindReplaceStorage>({
  name: 'tesseraFindReplace',

  addStorage() {
    return {
      query: '',
      matches: [],
      active: 0,
      visible: false,
    }
  },

  addCommands() {
    return {
      openFindPanel:
        () =>
        ({ tr, dispatch }) => {
          if (dispatch) {
            tr.setMeta(findReplaceKey, { type: 'open' })
            dispatch(tr)
          }
          return true
        },
      closeFindPanel:
        () =>
        ({ tr, dispatch }) => {
          if (dispatch) {
            tr.setMeta(findReplaceKey, { type: 'close' })
            dispatch(tr)
          }
          return true
        },
      setFindQuery:
        (query: string) =>
        ({ tr, dispatch }) => {
          if (dispatch) {
            tr.setMeta(findReplaceKey, { type: 'query', query })
            dispatch(tr)
          }
          return true
        },
      findNext:
        () =>
        ({ tr, state, dispatch }) => {
          const s = findReplaceKey.getState(state)
          if (!s || s.matches.length === 0) {
            return false
          }
          if (dispatch) {
            tr.setMeta(findReplaceKey, { type: 'active', active: (s.active + 1) % s.matches.length })
            dispatch(tr)
          }
          return true
        },
      findPrev:
        () =>
        ({ tr, state, dispatch }) => {
          const s = findReplaceKey.getState(state)
          if (!s || s.matches.length === 0) {
            return false
          }
          if (dispatch) {
            tr.setMeta(findReplaceKey, {
              type: 'active',
              active: (s.active - 1 + s.matches.length) % s.matches.length,
            })
            dispatch(tr)
          }
          return true
        },
      replaceCurrent:
        (replacement: string) =>
        ({ state, tr, dispatch }) => {
          const s = findReplaceKey.getState(state)
          if (!s || s.matches.length === 0) {
            return false
          }
          const m = s.matches[s.active]
          if (!m) {
            return false
          }
          if (dispatch) {
            tr.insertText(replacement, m.from, m.to)
            tr.setMeta(findReplaceKey, { type: 'requery' })
            dispatch(tr)
          }
          return true
        },
      replaceAll:
        (replacement: string) =>
        ({ state, tr, dispatch }) => {
          const s = findReplaceKey.getState(state)
          if (!s || s.matches.length === 0) {
            return false
          }
          if (dispatch) {
            for (let i = s.matches.length - 1; i >= 0; i--) {
              const m = s.matches[i]
              tr.insertText(replacement, m.from, m.to)
            }
            tr.setMeta(findReplaceKey, { type: 'requery' })
            dispatch(tr)
          }
          return true
        },
    }
  },

  addProseMirrorPlugins() {
    return [
      new Plugin<FindReplaceState>({
        key: findReplaceKey,
        state: {
          init: (): FindReplaceState => ({ query: '', matches: [], active: 0, visible: false }),
          apply: (tr, prev, _oldState, newState) => {
            const meta = tr.getMeta(findReplaceKey) as
              | { type: 'open' | 'close' | 'requery' }
              | { type: 'query'; query: string }
              | { type: 'active'; active: number }
              | undefined
            let next: FindReplaceState | null = null
            if (meta?.type === 'open') {
              next = { ...prev, visible: true }
            } else if (meta?.type === 'close') {
              next = { ...prev, visible: false, matches: [], query: '', active: 0 }
            } else if (meta?.type === 'query') {
              const matches = computeMatches(newState.doc, meta.query)
              next = { query: meta.query, matches, active: 0, visible: true }
            } else if (meta?.type === 'active') {
              next = { ...prev, active: meta.active }
            } else if (meta?.type === 'requery') {
              next = { ...prev, matches: [], active: 0 }
            }

            if (!next) {
              // doc changed outside our commands: recompute if a query is live
              if (prev.query && prev.visible && tr.docChanged) {
                const matches = computeMatches(newState.doc, prev.query)
                return { ...prev, matches, active: 0 }
              }
              return prev
            }
            // mirror state into editor storage for reactive UI
            this.storage.query = next.query
            this.storage.matches = next.matches
            this.storage.active = next.active
            this.storage.visible = next.visible
            return next
          },
        },
        props: {
          decorations(state) {
            const s = findReplaceKey.getState(state)
            if (!s || !s.visible || s.matches.length === 0) {
              return DecorationSet.empty
            }
            const decorations = s.matches.map((m, i) =>
              Decoration.inline(m.from, m.to, {
                class: i === s.active ? 'tessera-find-match tessera-find-match--active' : 'tessera-find-match',
              }),
            )
            return DecorationSet.create(state.doc, decorations)
          },
        },
      }),
    ]
  },
})

export type { FindReplaceStorage }
