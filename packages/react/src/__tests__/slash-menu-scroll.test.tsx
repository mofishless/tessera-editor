import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, act } from '@testing-library/react'
import { createRef } from 'react'
import { SlashMenuView, type SlashMenuViewProps } from '../SlashMenu'
import type { SlashMenuItem } from '@tessera-editor/core'

/**
 * Regression: ArrowDown past the menu's visible fold must scroll the
 * highlighted item back into view. The follow logic lives in an effect keyed
 * on selectedIndex that queries [data-selected="true"] inside the menu
 * container — which only works when the container ref is actually attached.
 */

const items: SlashMenuItem[] = Array.from({ length: 40 }, (_, i) => ({
  id: `item-${i}`,
  group: 'basic',
  title: `Item ${i}`,
  command: () => {},
}))

const scrollSpy = vi.fn()

beforeEach(() => {
  scrollSpy.mockClear()
  ;(Element.prototype as unknown as { scrollIntoView: unknown }).scrollIntoView = scrollSpy
})

describe('SlashMenuView keyboard scroll follow', () => {
  it('keeps the highlighted item in view when navigating past the fold', () => {
    const ref = createRef<{ onKeyDown: (props: { event: KeyboardEvent }) => boolean }>()
    const props = {
      items,
      command: vi.fn(),
      clientRect: () => new DOMRect(100, 200, 8, 18),
      t: (key: string) => key,
    } as unknown as SlashMenuViewProps
    const { container } = render(<SlashMenuView ref={ref} {...props} />)

    const menu = container.querySelector('[data-testid="slash-menu"]')
    expect(menu).toBeTruthy()

    act(() => {
      for (let i = 0; i < 25; i++) {
        ref.current!.onKeyDown({ event: new KeyboardEvent('keydown', { key: 'ArrowDown' }) })
      }
    })

    const selected = menu!.querySelector('[data-selected="true"]')
    expect(selected?.textContent).toContain('Item 25')
    expect(scrollSpy).toHaveBeenCalledWith({ block: 'nearest' })
    expect(scrollSpy.mock.contexts.some(el => el === selected)).toBe(true)
  })
})
