import { useEffect, useImperativeHandle, useRef, useState, forwardRef } from 'react'
import type { CSSProperties } from 'react'
import type { Editor } from '@tiptap/core'
import { ReactRenderer } from '@tiptap/react'
import type { SuggestionProps, SuggestionKeyDownProps } from '@tiptap/suggestion'
import type { SlashMenuItem, TesseraTranslator } from '@tessera-editor/core'

/**
 * Slash menu UI (acceptance §1): "/" 唤起、输入过滤（core 层完成）、
 * 上下键导航、Return 插入、右侧显示快捷键、分组展示。
 */

export interface SlashMenuViewProps extends SuggestionProps<SlashMenuItem> {
  t: TesseraTranslator
}

export const SlashMenuView = forwardRef<{ onKeyDown: (props: SuggestionKeyDownProps) => boolean }, SlashMenuViewProps>(
  function SlashMenuView({ items, command, clientRect, t }, ref) {
    const [selectedIndex, setSelectedIndex] = useState(0)
    const listRef = useRef<HTMLDivElement>(null)
    const [rect, setRect] = useState<DOMRect | null>(null)

    useEffect(() => {
      setRect(clientRect?.() ?? null)
    }, [items, clientRect])

    useEffect(() => {
      setSelectedIndex(0)
    }, [items])

    useEffect(() => {
      listRef.current?.querySelector<HTMLElement>('[data-selected="true"]')?.scrollIntoView({ block: 'nearest' })
    }, [selectedIndex])

    useImperativeHandle(ref, () => ({
      onKeyDown: ({ event }) => {
        if (event.key === 'ArrowDown') {
          setSelectedIndex(i => (i + 1) % Math.max(items.length, 1))
          return true
        }
        if (event.key === 'ArrowUp') {
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

    const groups = groupBy(items, item => item.group)
    let flatIndex = -1

    const style: CSSProperties = rect
      ? (() => {
          // flip by the MENU's max height, not the caret position: a menu
          // opened mid-viewport would otherwise spill past the viewport bottom
          const menuMax = 336 // max-height 320 + padding/border allowance
          const fitsBelow = rect.bottom + 8 + menuMax <= window.innerHeight
          const fitsAbove = rect.top - 8 - menuMax >= 0
          const flip = !fitsBelow && fitsAbove
          return {
            position: 'fixed',
            left: `${Math.min(rect.left, window.innerWidth - 340)}px`,
            top: flip ? undefined : `${Math.min(rect.bottom + 8, window.innerHeight - menuMax)}px`,
            bottom: flip ? `${window.innerHeight - rect.top + 8}px` : undefined,
            width: 320,
          }
        })()
      : { position: 'fixed', left: -9999, top: -9999 }

    return (
      <div ref={listRef} className="tessera-slash-menu" style={style} data-testid="slash-menu">
        {Array.from(groups.entries()).map(([group, groupItems]) => (
          <div key={group} className="tessera-slash-group">
            <div className="tessera-slash-group-title">
              {group === 'ai' ? t('groupAi') : group === 'advanced' ? t('groupAdvanced') : t('groupBasic')}
            </div>
            {groupItems.map(item => {
              flatIndex += 1
              const idx = flatIndex
              return (
                <button
                  key={item.id}
                  type="button"
                  className="tessera-slash-item"
                  data-selected={idx === selectedIndex}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  onClick={() => command(item)}
                >
                  <span className="tessera-slash-item-title">{item.title}</span>
                  <span className="tessera-slash-item-desc">{item.description}</span>
                  {item.shortcut ? <span className="tessera-slash-item-shortcut">{item.shortcut}</span> : null}
                </button>
              )
            })}
          </div>
        ))}
      </div>
    )
  },
)

function groupBy<T>(items: T[], key: (item: T) => string): Map<string, T[]> {
  const map = new Map<string, T[]>()
  for (const item of items) {
    const k = key(item)
    const list = map.get(k) ?? []
    list.push(item)
    map.set(k, list)
  }
  return map
}

/** Suggestion render factory: mounts the React view in a body-level wrapper. */
export function createSlashRenderer(t: TesseraTranslator) {
  return () => {
    let renderer: ReactRenderer | null = null
    let wrapper: HTMLDivElement | null = null

    return {
      onStart: (props: SuggestionProps<SlashMenuItem>) => {
        renderer = new ReactRenderer(SlashMenuView, {
          props: { ...props, t },
          editor: props.editor as Editor,
        })
        wrapper = document.createElement('div')
        wrapper.className = 'tessera-slash-wrapper'
        wrapper.appendChild(renderer.element)
        // theme tokens live on .tessera-root — a body portal renders the menu
        // with unresolved (transparent) chrome
        const host = props.editor.view.dom.closest('.tessera-root') ?? document.body
        host.appendChild(wrapper)
      },
      onUpdate: (props: SuggestionProps<SlashMenuItem>) => {
        renderer?.updateProps({ ...props, t })
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
