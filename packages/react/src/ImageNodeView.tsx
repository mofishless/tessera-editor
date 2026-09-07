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
  const [zoom, setZoom] = useState(1)
  const clampZoom = (z: number) => Math.min(8, Math.max(0.2, z))

  useEffect(() => {
    if (!preview) return
    setZoom(1)
    const close = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPreview(null)
      else if (e.key === '+' || e.key === '=') setZoom(z => clampZoom(z * 1.25))
      else if (e.key === '-') setZoom(z => clampZoom(z / 1.25))
      else if (e.key === '0') setZoom(1)
    }
    // ctrl+wheel needs a non-passive listener so preventDefault can
    // suppress the browser's own page zoom
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey) return
      e.preventDefault()
      setZoom(z => clampZoom(z * (e.deltaY < 0 ? 1.15 : 1 / 1.15)))
    }
    window.addEventListener('keydown', close)
    window.addEventListener('wheel', onWheel, { passive: false })
    return () => {
      window.removeEventListener('keydown', close)
      window.removeEventListener('wheel', onWheel)
    }
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
              <img
                src={preview}
                alt={alt ?? ''}
                style={{ transform: `scale(${zoom})` }}
                onClick={e => e.stopPropagation()}
                onDoubleClick={() => setZoom(1)}
              />
              <div className="tessera-lightbox-bar" onClick={e => e.stopPropagation()}>
                <button type="button" title={t('imageZoomOut')} onClick={() => setZoom(z => clampZoom(z / 1.25))}>
                  −
                </button>
                <span className="tessera-lightbox-scale">{Math.round(zoom * 100)}%</span>
                <button type="button" title={t('imageZoomIn')} onClick={() => setZoom(z => clampZoom(z * 1.25))}>
                  +
                </button>
                <button type="button" title={t('imageZoomReset')} onClick={() => setZoom(1)}>
                  1:1
                </button>
                <span className="tessera-lightbox-hint">{t('imageZoomHint')}</span>
              </div>
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
