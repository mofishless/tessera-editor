import { useCallback, useContext, useEffect, useRef, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { docToMarkdown } from '@tessera-editor/core'
import { IMPROVE_PRESETS, improveSelection } from '@tessera-editor/ai'
import type { SuggestionSession } from '@tessera-editor/ai'
import { TesseraContext } from './context'
import { useTesseraPortalRoot } from './portal'
import { CommentComposer } from './CommentPanel'

/**
 * Selection toolbar (acceptance §4): 划词浮现。按钮序：Improve(AI) / B / I /
 * U / S / 行内代码 / 颜色 / 高亮(5色) / 链接 / 转折叠块 / More(Copy as Markdown)。
 */

const TEXT_COLORS = ['#262629', '#d9414f', '#e8912d', '#31a56f', '#2f9ea8', '#4f6df5', '#7a4fd8', '#98a0ab']
const HIGHLIGHT_COLORS = ['#fff2a8', '#d6eaff', '#d3f5df', '#fdd9e7', '#e6dcff']

type PopoverKind = null | 'color' | 'highlight' | 'link' | 'improve' | 'more' | 'comment'

export function SelectionToolbar({ onSession }: { onSession: (session: SuggestionSession | null) => void }) {
  const { editor, t, ai } = useContext(TesseraContext)!
  const [style, setStyle] = useState<CSSProperties | null>(null)
  const [popover, setPopover] = useState<PopoverKind>(null)
  const [linkValue, setLinkValue] = useState('')
  const composingRef = useRef(false)
  const portalRoot = useTesseraPortalRoot(editor)

  const reposition = useCallback(() => {
    if (composingRef.current || !editor.isFocused) {
      setStyle(null)
      return
    }
    const { from, to, empty } = editor.state.selection
    if (empty) {
      setStyle(null)
      return
    }
    if (!editor.state.doc.textBetween(from, to, ' ').trim()) {
      setStyle(null)
      return
    }
    const start = editor.view.coordsAtPos(from)
    const end = editor.view.coordsAtPos(to)
    const left = (Math.min(start.left, end.left) + Math.min(Math.max(start.left, end.left), window.innerWidth - 20)) / 2
    const top = Math.max(8, start.top - 48)
    setStyle({
      position: 'fixed',
      top: `${top}px`,
      left: `${Math.max(8, Math.min(left, window.innerWidth - 380))}px`,
    })
  }, [editor])

  useEffect(() => {
    const hide = () => {
      setStyle(null)
      setPopover(null)
    }
    const onSelectionUpdate = () => {
      if (!editor.state.selection.empty) {
        const existing = editor.getAttributes('link').href
        setLinkValue(typeof existing === 'string' ? existing : '')
      } else {
        setPopover(null)
      }
      reposition()
    }
    const onCompositionStart = () => {
      composingRef.current = true
      setStyle(null)
      setPopover(null)
    }
    const onCompositionEnd = () => {
      composingRef.current = false
      requestAnimationFrame(reposition)
    }

    const dom = editor.view.dom
    editor.on('selectionUpdate', onSelectionUpdate)
    editor.on('focus', reposition)
    editor.on('blur', hide)
    dom.addEventListener('compositionstart', onCompositionStart)
    dom.addEventListener('compositionend', onCompositionEnd)
    window.addEventListener('scroll', hide, true)
    return () => {
      editor.off('selectionUpdate', onSelectionUpdate)
      editor.off('focus', reposition)
      editor.off('blur', hide)
      dom.removeEventListener('compositionstart', onCompositionStart)
      dom.removeEventListener('compositionend', onCompositionEnd)
      window.removeEventListener('scroll', hide, true)
    }
  }, [editor, reposition])

  const chain = () => editor.chain().focus()

  if (!style || !portalRoot) {
    return null
  }

  const currentColor = (editor.getAttributes('textStyle').color as string | undefined) ?? null

  return createPortal(
    <div
      className="tessera-selection-toolbar"
      style={style}
      data-testid="selection-toolbar"
      onMouseDown={e => e.preventDefault()}
    >
      {ai ? (
        <TbBtn title={t('tooltipImprove')} className="tessera-tb-ai" onClick={() => setPopover(p => (p === 'improve' ? null : 'improve'))}>
          ✨
        </TbBtn>
      ) : null}
      <TbBtn title={t('tooltipBold')} active={editor.isActive('bold')} onClick={() => chain().toggleBold().run()}>
        <b>B</b>
      </TbBtn>
      <TbBtn title={t('tooltipItalic')} active={editor.isActive('italic')} onClick={() => chain().toggleItalic().run()}>
        <i>I</i>
      </TbBtn>
      <TbBtn title={t('tooltipUnderline')} active={editor.isActive('underline')} onClick={() => chain().toggleUnderline().run()}>
        <u>U</u>
      </TbBtn>
      <TbBtn title={t('tooltipStrike')} active={editor.isActive('strike')} onClick={() => chain().toggleStrike().run()}>
        <s>S</s>
      </TbBtn>
      <TbBtn title={t('tooltipCode')} active={editor.isActive('code')} onClick={() => chain().toggleCode().run()}>
        {'</>'}
      </TbBtn>
      <TbBtn title={t('tooltipColor')} active={!!currentColor} onClick={() => setPopover(p => (p === 'color' ? null : 'color'))}>
        <span className="tessera-tb-colorchip" style={{ background: currentColor ?? '#262629' }} />
      </TbBtn>
      <TbBtn title={t('tooltipHighlight')} active={editor.isActive('highlight')} onClick={() => setPopover(p => (p === 'highlight' ? null : 'highlight'))}>
        <span className="tessera-tb-colorchip" style={{ background: '#fff2a8' }} />
      </TbBtn>
      <TbBtn title={t('tooltipLink')} active={editor.isActive('link')} onClick={() => setPopover(p => (p === 'link' ? null : 'link'))}>
        🔗
      </TbBtn>
      <TbBtn
        title={t('tooltipCommentV11')}
        active={editor.isActive('comment')}
        onClick={() => setPopover(p => (p === 'comment' ? null : 'comment'))}
      >
        💬
      </TbBtn>
      <TbBtn title={t('tooltipTurnCollapsible')} onClick={() => chain().insertCollapsible().run()}>
        ▸
      </TbBtn>
      <TbBtn title={t('tooltipMore')} onClick={() => setPopover(p => (p === 'more' ? null : 'more'))}>
        ⋯
      </TbBtn>

      {popover === 'color' ? (
        <div className="tessera-popover">
          <button type="button" className="tessera-color-swatch tessera-color-none" title={t('colorDefault')} onClick={() => chain().unsetColor().run()} />
          {TEXT_COLORS.map(color => (
            <button key={color} type="button" className="tessera-color-swatch" style={{ background: color }} onClick={() => chain().setColor(color).run()} />
          ))}
        </div>
      ) : null}

      {popover === 'highlight' ? (
        <div className="tessera-popover">
          <button type="button" className="tessera-color-swatch tessera-color-none" title={t('highlightNone')} onClick={() => chain().unsetHighlight().run()} />
          {HIGHLIGHT_COLORS.map(color => (
            <button key={color} type="button" className="tessera-color-swatch" style={{ background: color }} onClick={() => chain().toggleHighlight({ color }).run()} />
          ))}
        </div>
      ) : null}

      {popover === 'link' ? (
        <div className="tessera-popover tessera-link-popover">
          <input
            autoFocus
            value={linkValue}
            placeholder={t('linkPlaceholder')}
            onChange={e => setLinkValue(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && linkValue.trim()) {
                chain().toggleLink({ href: linkValue.trim() }).run()
                setPopover(null)
              }
            }}
          />
          <button
            type="button"
            onClick={() => {
              if (linkValue.trim()) {
                chain().toggleLink({ href: linkValue.trim() }).run()
              }
              setPopover(null)
            }}
          >
            {t('linkApply')}
          </button>
          {editor.isActive('link') ? (
            <button
              type="button"
              className="tessera-danger"
              onClick={() => {
                chain().unsetLink().run()
                setPopover(null)
              }}
            >
              {t('linkRemove')}
            </button>
          ) : null}
        </div>
      ) : null}

      {popover === 'more' ? (
        <div className="tessera-popover tessera-popover-menu">
          <button
            type="button"
            onClick={async () => {
              const { to } = editor.state.selection
              const start = editor.state.selection.$from.before(1)
              const sliced = editor.state.doc.cut(start, to)
              await navigator.clipboard.writeText(docToMarkdown(sliced, editor.state.schema))
              setPopover(null)
            }}
          >
            {t('tooltipCopyMarkdown')}
          </button>
        </div>
      ) : null}

      {popover === 'improve' ? <ImprovePopover onSession={onSession} onClose={() => setPopover(null)} /> : null}
      {popover === 'comment' ? <CommentComposer onClose={() => setPopover(null)} /> : null}
    </div>,
    portalRoot,
  )
}

function TbBtn({
  title,
  active,
  className,
  onClick,
  children,
}: {
  title: string
  active?: boolean
  className?: string
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      className={`tessera-tb-btn${className ? ` ${className}` : ''}`}
      data-active={active ?? false}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

function ImprovePopover({
  onSession,
  onClose,
}: {
  onSession: (s: SuggestionSession | null) => void
  onClose: () => void
}) {
  const { editor, t, locale, ai } = useContext(TesseraContext)!
  const [instruction, setInstruction] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const run = async (presetInstruction?: string) => {
    if (!ai) {
      setError(t('aiRuntimeMissing'))
      return
    }
    onClose()
    setBusy(true)
    try {
      const session = await improveSelection(editor, ai.runtime, { instruction: presetInstruction })
      onSession(session)
    } catch (err) {
      setError(String(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="tessera-popover tessera-improve-popover" data-testid="improve-popover">
      {IMPROVE_PRESETS.map(preset => (
        <button key={preset.id} type="button" disabled={busy} onClick={() => run(preset.instruction)}>
          {locale === 'zh-CN' ? preset.labelZh : preset.labelEn}
        </button>
      ))}
      <div className="tessera-improve-custom">
        <input
          value={instruction}
          placeholder={t('aiImprovePrompt')}
          onChange={e => setInstruction(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && instruction.trim()) {
              run(instruction.trim())
            }
          }}
        />
        <button type="button" disabled={busy || !instruction.trim()} onClick={() => run(instruction.trim())}>
          {t('aiImproveRun')}
        </button>
      </div>
      {error ? <div className="tessera-popover-error">{error}</div> : null}
    </div>
  )
}
