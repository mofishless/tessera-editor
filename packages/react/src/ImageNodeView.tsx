import { NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react'
import type { NodeViewProps } from '@tiptap/react'
import { ImageBlock } from '@tessera-editor/core'
import { useContext, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { TesseraContext } from './context'

/**
 * Image NodeView (acceptance §6): 悬停边缘箭头调宽、左/中/全宽对齐。
 * Uploads flow through the injected UploadService (Tessera.tsx handles
 * paste/drop/picker); this view only mutates node attributes.
 */

function AiImageNodeView({ node, updateAttributes, selected, decorations }: NodeViewProps) {
  console.log('[imgview] decorations:', Array.isArray(decorations), decorations?.length)
  const galleryAttrs = (() => {
    for (const deco of decorations ?? []) {
      const attrs = (deco as unknown as { type?: { attrs?: Record<string, string> } }).type?.attrs
      if (attrs && 'data-gallery' in attrs) {
        return attrs
      }
    }
    return null
  })()
  const { t } = useContext(TesseraContext)!
  const imgRef = useRef<HTMLImageElement>(null)
  const [preview, setPreview] = useState<string | null>(null)

  useEffect(() => {
    if (!preview) return
    const close = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPreview(null)
    }
    window.addEventListener('keydown', close)
    return () => window.removeEventListener('keydown', close)
  }, [preview])
  const { src, alt, width, align } = node.attrs as {
    src: string
    alt: string | null
    width: number | null
    align: 'left' | 'center' | 'full'
  }

  const startResize = (event: React.PointerEvent) => {
    event.preventDefault()
    event.stopPropagation()
    const startX = event.clientX
    const startWidth = imgRef.current?.getBoundingClientRect().width ?? width ?? 400
    const onMove = (e: PointerEvent) => {
      const next = Math.round(Math.max(80, Math.min(startWidth + (e.clientX - startX), 1200)))
      updateAttributes({ width: next })
    }
    const onUp = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  if (!src) {
    return (
      <NodeViewWrapper className="tessera-image tessera-image-empty" data-selected={selected}>
        <span>{t('imageUploadFailed')}</span>
      </NodeViewWrapper>
    )
  }

  return (
    <NodeViewWrapper
      className="tessera-image"
      data-align={align}
      data-selected={selected}
      data-gallery={galleryAttrs ? 'true' : undefined}
      data-gallery-index={galleryAttrs?.['data-gallery-index']}
      data-gallery-size={galleryAttrs?.['data-gallery-size']}
    >
      <div className="tessera-image-frame" style={width ? { width: `${width}px` } : undefined}>
        <img
          ref={imgRef}
          src={src}
          alt={alt ?? ''}
          draggable={false}
          style={{ cursor: 'zoom-in' }}
          onClick={e => {
            e.stopPropagation()
            setPreview(src)
          }}
        />
        <div className="tessera-image-resize" onPointerDown={startResize} title="↔" />
      </div>
      {preview
        ? createPortal(
            <div className="tessera-lightbox" onClick={() => setPreview(null)}>
              <img src={preview} alt={alt ?? ''} />
            </div>,
            document.body,
          )
        : null}
      <div className="tessera-image-align">
        <button type="button" title={t('imageAlignLeft')} data-on={align === 'left'} onClick={() => updateAttributes({ align: 'left' })}>
          ⭰
        </button>
        <button type="button" title={t('imageAlignCenter')} data-on={align === 'center'} onClick={() => updateAttributes({ align: 'center' })}>
          ⭤
        </button>
        <button type="button" title={t('imageAlignFull')} data-on={align === 'full'} onClick={() => updateAttributes({ align: 'full' })}>
          ⭥
        </button>
      </div>
    </NodeViewWrapper>
  )
}

/** Binding-level image block: core schema + React NodeView. */
export const ImageBlockView = ImageBlock.extend({
  addNodeView() {
    return ReactNodeViewRenderer(AiImageNodeView)
  },
})
