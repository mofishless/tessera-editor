// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { Editor } from '@tiptap/core'
import { createTesseraExtensions } from '../preset'
import { findLinkRange, saveLinkRange, removeLinkRange } from '../linkedit'

function makeEditor() {
  return new Editor({ extensions: createTesseraExtensions({ locale: 'zh-CN' }) })
}

const docWithLink = {
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'see ' },
        {
          type: 'text',
          text: 'Tessera docs',
          marks: [{ type: 'link', attrs: { href: 'https://example.com' } }],
        },
        { type: 'text', text: ' now' },
      ],
    },
  ],
}

// 'see ' occupies doc positions 1..5, the link text 5..17
const LINK_START = 5
const LINK_END = 17

describe('link click-to-edit helpers', () => {
  it('finds the link range from a caret inside the link', () => {
    const ed = makeEditor()
    ed.commands.setContent(docWithLink)
    const range = findLinkRange(ed, LINK_START + 3)
    expect(range).not.toBeNull()
    expect(range!.from).toBe(LINK_START)
    expect(range!.to).toBe(LINK_END)
    expect(range!.text).toBe('Tessera docs')
    expect(range!.href).toBe('https://example.com')
  })

  it('resolves a caret parked at the link end via the pos-1 fallback', () => {
    const ed = makeEditor()
    ed.commands.setContent(docWithLink)
    const range = findLinkRange(ed, LINK_END)
    expect(range).not.toBeNull()
    expect(range!.text).toBe('Tessera docs')
  })

  it('returns null in plain text', () => {
    const ed = makeEditor()
    ed.commands.setContent(docWithLink)
    expect(findLinkRange(ed, 2)).toBeNull()
  })

  it('save keeps the text and updates only the href', () => {
    const ed = makeEditor()
    ed.commands.setContent(docWithLink)
    const range = findLinkRange(ed, LINK_START + 1)!
    saveLinkRange(ed, range, { text: range.text, href: 'https://new.example.com' })
    const after = findLinkRange(ed, LINK_START + 1)!
    expect(after.href).toBe('https://new.example.com')
    expect(after.text).toBe('Tessera docs')
    expect(ed.state.doc.textBetween(1, ed.state.doc.content.size, '\n')).toBe('see Tessera docs now')
  })

  it('save replaces the display text while keeping the link', () => {
    const ed = makeEditor()
    ed.commands.setContent(docWithLink)
    const range = findLinkRange(ed, LINK_START + 1)!
    saveLinkRange(ed, range, { text: '官方文档', href: range.href })
    const after = findLinkRange(ed, LINK_START + 1)!
    expect(after.text).toBe('官方文档')
    expect(after.href).toBe('https://example.com')
    expect(ed.state.doc.textBetween(1, ed.state.doc.content.size, '\n')).toBe('see 官方文档 now')
  })

  it('remove strips the link mark but keeps the text', () => {
    const ed = makeEditor()
    ed.commands.setContent(docWithLink)
    const range = findLinkRange(ed, LINK_START + 1)!
    removeLinkRange(ed, range)
    expect(findLinkRange(ed, LINK_START + 1)).toBeNull()
    expect(ed.state.doc.textBetween(1, ed.state.doc.content.size, '\n')).toBe('see Tessera docs now')
  })

  it('saving an empty href degrades to plain text', () => {
    const ed = makeEditor()
    ed.commands.setContent(docWithLink)
    const range = findLinkRange(ed, LINK_START + 1)!
    saveLinkRange(ed, range, { text: range.text, href: '   ' })
    expect(findLinkRange(ed, LINK_START + 1)).toBeNull()
    expect(ed.state.doc.textBetween(1, ed.state.doc.content.size, '\n')).toBe('see Tessera docs now')
  })
})
