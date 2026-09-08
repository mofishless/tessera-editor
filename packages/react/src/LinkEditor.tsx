import { useContext, useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { findLinkRange, removeLinkRange, saveLinkRange } from '@tessera-editor/core'
import type { TesseraLinkRange } from '@tessera-editor/core'
import { TesseraContext } from './context'
import { useTesseraPortalRoot } from './portal'

/**
 * Click-to-edit link panel: clicking a link in the document opens a compact
 * editor for its display text and href; 移除链接 degrades it back to plain
 * text. Doc semantics live in core (linkedit.ts) so both bindings match.
 */

export function LinkEditor() {
  const { editor, t } = useContext(TesseraContext)!
  const portalRoot = useTesseraPortalRoot(editor)
  const [range, setRange] = useState<TesseraLinkRange | null>(null)
  const [text, setText] = useState('')
  const [href, setHref] = useState('')
  const [style, setStyle] = useState<CSSProperties>({})
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const anchor = target.closest('a[href]')
      if (!anchor || !editor.view.dom.contains(target)) {
        setRange(null)
        return
      }
      // read-only: a link click opens the target instead of the editor panel
      if (!editor.isEditable) {
        const href = anchor.getAttribute('href')
        if (href) {
          window.open(href, '_blank', 'noopener,noreferrer')
        }
        return
      }
      const found = findLinkRange(editor, editor.view.posAtDOM(anchor, 0))
      if (found) openPanel(found)
    }
    const dom = editor.view.dom
    dom.addEventListener('click', onClick)
    return () => dom.removeEventListener('click', onClick)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor])

  // any mousedown outside the panel dismisses it; a click on another link
  // re-opens with that link via the handler above
  useEffect(() => {
    if (!range) return
    const onDown = (e: MouseEvent) => {
      if (!panelRef.current?.contains(e.target as Node)) setRange(null)
    }
    window.addEventListener('mousedown', onDown)
    return () => window.removeEventListener('mousedown', onDown)
  }, [range])

  function openPanel(found: TesseraLinkRange) {
    setRange(found)
    setText(found.text)
    setHref(found.href)
    const a = editor.view.coordsAtPos(found.from)
    const b = editor.view.coordsAtPos(found.to)
    const left = Math.min(Math.max(8, (a.left + b.left) / 2 - 160), window.innerWidth - 328)
    const bottom = Math.max(a.bottom, b.bottom)
    const panelMax = 170
    const flip = bottom + 8 + panelMax > window.innerHeight && a.top - 8 - panelMax >= 0
    setStyle(
      flip
        ? { left: `${left}px`, bottom: `${window.innerHeight - Math.min(a.top, b.top) + 8}px` }
        : { left: `${left}px`, top: `${bottom + 8}px` },
    )
  }

  function save() {
    if (!range || !text.trim()) return
    saveLinkRange(editor, range, { text, href })
    setRange(null)
  }

  function remove() {
    if (!range) return
    removeLinkRange(editor, range)
    setRange(null)
  }

  function onInputKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') save()
    if (e.key === 'Escape') setRange(null)
  }

  if (!range || !portalRoot) return null
  return createPortal(
    <div ref={panelRef} className="tessera-link-editor" style={style} onMouseDown={e => e.stopPropagation()}>
      <input
        autoFocus
        value={text}
        placeholder={t('linkTextPlaceholder')}
        onChange={e => setText(e.target.value)}
        onKeyDown={onInputKeyDown}
      />
      <input
        value={href}
        placeholder={t('linkPlaceholder')}
        onChange={e => setHref(e.target.value)}
        onKeyDown={onInputKeyDown}
      />
      <div className="tessera-link-editor-row">
        <button type="button" disabled={!text.trim()} onClick={save}>
          {t('linkSave')}
        </button>
        <button type="button" className="tessera-danger" onClick={remove}>
          {t('linkRemove')}
        </button>
      </div>
    </div>,
    portalRoot,
  )
}
