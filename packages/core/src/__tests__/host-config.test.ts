// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import {
  createTesseraSchema,
  filterSlashItems,
  defaultSlashItems,
  createTesseraT,
} from '../index'
import { docToMarkdown, markdownToDoc } from '../markdown'

/**
 * Host configuration surface (block policy + headless schema factory):
 * excludeBlocks must remove the node from the schema entirely — the editor
 * can neither create nor parse it — while conversion helpers stay consistent
 * with the mounted editor's schema.
 */

const RESTRICTED = ['hint', 'collapsible', 'embedBlock', 'tocBlock', 'horizontalRule']

describe('createTesseraSchema / excludeBlocks', () => {
  it('excluded block types are absent from the schema; kept types remain', () => {
    const schema = createTesseraSchema({ locale: 'zh-CN', excludeBlocks: RESTRICTED })
    for (const name of RESTRICTED) {
      expect(schema.nodes[name], `${name} 应被剔除`).toBeUndefined()
    }
    for (const name of [
      'paragraph',
      'heading',
      'bulletList',
      'orderedList',
      'taskList',
      'blockquote',
      'codeBlock',
      'imageBlock',
      'table',
    ]) {
      expect(schema.nodes[name], `${name} 应保留`).toBeDefined()
    }
  })

  it('default preset keeps every block type', () => {
    const schema = createTesseraSchema()
    for (const name of RESTRICTED) {
      expect(schema.nodes[name]).toBeDefined()
    }
  })

  it('markdown roundtrip works on the restricted schema', () => {
    const schema = createTesseraSchema({ excludeBlocks: RESTRICTED })
    const md = [
      '# 背景',
      '',
      '正文段落。',
      '',
      '- 甲',
      '- 乙',
      '',
      '1. 一',
      '2. 二',
      '',
      '- [x] 已办',
      '- [ ] 待办',
      '',
      '> 引用',
      '',
      '```ts',
      'const a = 1',
      '```',
      '',
      '![图](https://example.com/a.png)',
    ].join('\n')
    const doc = markdownToDoc(md, schema)
    const out = docToMarkdown(doc, schema)
    expect(out).toContain('# 背景')
    expect(out).toContain('正文段落。')
    expect(out).toContain('甲')
    expect(out).toContain('1. 一')
    expect(out).toContain('[x] 已办')
    expect(out).toContain('> 引用')
    expect(out).toContain('```ts')
    expect(out).toContain('a.png')
  })
})

describe('filterSlashItems', () => {
  const t = createTesseraT('zh-CN')

  it('drops items whose node type is excluded (id → node aliasing)', () => {
    const filtered = filterSlashItems(defaultSlashItems(t), RESTRICTED)
    const ids = new Set(filtered.map(item => item.id))
    for (const gone of ['hint', 'collapsible', 'embed', 'toc', 'divider']) {
      expect(ids.has(gone), `${gone} 应从斜杠菜单剔除`).toBe(false)
    }
    for (const kept of [
      'text',
      'h1',
      'h4',
      'bulletList',
      'orderedList',
      'taskList',
      'quote',
      'codeBlock',
      'image',
      'table',
    ]) {
      expect(ids.has(kept), `${kept} 应保留`).toBe(true)
    }
  })

  it('no exclusion → list unchanged', () => {
    const items = defaultSlashItems(t)
    expect(filterSlashItems(items)).toEqual(items)
    expect(filterSlashItems(items, [])).toEqual(items)
  })
})
