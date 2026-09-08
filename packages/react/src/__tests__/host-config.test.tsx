// @vitest-environment jsdom
import { describe, it, expect, beforeAll } from 'vitest'
import { render, waitFor, act } from '@testing-library/react'
import { Tessera } from '../Tessera'
import type { Editor } from '@tiptap/core'

/**
 * Host configuration surface on the React binding: read-only mode, custom
 * placeholder, block exclusion, and host buttons in the selection toolbar.
 */

const doc = {
  type: 'doc',
  content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Hello' }] }],
}

beforeAll(() => {
  // jsdom implements no layout: prosemirror-view's coordsAtPos (used by
  // scrollIntoView and the selection toolbar positioning) needs Range rects.
  const rect = { left: 0, right: 0, top: 0, bottom: 0, width: 0, height: 0 }
  ;(Range.prototype as unknown as { getClientRects: () => unknown }).getClientRects = () => [rect]
  ;(Range.prototype as unknown as { getBoundingClientRect: () => unknown }).getBoundingClientRect = () => rect
})

/** Select "Hello" and focus the view so the selection toolbar repositions in. */
async function selectText(editor: Editor | null): Promise<void> {
  await act(async () => {
    editor!.commands.setTextSelection({ from: 1, to: 6 })
    editor!.commands.focus()
  })
}

describe('host configuration surface', () => {
  it('editable=false renders a read-only editor', async () => {
    let editor: Editor | null = null
    const { container } = render(<Tessera content={doc} editable={false} onCreate={ed => (editor = ed)} />)
    await waitFor(() => expect(editor).not.toBeNull())
    expect(container.querySelector('.ProseMirror')?.getAttribute('contenteditable')).toBe('false')
  })

  it('editable defaults to true', async () => {
    let editor: Editor | null = null
    const { container } = render(<Tessera content={doc} onCreate={ed => (editor = ed)} />)
    await waitFor(() => expect(editor).not.toBeNull())
    expect(container.querySelector('.ProseMirror')?.getAttribute('contenteditable')).toBe('true')
  })

  it('placeholder overrides the empty-paragraph hint', async () => {
    let editor: Editor | null = null
    const { container } = render(<Tessera placeholder="从需求背景写起" onCreate={ed => (editor = ed)} />)
    await waitFor(() => expect(editor).not.toBeNull())
    await waitFor(() => {
      expect(container.querySelector('[data-placeholder="从需求背景写起"]')).not.toBeNull()
    })
  })

  it('excludeBlocks removes the node types from the mounted schema', async () => {
    let editor: Editor | null = null
    render(
      <Tessera
        excludeBlocks={['hint', 'collapsible', 'embedBlock', 'tocBlock', 'horizontalRule']}
        onCreate={ed => (editor = ed)}
      />,
    )
    await waitFor(() => expect(editor).not.toBeNull())
    expect(editor!.state.schema.nodes.hint).toBeUndefined()
    expect(editor!.state.schema.nodes.collapsible).toBeUndefined()
    expect(editor!.state.schema.nodes.horizontalRule).toBeUndefined()
    expect(editor!.state.schema.nodes.table).toBeDefined()
    expect(editor!.state.schema.nodes.imageBlock).toBeDefined()
  })

  it('extraSelectionItems renders in the selection toolbar on text selection', async () => {
    let editor: Editor | null = null
    const { container } = render(
      <Tessera
        content={doc}
        onCreate={ed => (editor = ed)}
        extraSelectionItems={<button type="button">让 AI 改写此段</button>}
      />,
    )
    await waitFor(() => expect(editor).not.toBeNull())
    await selectText(editor)
    await waitFor(() => {
      const toolbar = container.querySelector('[data-testid="selection-toolbar"]')
      expect(toolbar, '选区工具栏应出现').not.toBeNull()
      expect(toolbar!.textContent).toContain('让 AI 改写此段')
    })
  })

  it('comment button is hidden without an injected CommentStore', async () => {
    let editor: Editor | null = null
    const { container } = render(<Tessera content={doc} onCreate={ed => (editor = ed)} />)
    await waitFor(() => expect(editor).not.toBeNull())
    await selectText(editor)
    await waitFor(() => {
      expect(container.querySelector('[data-testid="selection-toolbar"]')).not.toBeNull()
    })
    const toolbar = container.querySelector('[data-testid="selection-toolbar"]')!
    expect(toolbar.textContent).not.toContain('💬')
    // collapsible node is present by default → its button stays
    expect(toolbar.textContent).toContain('▸')
  })

  it('collapsible button is hidden when collapsible is excluded', async () => {
    let editor: Editor | null = null
    const { container } = render(
      <Tessera content={doc} excludeBlocks={['collapsible']} onCreate={ed => (editor = ed)} />,
    )
    await waitFor(() => expect(editor).not.toBeNull())
    await selectText(editor)
    await waitFor(() => {
      expect(container.querySelector('[data-testid="selection-toolbar"]')).not.toBeNull()
    })
    expect(container.querySelector('[data-testid="selection-toolbar"]')!.textContent).not.toContain('▸')
  })
})
