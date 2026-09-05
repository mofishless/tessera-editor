// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { Editor } from '@tiptap/core'
import { createTesseraExtensions } from '../preset'
import { docToMarkdown, markdownToDoc, stableJson } from '../markdown'
import type { JSONContent } from '@tiptap/core'

function makeEditor() {
  return new Editor({ extensions: createTesseraExtensions({ locale: 'zh-CN' }) })
}

const richDoc: JSONContent = {
  type: 'doc',
  content: [
    { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Title' }] },
    {
      type: 'paragraph',
      content: [
        { type: 'text', marks: [{ type: 'bold' }], text: 'bold' },
        { type: 'text', text: ' and ' },
        { type: 'text', marks: [{ type: 'italic' }], text: 'italic' },
        { type: 'text', text: ' and ' },
        { type: 'text', marks: [{ type: 'underline' }], text: 'underline' },
        { type: 'text', text: ' and ' },
        { type: 'text', marks: [{ type: 'strike' }], text: 'strike' },
        { type: 'text', text: ' and ' },
        { type: 'text', marks: [{ type: 'code' }], text: 'inline' },
        { type: 'text', text: ' and ' },
        { type: 'text', marks: [{ type: 'highlight' }], text: 'highlight' },
        { type: 'text', text: ' and a ' },
        { type: 'text', marks: [{ type: 'link', attrs: { href: 'https://example.com' } }], text: 'link' },
      ],
    },
    { type: 'blockquote', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Quoted' }] }] },
    {
      type: 'bulletList',
      content: [{ type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Bullet' }] }] }],
    },
    {
      type: 'orderedList',
      content: [{ type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Numbered' }] }] }],
    },
    {
      type: 'taskList',
      content: [
        { type: 'taskItem', attrs: { checked: true }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Done' }] }] },
        { type: 'taskItem', attrs: { checked: false }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Todo' }] }] },
      ],
    },
    { type: 'codeBlock', attrs: { language: 'ts' }, content: [{ type: 'text', text: 'const x = 1' }] },
    {
      type: 'hint',
      attrs: { variant: 'warning' },
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Careful' }] }],
    },
    {
      type: 'collapsible',
      attrs: { open: true },
      content: [
        { type: 'collapsibleSummary', content: [{ type: 'text', text: 'Summary line' }] },
        { type: 'collapsibleContent', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Body' }] }] },
      ],
    },
    { type: 'imageBlock', attrs: { src: 'https://example.com/a.png', alt: 'pic', width: 320, align: 'center' } },
    { type: 'horizontalRule' },
  ],
}

/** Trailing empty paragraphs (TrailingNode) are whitespace: not preserved in Markdown. */
function dropTrailingEmptyParagraph(json: JSONContent): JSONContent {
  const content = json.content ? [...json.content] : []
  while (content.length > 0) {
    const last = content[content.length - 1]!
    if (last.type === 'paragraph' && !last.content) {
      content.pop()
    } else {
      break
    }
  }
  return { ...json, content }
}

describe('markdown interchange', () => {
  it('round-trips a representative document (ids stripped)', () => {
    const editor = makeEditor()
    editor.commands.setContent(richDoc)
    const canonical = dropTrailingEmptyParagraph(stableJson(editor.getJSON()))
    const mdText = docToMarkdown(editor.state.doc, editor.state.schema)
    expect(mdText).toContain('#'.repeat(2) + ' Title')
    expect(mdText).toContain('**bold**')
    expect(mdText).toContain('- [x] Done')
    expect(mdText).toContain('data-type="hint"')
    expect(mdText).toContain('data-type="collapsible"')

    const back = dropTrailingEmptyParagraph(stableJson(markdownToDoc(mdText, editor.state.schema)))
    expect(back).toEqual(canonical)
    editor.destroy()
  })

  it('imports plain markdown with GFM task lists', () => {
    const editor = makeEditor()
    const json = markdownToDoc('# Hello\n\n- [x] done\n- [ ] todo\n\n> quote', editor.state.schema)
    const types = json.content?.map(n => n.type)
    expect(types).toEqual(['heading', 'taskList', 'blockquote'])
    const task = json.content?.[1]
    expect(task?.content?.map(i => i.attrs?.checked)).toEqual([true, false])
    editor.destroy()
  })

  it('exports Markdown from canonical JSON without an editor instance doc', () => {
    const editor = makeEditor()
    const mdText = docToMarkdown(richDoc, editor.state.schema)
    expect(mdText).toContain('```ts')
    editor.destroy()
  })

  it('does not throw on JSON-only marks (textStyle/color, aiAttribution) and keeps the text', () => {
    const editor = makeEditor()
    const doc: JSONContent = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'text', marks: [{ type: 'textStyle', attrs: { color: '#d9414f' } }], text: 'red ' },
            { type: 'text', marks: [{ type: 'aiAttribution', attrs: { pending: true } }], text: 'ai-written' },
          ],
        },
      ],
    }
    // regression: an uncovered mark type made the serializer THROW and crash
    // the host app on export
    const mdText = docToMarkdown(doc, editor.state.schema)
    expect(mdText).toContain('red')
    expect(mdText).toContain('ai-written')
    editor.destroy()
  })
})
