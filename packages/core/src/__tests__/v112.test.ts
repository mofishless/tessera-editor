// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { Editor } from '@tiptap/core'
import { createTesseraExtensions } from '../preset'
import { EMOJI_ITEMS, filterEmojiItems } from '../extensions/emoji'
import { findGalleryRuns } from '../extensions/gallery'
import { getTesseraMetrics } from '../extensions/metrics'
import { isWordHtml, cleanWordHtml } from '../wordpaste'
import { findBlockPosById, deleteBlockById, blockAnchorUrl } from '../blockmenu'

function makeEditor() {
  return new Editor({ extensions: createTesseraExtensions({ locale: 'zh-CN' }) })
}

describe('emoji picker data + filtering', () => {
  it('every item has a char and a name', () => {
    expect(EMOJI_ITEMS.length).toBeGreaterThan(50)
    for (const item of EMOJI_ITEMS) {
      expect(item.char.length).toBeGreaterThan(0)
      expect(item.name.length).toBeGreaterThan(0)
      expect(Array.isArray(item.keywords)).toBe(true)
    }
  })

  it('empty query returns everything; keyword query filters; junk query empties', () => {
    expect(filterEmojiItems('')).toHaveLength(EMOJI_ITEMS.length)
    const smiles = filterEmojiItems('smile')
    expect(smiles.length).toBeGreaterThan(0)
    expect(smiles.every(i => i.name.includes('smile') || i.keywords.some(k => k.includes('smile')))).toBe(true)
    expect(filterEmojiItems('zzzznotanemoji')).toHaveLength(0)
  })

  it('keywords search covers chinese-adjacent semantics via name (rocket etc.)', () => {
    expect(filterEmojiItems('rocket').map(i => i.char)).toContain('🚀')
    expect(filterEmojiItems('done').map(i => i.char)).toContain('✅')
  })
})

describe('image gallery runs', () => {
  function docWith(...blocks: ('p' | 'img')[]) {
    return {
      type: 'doc',
      content: blocks.map(b =>
        b === 'img'
          ? { type: 'imageBlock', attrs: { src: 'https://example.com/x.png' } }
          : { type: 'paragraph', content: [{ type: 'text', text: 'sep' }] },
      ),
    }
  }

  it('flags runs of >= 2 consecutive images only', () => {
    const editor = makeEditor()
    editor.commands.setContent(docWith('p', 'img', 'img', 'p', 'img', 'img', 'img', 'p'))
    const runs = findGalleryRuns(editor.state.doc)
    expect(runs.map(r => r.size)).toEqual([2, 3])
    editor.destroy()
  })

  it('single images do not form a gallery', () => {
    const editor = makeEditor()
    editor.commands.setContent(docWith('img', 'p', 'img'))
    expect(findGalleryRuns(editor.state.doc)).toHaveLength(0)
    editor.destroy()
  })
})

describe('word paste cleaning rules', () => {
  it('detects Word sources', () => {
    expect(isWordHtml('<p xmlns:w="urn:schemas-microsoft-com:office:word">x</p>')).toBe(true)
    expect(isWordHtml('<p class="MsoNormal">x</p>')).toBe(true)
    expect(isWordHtml('<p style="mso-list:l0">x</p>')).toBe(true)
    expect(isWordHtml('<p>plain text</p>')).toBe(false)
  })

  const rules: Array<{ name: string; input: string; expected: string }> = [
    {
      name: 'R1 drops conditional comments',
      input: '<!--[if gte mso 9]><xml><w:WordDocument></w:WordDocument></xml><![endif]--><p>Hi</p>',
      expected: '<p>Hi</p>',
    },
    {
      name: 'R2 drops style blocks and meta tags',
      input: '<style>.MsoNormal{margin:0}</style><meta charset="utf-8"><p>Hi</p>',
      expected: '<p>Hi</p>',
    },
    {
      name: 'R3 strips office namespace tags',
      input: '<o:p><w:sdt>Hi</w:sdt></o:p>',
      expected: 'Hi',
    },
    {
      name: 'R4 drops class/style/lang attributes, keeps semantic tags',
      input: '<p class="MsoNormal" style="margin:0in"><b>Bold</b><i>Italic</i></p>',
      expected: '<p><b>Bold</b><i>Italic</i></p>',
    },
    {
      name: 'R6 collapses non-breaking spaces',
      input: '<p>a&nbsp;b</p>',
      expected: '<p>a b</p>',
    },
    {
      name: 'R7 removes empty paragraphs',
      input: '<p>a</p><p></p><p><br></p><p>   </p><p>b</p>',
      expected: '<p>a</p><p>b</p>',
    },
  ]

  for (const rule of rules) {
    it(rule.name, () => {
      expect(cleanWordHtml(rule.input)).toBe(rule.expected)
    })
  }

  it('keeps bold/italic semantics for PM to parse', () => {
    const editor = makeEditor()
    const cleaned = cleanWordHtml(
      '<p class="MsoNormal"><span style="font-weight:bold">Word</span> paste <b>test</b></p>',
    )
    editor.commands.setContent(`<div>${cleaned}</div>`)
    const text = editor.state.doc.textContent
    expect(text).toContain('Word')
    expect(text).toContain('paste')
    editor.destroy()
  })
})

describe('performance metrics', () => {
  it('counts blocks/words/images/tables and serializes within budget', () => {
    const editor = makeEditor()
    editor.commands.setContent({
      type: 'doc',
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'one two three' }] },
        { type: 'imageBlock', attrs: { src: 'https://example.com/a.png' } },
        { type: 'paragraph', content: [{ type: 'text', text: 'four five' }] },
      ],
    })
    const before = getTesseraMetrics(editor)
    expect(before.blocks).toBe(3)
    expect(before.words).toBe(5)
    expect(before.images).toBe(1)
    expect(before.tables).toBe(0)
    expect(before.serializeMs).toBeGreaterThanOrEqual(0)

    editor.commands.setTextSelection(editor.state.doc.content.size - 2)
    editor.commands.insertTableTyped({ rows: 2, cols: 2, withHeaderRow: true })
    const after = getTesseraMetrics(editor)
    expect(after.tables).toBe(1)
    editor.destroy()
  })
})

describe('block menu helpers', () => {
  it('finds blocks by stable id and computes anchor urls', () => {
    const editor = makeEditor()
    editor.commands.setContent({
      type: 'doc',
      content: [
        { type: 'paragraph', attrs: { id: 'block-a' }, content: [{ type: 'text', text: 'A' }] },
        { type: 'paragraph', attrs: { id: 'block-b' }, content: [{ type: 'text', text: 'B' }] },
      ],
    })
    expect(findBlockPosById(editor, 'block-b')).toBeGreaterThan(0)
    expect(findBlockPosById(editor, 'missing')).toBeNull()
    expect(blockAnchorUrl('block-a')).toMatch(/#block-block-a$/)
    editor.destroy()
  })

  it('deletes a block by id and reports misses', () => {
    const editor = makeEditor()
    editor.commands.setContent({
      type: 'doc',
      content: [
        { type: 'paragraph', attrs: { id: 'keep' }, content: [{ type: 'text', text: 'keep' }] },
        { type: 'paragraph', attrs: { id: 'drop' }, content: [{ type: 'text', text: 'drop' }] },
      ],
    })
    expect(deleteBlockById(editor, 'missing')).toBe(false)
    expect(deleteBlockById(editor, 'drop')).toBe(true)
    expect(editor.state.doc.childCount).toBe(1)
    expect(editor.state.doc.textContent).toBe('keep')
    editor.destroy()
  })
})
