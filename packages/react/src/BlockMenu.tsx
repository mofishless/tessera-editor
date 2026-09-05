import { useContext, useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { tableToCsvAt } from '@tessera-editor/core'
import { TesseraContext } from './context'

/**
 * Block context menu (v1.1): right-click a block → 复制锚链接 / 复制块 ID /
 * 删除块; inside tables also row & table operations.
 */
interface BlockMenuState {
  blockId: string
  blockType: string
  clientX: number
  clientY: number
}

export function BlockContextMenuUI() {
  const { editor, t } = useContext(TesseraContext)!
  const [menu, setMenu] = useState<BlockMenuState | null>(null)

  useEffect(() => {
    const onMenu = (payload: BlockMenuState) => {
      // place caret into the block so table commands resolve context
      const found = findBlockPosById(editor, payload.blockId)
      if (found !== null) {
        editor.commands.setTextSelection(Math.min(found + 2, editor.state.doc.content.size))
      }
      setMenu(payload)
    }
    const close = () => setMenu(null)
    editor.on('tessera:blockMenu', onMenu as never)
    window.addEventListener('mousedown', close)
    window.addEventListener('scroll', close, true)
    return () => {
      editor.off('tessera:blockMenu', onMenu as never)
      window.removeEventListener('mousedown', close)
      window.removeEventListener('scroll', close, true)
    }
  }, [editor])

  if (!menu) {
    return null
  }

  const inTable = menu.blockType === 'table' || menu.blockType === 'tableRow'
  const style: CSSProperties = {
    position: 'fixed',
    left: `${Math.min(menu.clientX, window.innerWidth - 220)}px`,
    top: `${Math.min(menu.clientY, window.innerHeight - 300)}px`,
  }

  const copy = (text: string) => {
    void navigator.clipboard.writeText(text)
    setMenu(null)
  }

  return createPortal(
    <div className="tessera-block-menu" style={style} onMouseDown={e => e.stopPropagation()}>
      {inTable ? (
        <>
          <MenuLabel>{t('rowMenuTitle')}</MenuLabel>
          <MenuItem onClick={() => { editor.commands.addRowBefore(); setMenu(null) }}>{t('rowMenuInsertAbove')}</MenuItem>
          <MenuItem onClick={() => { editor.commands.addRowAfter(); setMenu(null) }}>{t('rowMenuInsertBelow')}</MenuItem>
          <MenuItem danger onClick={() => { editor.commands.deleteRow(); setMenu(null) }}>{t('rowMenuDelete')}</MenuItem>
          <div className="tessera-menu-sep" />
          <MenuItem onClick={() => { const csv = tableToCsvAt(editor); if (csv) copy(csv) }}>{t('tableCopyCsv')}</MenuItem>
          <MenuItem onClick={() => { editor.commands.toggleHeaderRow(); setMenu(null) }}>{t('tableToggleHeader')}</MenuItem>
          <MenuItem danger onClick={() => { editor.commands.deleteTable(); setMenu(null) }}>{t('tableDelete')}</MenuItem>
          <div className="tessera-menu-sep" />
        </>
      ) : null}
      <MenuItem onClick={() => copy(anchorUrl(menu.blockId))}>{t('menuCopyAnchor')}</MenuItem>
      <MenuItem onClick={() => copy(menu.blockId)}>{t('menuCopyBlockId')}</MenuItem>
      <MenuItem danger onClick={() => { deleteBlockById(editor, menu.blockId); setMenu(null) }}>
        {t('menuDeleteBlock')}
      </MenuItem>
    </div>,
    document.body,
  )
}

function anchorUrl(blockId: string): string {
  const base = `${location.origin}${location.pathname}`
  return `${base}#block-${blockId}`
}

function findBlockPosById(editor: import('@tiptap/react').Editor, id: string): number | null {
  let found: number | null = null
  editor.state.doc.forEach((node, offset) => {
    if (found === null && node.attrs.id === id) {
      found = offset
    }
  })
  return found
}

function deleteBlockById(editor: import('@tiptap/react').Editor, id: string) {
  const pos = findBlockPosById(editor, id)
  if (pos === null) {
    return
  }
  const node = editor.state.doc.nodeAt(pos)
  if (!node) {
    return
  }
  const tr = editor.state.tr.delete(pos, pos + node.nodeSize)
  editor.view.dispatch(tr)
}

function MenuLabel({ children }: { children: React.ReactNode }) {
  return <div className="tessera-menu-label">{children}</div>
}

function MenuItem({
  children,
  onClick,
  danger,
}: {
  children: React.ReactNode
  onClick: () => void
  danger?: boolean
}) {
  return (
    <button type="button" className={`tessera-menu-item${danger ? ' tessera-danger' : ''}`} onClick={onClick}>
      {children}
    </button>
  )
}
