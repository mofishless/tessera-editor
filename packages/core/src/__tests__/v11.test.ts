// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { Editor } from '@tiptap/core'
import { createTesseraExtensions, tableToCsvAt, diffDocs, docToMarkdown, markdownToDoc, stableJson, listCommentRanges } from '../index'
import type { StorageService, DocSnapshot } from '../index'

function makeEditor() {
  return new Editor({ extensions: createTesseraExtensions({ locale: 'zh-CN' }) })
}

function buildTable(editor: Editor, rows: { header: string[]; body: string[][] }) {
  const content = [
    {
      type: 'table',
      attrs: { types: ['text', 'number', 'checkbox'] },
      content: [
        {
          type: 'tableRow',
          content: rows.header.map(h => ({ type: 'tableHeader', content: [{ type: 'paragraph', content: [{ type: 'text', text: h }] }] })),
        },
        ...rows.body.map(cells => ({
          type: 'tableRow',
          content: cells.map((c, i) => ({
            type: 'tableCell',
            attrs: i === 1 ? { value: Number(c) } : i === 2 ? { value: c === 'true' } : undefined,
            content: [{ type: 'paragraph', ...(i === 0 ? { content: [{ type: 'text', text: c }] } : {}) }],
          })),
        })),
      ],
    },
  ]
  editor.commands.setContent({ type: 'doc', content })
}

describe('typed tables', () => {
  it('creates via command and round-trips typed attrs', () => {
    const editor = makeEditor()
    editor.commands.setContent({ type: 'doc', content: [{ type: 'paragraph' }] })
    editor.commands.setTextSelection(1)
    expect(editor.commands.insertTableTyped({ rows: 2, cols: 3, withHeaderRow: true })).toBe(true)
    const table = editor.state.doc.child(0)
    expect(table.type.name).toBe('table')
    // types attr defaults to text per column
    editor.commands.setTextSelection(2)
    expect(editor.commands.setColumnType(1, 'number')).toBe(true)
    const updated = editor.state.doc.child(0)
    expect(updated.attrs.types).toEqual(['text', 'number', 'text'])
    editor.destroy()
  })

  it('sorts body rows by a number column and keeps header', () => {
    const editor = makeEditor()
    buildTable(editor, {
      header: ['名称', '数量', '完成'],
      body: [
        ['b', '5', 'false'],
        ['a', '9', 'true'],
        ['c', '1', 'false'],
      ],
    })
    editor.commands.setTextSelection(3)
    expect(editor.commands.sortTableByColumn(1, 'asc')).toBe(true)
    const table = editor.state.doc.child(0)
    const firstRow = table.content.child(1)! // skip header
    expect(firstRow.child(0).textContent).toBe('c')
    const lastRow = table.content.child(3)!
    expect(lastRow.child(0).textContent).toBe('a')
    editor.destroy()
  })

  it('exports CSV with typed formatting', () => {
    const editor = makeEditor()
    buildTable(editor, {
      header: ['名称', '数量', '完成'],
      body: [
        ['a', '9', 'true'],
        ['b', '5', 'false'],
      ],
    })
    editor.commands.setTextSelection(3)
    const csv = tableToCsvAt(editor)
    expect(csv).toContain('名称,数量,完成')
    expect(csv).toContain('a,9,✔')
    expect(csv).toContain('b,5,')
    editor.destroy()
  })

  it('round-trips through markdown as semantic HTML', () => {
    const editor = makeEditor()
    buildTable(editor, {
      header: ['名称', '数量', '完成'],
      body: [['a', '9', 'true']],
    })
    const dropTrailing = (json: import("@tiptap/core").JSONContent) => {
      const content = [...(json.content ?? [])]
      while (content.length && content[content.length - 1]!.type === 'paragraph' && !content[content.length - 1]!.content) {
        content.pop()
      }
      return { ...json, content }
    }
    const canonical = stableJson(dropTrailing(editor.getJSON()))
    const mdText = docToMarkdown(editor.state.doc, editor.state.schema)
    expect(mdText).toContain('<table')
    expect(mdText).toContain('data-types')
    const back = stableJson(dropTrailing(markdownToDoc(mdText, editor.state.schema)))
    expect(back).toEqual(canonical)
    editor.destroy()
  })
})

describe('diff', () => {
  it('classifies added / removed / changed blocks by id', () => {
    const before = {
      type: 'doc',
      content: [
        { type: 'paragraph', attrs: { id: 'p1' }, content: [{ type: 'text', text: 'hello world' }] },
        { type: 'paragraph', attrs: { id: 'p2' }, content: [{ type: 'text', text: 'gone' }] },
      ],
    }
    const after = {
      type: 'doc',
      content: [
        { type: 'paragraph', attrs: { id: 'p1' }, content: [{ type: 'text', text: 'hello there' }] },
        { type: 'paragraph', attrs: { id: 'p3' }, content: [{ type: 'text', text: 'new block' }] },
      ],
    }
    const entries = diffDocs(before, after)
    const byId = Object.fromEntries(entries.filter(e => e.id).map(e => [e.id, e.kind]))
    expect(byId.p1).toBe('changed')
    expect(byId.p2).toBe('removed')
    expect(byId.p3).toBe('added')
    const changed = entries.find(e => e.id === 'p1')!
    expect(changed.wordDiff?.some(p => p.type === 'del' && p.text.includes('world'))).toBe(true)
    expect(changed.wordDiff?.some(p => p.type === 'add' && p.text.includes('there'))).toBe(true)
  })
})

describe('history snapshots', () => {
  it('captures into the injected storage on command', async () => {
    const saved: DocSnapshot[] = []
    const storage: StorageService = {
      saveSnapshot: async snap => {
        saved.push(snap)
      },
      listSnapshots: async () => saved,
    }
    const editor = makeEditor()
    ;(editor.storage as unknown as Record<string, unknown>).tesseraServices = { storage }
    editor.commands.setContent({ type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'v1' }] }] })
    expect(editor.commands.captureSnapshot('manual')).toBe(true)
    await new Promise(r => setTimeout(r, 20))
    expect(saved).toHaveLength(1)
    expect(saved[0]!.label).toBe('manual')
    expect(JSON.stringify(saved[0]!.doc)).toContain('v1')
    editor.destroy()
  })
})

describe('comments', () => {
  it('adds, resolves and lists comment threads in doc order', () => {
    const editor = makeEditor()
    editor.commands.setContent({
      type: 'doc',
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'first second' }] },
      ],
    })
    editor.commands.setTextSelection({ from: 1, to: 6 })
    expect(editor.commands.addCommentThread('t1')).toBe(true)
    editor.commands.setTextSelection({ from: 7, to: 13 })
    expect(editor.commands.addCommentThread('t2')).toBe(true)

    const ranges = listCommentRanges(editor.state)
    expect(ranges.map(r => r.threadId)).toEqual(['t1', 't2'])

    expect(editor.commands.setCommentResolved('t1', true)).toBe(true)
    const after = listCommentRanges(editor.state)
    expect(after.find(r => r.threadId === 't1')?.resolved).toBe(true)

    expect(editor.commands.removeCommentThread('t2')).toBe(true)
    expect(listCommentRanges(editor.state).map(r => r.threadId)).toEqual(['t1'])
    editor.destroy()
  })
})
