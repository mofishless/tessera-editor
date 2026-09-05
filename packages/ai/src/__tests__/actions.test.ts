// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { Editor } from '@tiptap/core'
import { createTesseraExtensions } from '@tessera-editor/core'
import { improveSelection, summarizeDoc, askDoc } from '../actions'
import type { AIRuntime } from '../runtime'

function makeEditor() {
  return new Editor({ extensions: createTesseraExtensions({ locale: 'zh-CN' }) })
}

function fakeRuntime(reply: string, opts: { delayMs?: number } = {}): AIRuntime {
  return {
    id: 'fake',
    async chat(input) {
      if (opts.delayMs) {
        for (const token of reply.match(/[\s\S]{1,3}/g) ?? []) {
          input.stream?.onToken?.(token)
          await new Promise(r => setTimeout(r, opts.delayMs))
        }
      }
      return reply
    },
  }
}

describe('AI actions', () => {
  it('improveSelection replaces selection with marked pending text', async () => {
    const editor = makeEditor()
    editor.commands.setContent({
      type: 'doc',
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'hello ugly world' }] },
      ],
    })
    editor.commands.setTextSelection({ from: 1 + 6, to: 1 + 10 }) // "ugly"
    const session = await improveSelection(editor, fakeRuntime('beautiful'), {})
    expect(session).not.toBeNull()

    const text = editor.state.doc.textContent
    expect(text).toContain('beautiful')
    expect(text).toContain('hello')
    expect(text).toContain('world')

    // pending mark present
    let pending = false
    editor.state.doc.descendants(node => {
      if (node.marks.some(m => m.type.name === 'aiAttribution' && m.attrs.pending)) {
        pending = true
      }
      return true
    })
    expect(pending).toBe(true)

    // accept flips pending
    session!.accept()
    let accepted = false
    let stillPending = false
    editor.state.doc.descendants(node => {
      for (const m of node.marks) {
        if (m.type.name !== 'aiAttribution') continue
        if (m.attrs.pending) stillPending = true
        else accepted = true
      }
      return true
    })
    expect(accepted).toBe(true)
    expect(stillPending).toBe(false)
    editor.destroy()
  })

  it('improveSelection reject restores original text', async () => {
    const editor = makeEditor()
    editor.commands.setContent({
      type: 'doc',
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'keep this part' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'B' }] },
      ],
    })
    editor.commands.setTextSelection({ from: 1, to: 15 })
    const session = await improveSelection(editor, fakeRuntime('REWRITTEN'), {})
    expect(editor.state.doc.textContent).toContain('REWRITTEN')
    session!.reject()
    expect(editor.state.doc.textContent).toBe('keep this partB')
    editor.destroy()
  })

  it('improveSelection returns null for empty selection', async () => {
    const editor = makeEditor()
    editor.commands.setContent({ type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'x' }] }] })
    editor.commands.setTextSelection(2)
    const session = await improveSelection(editor, fakeRuntime('y'), {})
    expect(session).toBeNull()
    editor.destroy()
  })

  it('summarizeDoc inserts TL;DR hint at top with pending mark', async () => {
    const editor = makeEditor()
    editor.commands.setContent({
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Doc' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Body text about testing.' }] },
      ],
    })
    const session = await summarizeDoc(editor, fakeRuntime('A concise summary.'), {})
    expect(session).not.toBeNull()
    const first = editor.state.doc.child(0)
    expect(first.type.name).toBe('hint')
    expect(first.textContent).toContain('A concise summary.')
    session!.accept()
    expect(editor.state.doc.child(0).textContent).toContain('A concise summary.')
    editor.destroy()
  })

  it('askDoc answers from doc without writing', async () => {
    const editor = makeEditor()
    editor.commands.setContent({
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'The password is 12345.' }] }],
    })
    const before = editor.getJSON()
    const answer = await askDoc(editor, fakeRuntime('The password is 12345.'), 'password?')
    expect(answer).toContain('password')
    expect(editor.getJSON()).toEqual(before)
    editor.destroy()
  })
})
