import { useCallback, useContext, useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { defaultSlashItems, filterSlashItems } from '@tessera-editor/core'
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

/** The expanded panel mirrors the slash menu, minus host-excluded blocks. */
function buildItems(editor: Editor, t: TesseraTranslator): SlashMenuItem[] {
  const slash = editor.extensionManager.extensions.find(ext => ext.name === 'tesseraSlashMenu')
  const excluded = (slash?.options as { excludeItems?: string[] } | undefined)?.excludeItems
  return filterSlashItems(defaultSlashItems(t), excluded)
}

export function EmptyLineToolbar() {
  const { editor, t } = useContext(TesseraContext)!
  const [style, setStyle] = useState<CSSProperties | null>(null)
  const [expanded, setExpanded] = useState(false)
  const [panelPlacement, setPanelPlacement] = useState<'bottom' | 'top'>('bottom')
  const [panelMaxHeight, setPanelMaxHeight] = useState<number | undefined>(undefined)
  const composingRef = useRef(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
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
      // Float just ABOVE the empty line so the caret stays visible; the
      // toolbar bottom sits a couple of pixels over the line's top edge.
      top: `${Math.max(2, coords.top - 38)}px`,
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

  // Slite-style placement: near the bottom of the viewport the panel opens
  // upward and is clamped to the available space instead of spilling past
  // the content edge
  useLayoutEffect(() => {
    const toolbar = rootRef.current
    if (!expanded || !toolbar) {
      setPanelPlacement('bottom')
      setPanelMaxHeight(undefined)
      return
    }
    const rect = toolbar.getBoundingClientRect()
    const spaceBelow = window.innerHeight - rect.bottom
    const spaceAbove = rect.top
    const natural = panelRef.current?.offsetHeight ?? 320
    const flip = spaceBelow < natural + 12 && spaceAbove > spaceBelow
    setPanelPlacement(flip ? 'top' : 'bottom')
    const avail = (flip ? spaceAbove : spaceBelow) - 12
    setPanelMaxHeight(avail > 120 && avail < natural ? avail : undefined)
  }, [expanded, style])

  if (!style || !portalRoot) {
    return null
  }

  const items = buildItems(editor, t)

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
        <div
          ref={panelRef}
          className="tessera-emptyline-panel"
          data-placement={panelPlacement}
          style={panelMaxHeight ? { maxHeight: panelMaxHeight } : undefined}
          data-testid="empty-line-panel"
        >
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
