import { useContext, useState } from 'react'
import { NodeViewWrapper, NodeViewContent, ReactNodeViewRenderer } from '@tiptap/react'
import type { NodeViewProps } from '@tiptap/react'
import {
  AiTableCell,
  AiTableHeader,
  TABLE_COLUMN_KINDS,
  tableToCsvAt,
} from '@tessera-editor/core'
import type { TableColumnKind } from '@tessera-editor/core'
import { TesseraContext } from './context'

/**
 * Table NodeViews (v1.1):
 * - header cell: label + ⋮ column menu (type / sort / insert / delete / table ops)
 * - body cell: typed controls for non-text columns, plain content for text
 */

function useT() {
  const { t } = useContext(TesseraContext)!
  return t
}
void useT

function kindLabel(t: ReturnType<typeof useT>, kind: TableColumnKind): string {
  switch (kind) {
    case 'checkbox':
      return t('colTypeCheckbox')
    case 'select':
      return t('colTypeSelect')
    case 'multiSelect':
      return t('colTypeMultiSelect')
    case 'number':
      return t('colTypeNumber')
    case 'date':
      return t('colTypeDate')
    case 'link':
      return t('colTypeLink')
    default:
      return t('colTypeText')
  }
}

function columnIndex(props: NodeViewProps): number {
  const pos = props.getPos()
  if (typeof pos !== 'number') {
    return 0
  }
  const $pos = props.editor.state.doc.resolve(pos)
  return $pos.index($pos.depth)
}

/** Header cell with the column menu. */
function AiTableHeaderView(props: NodeViewProps) {
  const { editor, t } = useContext(TesseraContext)!
  const [open, setOpen] = useState(false)
  const index = columnIndex(props)

  const run = (fn: () => unknown) => {
    setOpen(false)
    // re-select into this cell so table commands locate the table
    const pos = props.getPos()
    if (typeof pos === 'number') {
      editor.commands.setTextSelection(pos + 2)
    }
    void fn()
  }

  return (
    <NodeViewWrapper as="th" className="tessera-th" data-index={index}>
      <NodeViewContent className="tessera-th-content" />
      <button
        type="button"
        className="tessera-col-menu-btn"
        contentEditable={false}
        title={t('colMenuTitle')}
        onMouseDown={e => e.preventDefault()}
        onClick={() => setOpen(v => !v)}
      >
        ⌄
      </button>
      {open ? (
        <div className="tessera-popover tessera-col-menu" contentEditable={false} onMouseDown={e => e.preventDefault()}>
          <div className="tessera-menu-section">
            {TABLE_COLUMN_KINDS.map(kind => (
              <button key={kind} type="button" onClick={() => run(() => editor.commands.setColumnType(index, kind))}>
                {kindLabel(t, kind)}
              </button>
            ))}
          </div>
          <div className="tessera-menu-sep" />
          <button type="button" onClick={() => run(() => editor.commands.sortTableByColumn(index, 'asc'))}>
            {t('colMenuSortAsc')}
          </button>
          <button type="button" onClick={() => run(() => editor.commands.sortTableByColumn(index, 'desc'))}>
            {t('colMenuSortDesc')}
          </button>
          <div className="tessera-menu-sep" />
          <button type="button" onClick={() => run(() => editor.commands.addColumnBefore())}>
            {t('colMenuInsertLeft')}
          </button>
          <button type="button" onClick={() => run(() => editor.commands.addColumnAfter())}>
            {t('colMenuInsertRight')}
          </button>
          <button type="button" className="tessera-danger" onClick={() => run(() => editor.commands.deleteColumn())}>
            {t('colMenuDelete')}
          </button>
          <div className="tessera-menu-sep" />
          <button type="button" onClick={() => run(() => editor.commands.toggleHeaderRow())}>
            {t('tableToggleHeader')}
          </button>
          <button
            type="button"
            onClick={() =>
              run(() => {
                const csv = tableToCsvAt(editor)
                if (csv) {
                  void navigator.clipboard.writeText(csv)
                }
              })
            }
          >
            {t('tableCopyCsv')}
          </button>
          <button type="button" className="tessera-danger" onClick={() => run(() => editor.commands.deleteTable())}>
            {t('tableDelete')}
          </button>
        </div>
      ) : null}
    </NodeViewWrapper>
  )
}

function AiTableCellView(props: NodeViewProps) {
  const { editor } = useContext(TesseraContext)!
  const value = props.node.attrs.value as unknown

  // find this column's kind: walk up to the table attrs via position math
  const kind: TableColumnKind = (() => {
    const pos = props.getPos()
    if (typeof pos !== 'number') {
      return 'text'
    }
    const $pos = editor.state.doc.resolve(pos)
    let tableDepth = -1
    for (let d = $pos.depth; d >= 1; d--) {
      if ($pos.node(d).type.name === 'table') {
        tableDepth = d
        break
      }
    }
    if (tableDepth < 1) {
      return 'text'
    }
    const table = $pos.node(tableDepth)
    const rowDepth = tableDepth + 1
    const cellIndex = $pos.index(rowDepth)
    const types = Array.isArray(table.attrs.types) ? (table.attrs.types as TableColumnKind[]) : []
    return types[cellIndex] ?? 'text'
  })()

  if (kind === 'text') {
    return (
      <NodeViewWrapper as="td" className="tessera-td">
        <NodeViewContent />
      </NodeViewWrapper>
    )
  }

  const setValue = (next: unknown) => props.updateAttributes({ value: next })

  return (
    <NodeViewWrapper as="td" className={`tessera-td tessera-td--${kind}`}>
      <NodeViewContent className="tessera-td-hidden" />
      {kind === 'checkbox' ? (
        <input
          type="checkbox"
          className="tessera-cell-checkbox"
          checked={value === true || value === 'true'}
          onChange={e => setValue(e.target.checked)}
          contentEditable={false}
        />
      ) : null}
      {kind === 'number' ? (
        <input
          type="number"
          className="tessera-cell-input"
          value={typeof value === 'number' ? value : ''}
          placeholder="—"
          onChange={e => setValue(e.target.value === '' ? null : Number(e.target.value))}
          contentEditable={false}
        />
      ) : null}
      {kind === 'date' ? (
        <input
          type="date"
          className="tessera-cell-input"
          value={typeof value === 'string' ? value : ''}
          onChange={e => setValue(e.target.value || null)}
          contentEditable={false}
        />
      ) : null}
      {kind === 'select' || kind === 'multiSelect' ? (
        <TagEditor
          multi={kind === 'multiSelect'}
          value={Array.isArray(value) ? (value as string[]) : value ? [String(value)] : []}
          onChange={tags => setValue(kind === 'multiSelect' ? tags : (tags[0] ?? null))}
        />
      ) : null}
      {kind === 'link' ? (
        <input
          type="url"
          className="tessera-cell-input"
          placeholder="https://…"
          value={typeof value === 'string' ? value : ''}
          onChange={e => setValue(e.target.value || null)}
          contentEditable={false}
        />
      ) : null}
    </NodeViewWrapper>
  )
}

function TagEditor({ multi, value, onChange }: { multi: boolean; value: string[]; onChange: (tags: string[]) => void }) {
  const [input, setInput] = useState('')
  const commit = () => {
    const tag = input.trim()
    if (!tag) {
      return
    }
    const next = multi ? Array.from(new Set([...value, tag])) : [tag]
    onChange(next)
    setInput('')
  }
  return (
    <div className="tessera-cell-tags" contentEditable={false}>
      {value.map(tag => (
        <span key={tag} className="tessera-tag">
          {tag}
          <button
            type="button"
            className="tessera-tag-x"
            onClick={() => onChange(value.filter(v => v !== tag))}
          >
            ×
          </button>
        </span>
      ))}
      <input
        className="tessera-cell-input tessera-cell-taginput"
        value={input}
        placeholder={multi ? '+ 标签' : '+ 标签'}
        onChange={e => setInput(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') {
            e.preventDefault()
            commit()
          }
        }}
        onBlur={commit}
      />
    </div>
  )
}

export const AiTableCellViewExtension = AiTableCell.extend({
  addNodeView() {
    return ReactNodeViewRenderer(AiTableCellView)
  },
})

export const AiTableHeaderViewExtension = AiTableHeader.extend({
  addNodeView() {
    return ReactNodeViewRenderer(AiTableHeaderView)
  },
})
