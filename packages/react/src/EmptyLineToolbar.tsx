import { useCallback, useContext, useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { defaultSlashItems } from '@tessera-editor/core'
import type { SlashMenuItem, TesseraTranslator } from '@tessera-editor/core'
import { aiSlashItems } from '@tessera-editor/ai'
import type { Editor } from '@tiptap/react'
import { TesseraContext } from './context'
import { useTesseraPortalRoot } from './portal'

/**
 * Slite-style empty-line toolbar (acceptance §5): appears when the caret sits
 * in an EMPTY paragraph. Quick row + "›" expands the full block list (same
 * items as the slash menu). NOT a Notion-style floating "+" button.
 *
 * IME guard: while an input method composition is active we neither show,
 * hide, nor move the toolbar (M0 spike finding).
 */

function buildItems(editor: Editor, t: TesseraTranslator, hasAi: boolean): SlashMenuItem[] {
  const base = defaultSlashItems(t)
  if (!hasAi) {
    return base
  }
  // AI items need a runtime; context provides it — reconstructed here via
  // context injection from the parent (see useItems below).
  return base
}

export function EmptyLineToolbar() {
  const { editor, t, ai } = useContext(TesseraContext)!
  const [style, setStyle] = useState<CSSProperties | null>(null)
  const [expanded, setExpanded] = useState(false)
  const composingRef = useRef(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const portalRoot = useTesseraPortalRoot(editor)

  const hideAll = useCallback(() => {
    setStyle(null)
    setExpanded(false)
    editor.view.dom.removeAttribute('data-toolbar-line')
  }, [editor])

  const reposition = useCallback(() => {
    const dom = editor.view.dom
    if (composingRef.current || !editor.isFocused) {
      setStyle(null)
      dom.removeAttribute('data-toolbar-line')
      return
    }
    const { $from, empty } = editor.state.selection
    const isEmptyParagraph =
      empty && $from.parent.type.name === 'paragraph' && $from.parent.content.size === 0
    if (!isEmptyParagraph) {
      setStyle(null)
      setExpanded(false)
      dom.removeAttribute('data-toolbar-line')
      return
    }
    const coords = editor.view.coordsAtPos($from.pos)
    // the toolbar is glued to the anchor line; once that line leaves the
    // visible part of the editor (inner scroll or page scroll) it must go
    const viewRect = dom.getBoundingClientRect()
    if (
      coords.top < Math.max(viewRect.top, 0) - 2 ||
      coords.top > Math.min(viewRect.bottom, window.innerHeight) + 2
    ) {
      hideAll()
      return
    }
    setStyle({
      position: 'fixed',
      // Slite behavior: the toolbar OCCUPIES the empty line instead of
      // floating above it (which would overlap the previous block).
      top: `${Math.max(2, coords.top - 5)}px`,
      left: `${coords.left}px`,
    })
    // hide the placeholder text while the toolbar owns this line
    dom.setAttribute('data-toolbar-line', 'true')
  }, [editor, hideAll])

  useEffect(() => {
    const hide = () => {
      setStyle(null)
      setExpanded(false)
    }
    const onCompositionStart = () => {
      composingRef.current = true
      setStyle(null)
    }
    const onCompositionEnd = () => {
      composingRef.current = false
      requestAnimationFrame(reposition)
    }
    // scroll inside our own panel (its scrollbar) must not close the menu;
    // any other scroll keeps the toolbar glued to the anchor line via
    // reposition (which hides it once the line leaves the viewport)
    const onScroll = (event: Event) => {
      const node = rootRef.current
      if (node && event.target instanceof Node && node.contains(event.target)) {
        return
      }
      requestAnimationFrame(reposition)
    }

    const dom = editor.view.dom
    editor.on('selectionUpdate', reposition)
    editor.on('focus', reposition)
    editor.on('blur', hide)
    dom.addEventListener('compositionstart', onCompositionStart)
    dom.addEventListener('compositionend', onCompositionEnd)
    window.addEventListener('scroll', onScroll, true)
    return () => {
      editor.off('selectionUpdate', reposition)
      editor.off('focus', reposition)
      editor.off('blur', hide)
      dom.removeEventListener('compositionstart', onCompositionStart)
      dom.removeEventListener('compositionend', onCompositionEnd)
      window.removeEventListener('scroll', onScroll, true)
    }
  }, [editor, reposition])

  if (!style || !portalRoot) {
    return null
  }

  const items = buildItems(editor, t, !!ai)

  const runItem = (item: SlashMenuItem) => {
    const { $from } = editor.state.selection
    item.command({ editor, range: { from: $from.pos, to: $from.pos } })
    setExpanded(false)
  }

  return createPortal(
    <div
      ref={rootRef}
      className="tessera-emptyline-toolbar"
      style={style}
      data-testid="empty-line-toolbar"
      onMouseDown={e => e.preventDefault()}
    >
      <button type="button" className="tessera-tb-btn" title={t('itemText')} onClick={() => runItem(items.find(i => i.id === 'text')!)}>
        ¶
      </button>
      <button type="button" className="tessera-tb-btn" title={t('itemH2')} onClick={() => runItem(items.find(i => i.id === 'h2')!)}>
        H2
      </button>
      <button type="button" className="tessera-tb-btn" title={t('itemBullet')} onClick={() => runItem(items.find(i => i.id === 'bulletList')!)}>
        •
      </button>
      <button type="button" className="tessera-tb-btn" title={t('itemTask')} onClick={() => runItem(items.find(i => i.id === 'taskList')!)}>
        ☑
      </button>
      <button type="button" className="tessera-tb-btn" title={t('itemQuote')} onClick={() => runItem(items.find(i => i.id === 'quote')!)}>
        ❝
      </button>
      <button type="button" className="tessera-tb-btn" title={t('itemCode')} onClick={() => runItem(items.find(i => i.id === 'codeBlock')!)}>
        {'</>'}
      </button>
      <button
        type="button"
        className="tessera-tb-btn tessera-emptyline-expand"
        title={t('emptyLineExpand')}
        data-expanded={expanded}
        onClick={() => setExpanded(v => !v)}
      >
        ›
      </button>

      {expanded ? (
        <div className="tessera-emptyline-panel" data-testid="empty-line-panel">
          {items.map(item => (
            <button key={item.id} type="button" className="tessera-slash-item" onClick={() => runItem(item)}>
              <span className="tessera-slash-item-title">{item.title}</span>
              <span className="tessera-slash-item-desc">{item.description}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>,
    portalRoot,
  )
}

export { aiSlashItems }
