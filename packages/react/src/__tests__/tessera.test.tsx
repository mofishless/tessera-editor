// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, act, waitFor } from '@testing-library/react'
import { Tessera } from '../Tessera'
import type { Editor } from '@tiptap/core'

/**
 * Regression tests for the React binding. The most important one guards the
 * slash-menu fix: any option handed to useEditor with an unstable identity
 * (inline callbacks / config objects) makes @tiptap/react call
 * editor.setOptions on every render, and TipTap's setOptions recreates all
 * plugin views — which silently killed the slash menu UI after the first
 * document change.
 */

const demoDoc = {
  type: 'doc',
  content: [
    { type: 'paragraph', content: [{ type: 'text', text: 'Hello Tessera' }] },
  ],
}

function mountTessera() {
  let editor: Editor | null = null
  const utils = render(
    <Tessera locale="zh-CN" content={demoDoc} onCreate={ed => { editor = ed }} />,
  )
  return { utils, getEditor: () => editor }
}

describe('Tessera (react binding)', () => {
  it('mounts an editor with the document content', async () => {
    const { getEditor } = mountTessera()
    await waitFor(() => expect(getEditor()).not.toBeNull())
    const ed = getEditor()!
    expect(ed)
    expect(ed.state.doc.textContent).toContain('Hello Tessera')
  })

  it('re-renders do not churn plugin views (unregisterPlugin must not fire)', async () => {
    const { utils, getEditor } = mountTessera()
    await waitFor(() => expect(getEditor()).not.toBeNull())
    const ed = getEditor()!
    const unregisterSpy = vi.spyOn(ed, 'unregisterPlugin')

    for (let i = 0; i < 3; i++) {
      utils.rerender(<Tessera locale="zh-CN" content={demoDoc} onCreate={() => {}} />)
      await act(async () => {})
    }
    expect(unregisterSpy).not.toHaveBeenCalled()
  })

  it('slash menu activates on insert and survives re-renders', async () => {
    const { utils, getEditor } = mountTessera()
    await act(async () => {})
    const ed = getEditor()!

    const slashPlugin = () =>
      ed!.state.plugins.find(p => (p as unknown as { key: string }).key.startsWith('tesseraSlashMenu'))

    // activate the suggestion by inserting the trigger character
    await act(async () => {
      ed!.commands.insertContentAt(ed!.state.doc.content.size, '/')
    })
    const pluginAfterInsert = slashPlugin()
    const pluginKey = (pluginAfterInsert as unknown as { key: string }).key
    const stateAfterInsert = pluginAfterInsert
      ? JSON.parse(JSON.stringify((ed!.state as unknown as Record<string, unknown>)[pluginKey]))
      : null
    expect(stateAfterInsert?.active).toBe(true)

    // re-renders must not destroy the suggestion (the historic bug: the
    // started wrapper was removed by a plugin-view destroy on next render)
    const unregisterSpy = vi.spyOn(ed!, 'unregisterPlugin')
    for (let i = 0; i < 3; i++) {
      utils.rerender(<Tessera locale="zh-CN" content={demoDoc} onCreate={() => {}} />)
      await act(async () => {})
    }
    expect(unregisterSpy).not.toHaveBeenCalled()
    expect(slashPlugin()).toBe(pluginAfterInsert)
    const stateAfterRerenders = JSON.parse(JSON.stringify((ed!.state as unknown as Record<string, unknown>)[pluginKey]))
    expect(stateAfterRerenders.active).toBe(true)
  })
})
