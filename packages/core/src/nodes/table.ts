import type { Node as PMNode } from '@tiptap/pm/model'
import { Plugin } from '@tiptap/pm/state'
import type { EditorState } from '@tiptap/pm/state'
import type { EditorProps as PMEditorProps } from '@tiptap/pm/view'
import { Table, TableRow, TableCell, TableHeader } from '@tiptap/extension-table'

/**
 * Typed-column table (v1.1 quality focus — Slite's worst-reviewed feature is
 * our opportunity). Column kinds live on the table node (`types`, indexed by
 * column position); cell values for non-text kinds live on the cell attr
 * `value`. Text columns keep rich inline content in the cell itself.
 *
 * Deliberately NOT supported (per Slite teardown §3.6): cell merging and
 * in-cell calculations.
 */

export type TableColumnKind =
  | 'text'
  | 'checkbox'
  | 'select'
  | 'multiSelect'
  | 'number'
  | 'date'
  | 'link'

export const TABLE_COLUMN_KINDS: TableColumnKind[] = [
  'text',
  'checkbox',
  'select',
  'multiSelect',
  'number',
  'date',
  'link',
]

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    tesseraTable: {
      /** Insert a typed table. Kinds default to `text` for every column. */
      insertTableTyped: (options?: { rows?: number; cols?: number; withHeaderRow?: boolean }) => ReturnType
      /** Change the kind of column `index` (0-based). */
      setColumnType: (index: number, kind: TableColumnKind) => ReturnType
      /** Stable-sort body rows by column `index`. */
      sortTableByColumn: (index: number, direction: 'asc' | 'desc') => ReturnType
      /** Strip stray hidden text from every typed (non-text) cell. */
      normalizeTypedCells: () => ReturnType
    }
  }
}

/** CSV of the table containing the caret (utility, not a command). */
export function tableToCsvAt(editor: import('@tiptap/core').Editor): string | null {
  const table = locateTable(editor.state)
  return table ? tableNodeToCsv(table.node) : null
}

function locateTable(state: EditorState): { pos: number; node: PMNode } | null {
  const { $from } = state.selection
  for (let depth = $from.depth; depth > 0; depth--) {
    const node = $from.node(depth)
    if (node.type.name === 'table') {
      return { pos: $from.before(depth), node }
    }
  }
  return null
}

function columnCount(table: PMNode): number {
  const firstRow = table.content.firstChild
  return firstRow ? firstRow.childCount : 0
}

export function normalizeTypes(types: unknown, cols: number): TableColumnKind[] {
  const list = Array.isArray(types) ? ([...types] as TableColumnKind[]) : []
  while (list.length < cols) {
    list.push('text')
  }
  return list.slice(0, cols)
}

/** Kind of the column containing doc position `pos`; null outside table
 * cells and for header cells (headers stay plain text by design). */
export function cellKindAt(doc: PMNode, pos: number): TableColumnKind | null {
  const $pos = doc.resolve(pos)
  let tableDepth = -1
  for (let depth = $pos.depth; depth > 0; depth--) {
    if ($pos.node(depth).type.name === 'table') {
      tableDepth = depth
      break
    }
  }
  if (tableDepth < 1 || $pos.depth < tableDepth + 2) {
    return null
  }
  const cell = $pos.node(tableDepth + 2)
  if (cell.type.name !== 'tableCell') {
    return null
  }
  const table = $pos.node(tableDepth)
  const col = $pos.index(tableDepth + 1)
  return normalizeTypes(table.attrs.types, columnCount(table))[col] ?? 'text'
}

/** Content ranges of every typed (non-text) body cell — the text caret must
 * not enter them; the type widget owns that content. */
function typedCellRanges(doc: PMNode): { from: number; to: number }[] {
  const out: { from: number; to: number }[] = []
  doc.descendants((node, pos) => {
    if (node.type.name !== 'table') {
      return
    }
    const types = normalizeTypes(node.attrs.types, columnCount(node))
    node.forEach((row, rowOff) => {
      let col = 0
      row.forEach((cell, cellOff) => {
        const kind = types[col]
        if (cell.type.name === 'tableCell' && kind && kind !== 'text') {
          const base = pos + 1 + rowOff + 1 + cellOff
          out.push({ from: base + 1, to: base + cell.nodeSize - 1 })
        }
        col += 1
      })
    })
  })
  return out
}

/** Wipe the hidden paragraph text of body cells in column `index` (same
 * transaction) — used when a column becomes a typed column. */
function clearColumnCellText(
  tr: import('@tiptap/pm/state').Transaction,
  schema: import('@tiptap/pm/model').Schema,
  table: { pos: number; node: PMNode },
  index: number,
): void {
  table.node.forEach((row, rowOff) => {
    let col = 0
    row.forEach((cell, cellOff) => {
      if (col === index && cell.type.name === 'tableCell' && cell.textContent.trim()) {
        const base = table.pos + 1 + rowOff + 1 + cellOff
        tr.replaceWith(base + 1, base + cell.nodeSize - 1, schema.nodes.paragraph!.create(null))
      }
      col += 1
    })
  })
}

function cellSortValue(row: PMNode, index: number, kind: TableColumnKind): string | number | boolean | null {
  const cell = row.maybeChild(index)
  if (!cell) {
    return null
  }
  const value = cell.attrs.value as unknown
  switch (kind) {
    case 'checkbox':
      return value === true || value === 'true'
    case 'number': {
      if (typeof value === 'number') {
        return value
      }
      const parsed = Number(String(value ?? cell.textContent).trim())
      return Number.isFinite(parsed) ? parsed : null
    }
    case 'date':
      return typeof value === 'string' && value ? value : null
    case 'select':
      return Array.isArray(value) ? ((value as string[])[0] ?? null) : ((value as string) ?? null)
    case 'multiSelect':
      return Array.isArray(value) ? [...(value as string[])].sort().join(' ‧ ') : null
    default:
      return cell.textContent.trim() || null
  }
}

function csvEscape(text: string): string {
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`
  }
  return text
}

/** Serialize a table node to CSV (text form of typed values). */
export function tableNodeToCsv(table: PMNode): string {
  const types = normalizeTypes(table.attrs.types, columnCount(table))
  const lines: string[] = []
  table.forEach(row => {
    const isHeaderRow = row.content.firstChild?.type.name === 'tableHeader'
    const cells: string[] = []
    row.forEach((cell, _offset, index) => {
      // header cells are labels — always plain text regardless of column kind
      const kind = isHeaderRow ? 'text' : (types[index] ?? 'text')
      const value = cell.attrs.value as unknown
      let text: string
      switch (kind) {
        case 'checkbox':
          text = value === true || value === 'true' ? '✔' : ''
          break
        case 'select':
        case 'multiSelect':
          text = Array.isArray(value) ? (value as string[]).join(' / ') : String(value ?? '')
          break
        case 'date':
          text = String(value ?? '')
          break
        case 'number':
        case 'link':
          text = value === null || value === undefined ? cell.textContent : String(value)
          break
        default:
          text = cell.textContent
      }
      cells.push(csvEscape(text.trim()))
    })
    lines.push(cells.join(','))
  })
  return lines.join('\n')
}

export const AiTable = Table.extend({
  name: 'table',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        props: {
          // typed cells are owned by their widget: never let the text caret
          // enter the hidden paragraph, type or paste into it, and make
          // cursor movement skip the cell as an atomic unit
          handleTextInput: (view, from) => {
            const kind = cellKindAt(view.state.doc, from)
            return kind !== null && kind !== 'text'
          },
          handlePaste: view => {
            const kind = cellKindAt(view.state.doc, view.state.selection.from)
            return kind !== null && kind !== 'text'
          },
          handleClick: (view, pos) => {
            const kind = cellKindAt(view.state.doc, pos)
            return kind !== null && kind !== 'text'
          },
          atomicRanges: (state: EditorState) => typedCellRanges(state.doc),
        } as PMEditorProps,
      }),
    ]
  },

  addAttributes() {
    return {
      ...this.parent?.(),
      types: {
        default: [] as TableColumnKind[],
        parseHTML: element => {
          try {
            const raw = element.getAttribute('data-types')
            return raw ? (JSON.parse(raw) as TableColumnKind[]) : []
          } catch {
            return []
          }
        },
        renderHTML: attributes => ({
          'data-types': JSON.stringify(attributes.types ?? []),
        }),
      },
      freezeFirstCol: {
        default: true,
        parseHTML: element => element.getAttribute('data-freeze-first') !== 'false',
        renderHTML: attributes => ({ 'data-freeze-first': String(attributes.freezeFirstCol) }),
      },
    }
  },

  addCommands() {
    const parent = this.parent?.() ?? {}
    return {
      ...parent,
      insertTableTyped:
        (options = {}) =>
        ({ commands }) =>
          commands.insertTable({
            rows: options.rows ?? 3,
            cols: options.cols ?? 3,
            withHeaderRow: options.withHeaderRow ?? true,
          }),
      setColumnType:
        (index: number, kind: TableColumnKind) =>
        ({ state, dispatch, tr }) => {
          const table = locateTable(state)
          if (!table || index < 0 || index >= columnCount(table.node)) {
            return false
          }
          const types = normalizeTypes(table.node.attrs.types, columnCount(table.node))
          types[index] = kind
          if (dispatch) {
            tr.setNodeMarkup(table.pos, undefined, { ...table.node.attrs, types })
            // the widget owns the content of typed cells from now on — drop
            // any stray hidden text the column may still carry
            if (kind !== 'text') {
              clearColumnCellText(tr, state.schema, table, index)
            }
            dispatch(tr)
          }
          return true
        },
      normalizeTypedCells:
        () =>
        ({ state, dispatch, tr }) => {
          const edits: { from: number; to: number }[] = []
          state.doc.descendants((node, pos) => {
            if (node.type.name !== 'table') {
              return
            }
            const types = normalizeTypes(node.attrs.types, columnCount(node))
            node.forEach((row, rowOff) => {
              let col = 0
              row.forEach((cell, cellOff) => {
                const kind = types[col]
                if (cell.type.name === 'tableCell' && kind && kind !== 'text' && cell.textContent.trim()) {
                  const base = pos + 1 + rowOff + 1 + cellOff
                  edits.push({ from: base + 1, to: base + cell.nodeSize - 1 })
                }
                col += 1
              })
            })
          })
          if (dispatch && edits.length) {
            for (const e of [...edits].reverse()) {
              tr.replaceWith(e.from, e.to, state.schema.nodes.paragraph!.create(null))
            }
            dispatch(tr)
          }
          return edits.length > 0
        },
      sortTableByColumn:
        (index: number, direction: 'asc' | 'desc') =>
        ({ state, dispatch, tr }) => {
          const table = locateTable(state)
          if (!table) {
            return false
          }
          const rows: PMNode[] = []
          table.node.forEach(row => rows.push(row))
          const hasHeader = rows.length > 0 && rows[0]!.content.firstChild?.type.name === 'tableHeader'
          const header = hasHeader ? rows[0]! : null
          const body = hasHeader ? rows.slice(1) : rows.slice()
          if (body.length === 0 || index >= columnCount(table.node)) {
            return false
          }
          const types = normalizeTypes(table.node.attrs.types, columnCount(table.node))
          const kind = types[index] ?? 'text'
          const dir = direction === 'asc' ? 1 : -1
          const sorted = [...body].sort((a, b) => {
            const va = cellSortValue(a, index, kind)
            const vb = cellSortValue(b, index, kind)
            if (va === vb) {
              return 0
            }
            if (va === null) {
              return 1
            }
            if (vb === null) {
              return -1
            }
            return va < vb ? -dir : dir
          })
          const start = table.pos + 1 + (header ? header.nodeSize : 0)
          const end = table.pos + table.node.nodeSize - 1
          if (dispatch) {
            tr.replaceWith(start, end, sorted)
            dispatch(tr)
          }
          return true
        },
    }
  },
})

export { TableRow as AiTableRow }

function valueAttr() {
  return {
    default: null,
    parseHTML: (element: HTMLElement) => {
      const raw = element.getAttribute('data-value')
      if (raw === null || raw === '') {
        return null
      }
      try {
        return JSON.parse(raw)
      } catch {
        return raw
      }
    },
    renderHTML: (attributes: Record<string, unknown>) => ({
      'data-value':
        attributes.value === null || attributes.value === undefined ? '' : JSON.stringify(attributes.value),
    }),
  }
}

export const AiTableCell = TableCell.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      value: valueAttr(),
    }
  },
})

export const AiTableHeader = TableHeader.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      value: valueAttr(),
    }
  },
})
