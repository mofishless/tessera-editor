import { useContext, useEffect, useState } from 'react'
import { NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react'
import type { NodeViewProps } from '@tiptap/react'
import { EmbedBlock, TocBlock } from '@tessera-editor/core'
import { TesseraContext } from './context'

/** Sandboxed iframe embed (default: no scripts, no same-origin). */
function EmbedView({ node, updateAttributes, selected }: NodeViewProps) {
  const { t } = useContext(TesseraContext)!
  const [url, setUrl] = useState(typeof node.attrs.src === 'string' ? node.attrs.src : '')
  const src = typeof node.attrs.src === 'string' ? node.attrs.src : ''
  const height = typeof node.attrs.height === 'number' ? node.attrs.height : 360

  if (!src) {
    return (
      <NodeViewWrapper className="tessera-embed tessera-embed-empty" data-selected={selected}>
        <input
          className="tessera-embed-input"
          value={url}
          placeholder={t('embedPlaceholder')}
          onChange={e => setUrl(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              apply()
            }
          }}
          contentEditable={false}
        />
        <button type="button" className="tessera-embed-apply" onClick={apply} contentEditable={false}>
          {t('embedApply')}
        </button>
      </NodeViewWrapper>
    )
  }

  function apply() {
    const next = url.trim()
    if (/^https?:\/\/.+/.test(next)) {
      updateAttributes({ src: next })
    }
  }

  return (
    <NodeViewWrapper className="tessera-embed" data-selected={selected}>
      <div className="tessera-embed-frame" style={{ height: `${height}px` }} contentEditable={false}>
        <iframe
          src={src}
          title={node.attrs.title ?? src}
          sandbox=""
          referrerPolicy="no-referrer"
          loading="lazy"
        />
      </div>
      <a className="tessera-embed-link" href={src} target="_blank" rel="noreferrer" contentEditable={false}>
        {t('embedOpen')} ↗
      </a>
    </NodeViewWrapper>
  )
}

/** Table of contents derived live from document headings. */
function TocView({ editor }: NodeViewProps) {
  const { t } = useContext(TesseraContext)!
  const [items, setItems] = useState<{ id: string; level: number; text: string }[]>([])

  useEffect(() => {
    const scan = () => {
      const found: { id: string; level: number; text: string }[] = []
      editor.state.doc.forEach((node, _offset, index) => {
        void index
        if (node.type.name === 'heading' && typeof node.attrs.id === 'string') {
          found.push({ id: node.attrs.id, level: Number(node.attrs.level), text: node.textContent })
        }
      })
      setItems(found)
    }
    scan()
    editor.on('transaction', scan)
    return () => {
      editor.off('transaction', scan)
    }
  }, [editor])

  return (
    <NodeViewWrapper className="tessera-toc">
      <div className="tessera-toc-title">{t('itemToc')}</div>
      {items.length === 0 ? (
        <div className="tessera-toc-empty">{t('tocEmpty')}</div>
      ) : (
        <div className="tessera-toc-list" contentEditable={false}>
          {items.map(item => (
            <button
              key={item.id}
              type="button"
              className="tessera-toc-item"
              data-level={item.level}
              onClick={() => {
                document.querySelector(`[data-id="${item.id}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }}
            >
              {item.text}
            </button>
          ))}
        </div>
      )}
    </NodeViewWrapper>
  )
}

export const EmbedBlockView = EmbedBlock.extend({
  addNodeView() {
    return ReactNodeViewRenderer(EmbedView)
  },
})

export const TocBlockView = TocBlock.extend({
  addNodeView() {
    return ReactNodeViewRenderer(TocView)
  },
})
