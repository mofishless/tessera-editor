// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { Editor } from '@tiptap/core'
import { createTesseraExtensions } from '../preset'
import {
  getTopLevelBlocks,
  getBlockJson,
  appendBlocks,
  modifyRange,
  removeBlocks,
} from '../writeback'

function makeEditor() {
  return new Editor({ extensions: createTesseraExtensions({ locale: 'zh-CN' }) })
}

const twoParas = {
  type: 'doc',
  content: [
    { type: 'paragraph', content: [{ type: 'text', text: 'Alpha' }] },
    { type: 'paragraph', content: [{ type: 'text', text: 'Beta' }] },
    { type: 'paragraph', content: [{ type: 'text', text: 'Gamma' }] },
  ],
}

describe('write-back protocol', () => {
  it('assigns stable ids to top-level blocks', () => {
    const editor = makeEditor()
    editor.commands.setContent(twoParas)
    const blocks = getTopLevelBlocks(editor)
    expect(blocks).toHaveLength(3)
    expect(blocks.every(b => typeof b.id === 'string' && b.id!.length > 0)).toBe(true)
    editor.destroy()
  })

  it('ids survive unrelated edits', () => {
    const editor = makeEditor()
    editor.commands.setContent(twoParas)
    const before = getTopLevelBlocks(editor).map(b => b.id)
    editor.commands.focus('end')
    editor.commands.insertContent(' tail')
    const after = getTopLevelBlocks(editor).map(b => b.id)
    expect(after).toEqual(before)
    editor.destroy()
  })

  it('getBlockJson returns the block subtree', () => {
    const editor = makeEditor()
    editor.commands.setContent(twoParas)
    const first = getTopLevelBlocks(editor)[0]!
    const json = getBlockJson(editor, first.id as string)
    expect(json?.type).toBe('paragraph')
    expect(json?.content?.[0]?.text).toBe('Alpha')
    editor.destroy()
  })

  it('appendBlocks appends at end and after a given id', () => {
    const editor = makeEditor()
    editor.commands.setContent(twoParas)
    const blocks = getTopLevelBlocks(editor)

    expect(appendBlocks(editor, { content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Delta' }] }] })).toBe(true)
    expect(editor.state.doc.childCount).toBe(4)

    const second = blocks[1]!
    expect(appendBlocks(editor, { afterId: second.id as string, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Inserted' }] }] })).toBe(true)
    const texts = getTopLevelBlocks(editor).map(b => b.node.textContent)
    expect(texts).toEqual(['Alpha', 'Beta', 'Inserted', 'Gamma', 'Delta'])
    editor.destroy()
  })

  it('modifyRange replaces an inclusive id range with new content', () => {
    const editor = makeEditor()
    editor.commands.setContent(twoParas)
    const blocks = getTopLevelBlocks(editor)

    expect(
      modifyRange(editor, {
        fromId: blocks[0]!.id as string,
        toId: blocks[1]!.id as string,
        content: [{ type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Replaced' }] }],
      }),
    ).toBe(true)

    const after = getTopLevelBlocks(editor)
    expect(after).toHaveLength(2)
    expect(after[0]!.type).toBe('heading')
    expect(after[0]!.node.textContent).toBe('Replaced')
    expect(after[1]!.node.textContent).toBe('Gamma')
    editor.destroy()
  })

  it('removeBlocks deletes blocks by ids in one step', () => {
    const editor = makeEditor()
    editor.commands.setContent(twoParas)
    const ids = getTopLevelBlocks(editor)
      .slice(0, 2)
      .map(b => b.id as string)
    expect(removeBlocks(editor, ids)).toBe(true)
    const after = getTopLevelBlocks(editor)
    expect(after).toHaveLength(1)
    expect(after[0]!.node.textContent).toBe('Gamma')
    editor.destroy()
  })

  it('modifyRange as one transaction = one undo step (with realistic spacing)', async () => {
    const editor = makeEditor()
    editor.commands.setContent(twoParas)
    // prosemirror-history merges adjacent edits within newGroupDelay (500ms);
    // space the operations like real usage so the write-back owns its undo step.
    await new Promise(resolve => setTimeout(resolve, 550))
    const blocks = getTopLevelBlocks(editor)
    modifyRange(editor, {
      fromId: blocks[0]!.id as string,
      toId: blocks[2]!.id as string,
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Solo' }] }],
    })
    expect(editor.state.doc.childCount).toBe(1)
    editor.commands.undo()
    expect(editor.state.doc.childCount).toBe(3)
    editor.destroy()
  })
})
