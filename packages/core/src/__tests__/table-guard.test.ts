// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { Editor } from '@tiptap/core'
import { createTesseraExtensions } from '../preset'
import { cellKindAt } from '../nodes/table'

function makeEditor() {
  return new Editor({ extensions: createTesseraExtensions({ locale: 'zh-CN' }) })
}

const docWithTypedTable = {
  type: 'doc',
  content: [
    {
      type: 'table',
      attrs: { types: ['text', 'date'] },
      content: [
        {
          type: 'tableRow',
          content: [
            { type: 'tableHeader', content: [{ type: 'paragraph', content: [{ type: 'text', text: '任务' }] }] },
            { type: 'tableHeader', content: [{ type: 'paragraph', content: [{ type: 'text', text: '日期' }] }] },
          ],
        },
        {
          type: 'tableRow',
          content: [
            { type: 'tableCell', content: [{ type: 'paragraph', content: [{ type: 'text', text: '行A' }] }] },
            {
              type: 'tableCell',
              attrs: { value: '2026-01-01' },
              content: [{ type: 'paragraph', content: [{ type: 'text', text: '残留文本' }] }],
            },
          ],
        },
      ],
    },
  ],
}

function cellPositions(editor: Editor) {
  const out = { text: -1, typed: -1, typedFrom: 0, typedTo: 0 }
  editor.state.doc.descendants((node, pos) => {
    if (node.type.name === 'tableCell') {
      const text = node.textContent
      if (text === '行A') out.text = pos + 1
      if (text === '残留文本') {
        out.typed = pos + 1
        out.typedFrom = pos + 1
        out.typedTo = pos + node.nodeSize - 1
      }
    }
    return undefined as never
  })
  return out
}

describe('typed cell guard', () => {
  it('cellKindAt resolves typed vs text vs non-cell positions', () => {
    const ed = makeEditor()
    ed.commands.setContent(docWithTypedTable)
    const p = cellPositions(ed)
    expect(cellKindAt(ed.state.doc, p.typed)).toBe('date')
    expect(cellKindAt(ed.state.doc, p.text)).toBe('text')
    expect(cellKindAt(ed.state.doc, 0)).toBeNull()
  })

  it('blocks text input and clicks in typed cells only', () => {
    const ed = makeEditor()
    ed.commands.setContent(docWithTypedTable)
    const p = cellPositions(ed)
    // someProp aggregates plugins; capture every handler's verdict instead
    const results: unknown[] = []
    const tryProp = (prop: string, run: (f: unknown) => unknown) => {
      results.length = 0
      ;(ed.view.someProp as (prop2: string, f: (x: unknown) => unknown) => unknown)(prop, f => {
        results.push(run(f))
        return undefined // keep aggregating every plugin's verdict
      })
      return results
    }
    const inputTyped = tryProp('handleTextInput', f =>
      (f as (v: unknown, from: number, to: number, text: string) => boolean)(ed.view, p.typed, p.typed, 'x'),
    )
    expect(inputTyped.some(v => v === true)).toBe(true) // typed cell: input blocked
    const inputText = tryProp('handleTextInput', f =>
      (f as (v: unknown, from: number, to: number, text: string) => boolean)(ed.view, p.text, p.text, 'x'),
    )
    expect(inputText.every(v => v !== true)).toBe(true) // text cell: normal editing
    const clickTyped = tryProp('handleClick', f =>
      (f as (v: unknown, pos: number, e: unknown) => boolean)(ed.view, p.typed, {}),
    )
    expect(clickTyped.some(v => v === true)).toBe(true)
  })

  it('atomicRanges covers typed cell content so the caret skips it', () => {
    const ed = makeEditor()
    ed.commands.setContent(docWithTypedTable)
    const p = cellPositions(ed)
    const collected: { from: number; to: number }[][] = []
    ;(ed.view.someProp as (prop: string, f: (x: unknown) => unknown) => unknown)('atomicRanges', f => {
      collected.push((f as (s: unknown) => { from: number; to: number }[])(ed.state))
      return undefined
    })
    const ranges = collected.flat()
    expect(ranges.some(r => r.from <= p.typed && r.to >= p.typedTo)).toBe(true)
  })

  it('normalizeTypedCells strips stray text in typed cells only', () => {
    const ed = makeEditor()
    ed.commands.setContent(docWithTypedTable)
    expect(ed.commands.normalizeTypedCells()).toBe(true)
    const table = ed.state.doc.nodeAt(0)!
    const bodyRow = table.child(1)
    expect(bodyRow.child(0).textContent).toBe('行A') // text column untouched
    expect(bodyRow.child(1).textContent).toBe('') // typed column cleaned
    const header = table.child(0)
    expect(header.child(1).textContent).toBe('日期') // header text untouched
  })

  it('setColumnType to a typed kind clears that column’s stray text', () => {
    const ed = makeEditor()
    const plain = {
      type: 'doc',
      content: [
        {
          type: 'table',
          attrs: { types: ['text', 'text'] },
          content: [
            {
              type: 'tableRow',
              content: [
                { type: 'tableHeader', content: [{ type: 'paragraph' }] },
                { type: 'tableHeader', content: [{ type: 'paragraph' }] },
              ],
            },
            {
              type: 'tableRow',
              content: [
                { type: 'tableCell', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'A1' }] }] },
                { type: 'tableCell', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'B1' }] }] },
              ],
            },
          ],
        },
      ],
    }
    ed.commands.setContent(plain)
    ed.commands.setColumnType(1, 'number')
    const table = ed.state.doc.nodeAt(0)!
    const bodyRow = table.child(1)
    expect(bodyRow.child(0).textContent).toBe('A1')
    expect(bodyRow.child(1).textContent).toBe('')
  })
})
