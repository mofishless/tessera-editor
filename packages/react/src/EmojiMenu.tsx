import { useEffect, useImperativeHandle, useRef, useState, forwardRef } from 'react'
import type { CSSProperties } from 'react'
import type { Editor } from '@tiptap/core'
import { ReactRenderer } from '@tiptap/react'
import type { SuggestionProps, SuggestionKeyDownProps } from '@tiptap/suggestion'
import type { EmojiItem } from '@tessera-editor/core'

/**
 * Emoji picker UI (acceptance §2, v1.1): `:` opens a grid of emoji filtered
 * by name/keywords; arrows + Return insert, click inserts, Esc closes.
 * Same mounting contract as the slash menu (wrapper appended into
 * .tessera-root so theme tokens resolve).
 */

export const EmojiMenuView = forwardRef<
  { onKeyDown: (props: SuggestionKeyDownProps) => boolean },
  SuggestionProps<EmojiItem>
>(function EmojiMenuView({ items, command, clientRect }, ref) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [rect, setRect] = useState<DOMRect | null>(null)
  const gridRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setRect(clientRect?.() ?? null)
  }, [items, clientRect])

  useEffect(() => {
    setSelectedIndex(0)
  }, [items])

  useEffect(() => {
    gridRef.current
      ?.querySelectorAll<HTMLElement>('.tessera-emoji-item')
      [selectedIndex]?.scrollIntoView({ block: 'nearest' })
  }, [selectedIndex])

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: SuggestionKeyDownProps) => {
      if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
        setSelectedIndex(i => (i + 1) % Math.max(items.length, 1))
        return true
      }
      if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
        setSelectedIndex(i => (i - 1 + Math.max(items.length, 1)) % Math.max(items.length, 1))
        return true
      }
      if (event.key === 'Enter') {
        const item = items[selectedIndex]
        if (item) {
          command(item)
        }
        return true
      }
      return false
    },
  }))

  if (items.length === 0) {
    return null
  }

  const menuMax = 264
  const style: CSSProperties = rect
    ? (() => {
        const fitsBelow = rect.bottom + 8 + menuMax <= window.innerHeight
        const fitsAbove = rect.top - 8 - menuMax >= 0
        const flip = !fitsBelow && fitsAbove
        return {
          left: `${Math.min(rect.left, window.innerWidth - 300)}px`,
          top: flip ? undefined : `${Math.min(rect.bottom + 8, window.innerHeight - menuMax)}px`,
          bottom: flip ? `${window.innerHeight - rect.top + 8}px` : undefined,
        }
      })()
    : { left: -9999, top: -9999 }

  return (
    <div ref={gridRef} className="tessera-emoji-menu" style={style} data-testid="emoji-menu">
      {items.map((item, i) => (
        <button
          key={item.name}
          type="button"
          className="tessera-emoji-item"
          title={`:${item.name}:`}
          data-selected={i === selectedIndex}
          onMouseEnter={() => setSelectedIndex(i)}
          onClick={() => command(item)}
        >
          {item.char}
        </button>
      ))}
    </div>
  )
})

/** Suggestion render factory: mounts the grid into the component root. */
export function createEmojiRenderer() {
  return () => {
    let renderer: ReactRenderer | null = null
    let wrapper: HTMLDivElement | null = null

    return {
      onStart: (props: SuggestionProps<EmojiItem>) => {
        renderer = new ReactRenderer(EmojiMenuView, {
          props: { ...props },
          editor: props.editor as Editor,
        })
        wrapper = document.createElement('div')
        wrapper.className = 'tessera-emoji-wrapper'
        wrapper.appendChild(renderer.element)
        const host = props.editor.view.dom.closest('.tessera-root') ?? document.body
        host.appendChild(wrapper)
      },
      onUpdate: (props: SuggestionProps<EmojiItem>) => {
        renderer?.updateProps({ ...props })
      },
      onKeyDown: (props: SuggestionKeyDownProps) => {
        if (props.event.key === 'Escape') {
          wrapper?.remove()
          renderer?.destroy()
          renderer = null
          wrapper = null
          return true
        }
        return (renderer?.ref as { onKeyDown?: (p: SuggestionKeyDownProps) => boolean } | null)?.onKeyDown?.(props) ?? false
      },
      onExit: () => {
        wrapper?.remove()
        renderer?.destroy()
        renderer = null
        wrapper = null
      },
    }
  }
}
