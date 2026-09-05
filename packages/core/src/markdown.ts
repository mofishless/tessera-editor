import MarkdownIt from 'markdown-it'
import { DOMParser as PMDOMParser, DOMSerializer } from '@tiptap/pm/model'
import { MarkdownSerializer, defaultMarkdownSerializer } from 'prosemirror-markdown'
import type { Node as PMNode, Schema } from '@tiptap/pm/model'
import type { JSONContent } from '@tiptap/core'

/**
 * Interchange format layer (ADR-0004): the canonical format is JSON; Markdown
 * is the interchange format with guaranteed two-way conversion.
 *
 * Standard blocks → plain Markdown. Task lists → GFM `- [x]`.
 * Tessera structural blocks (hint / collapsible / imageBlock) → semantic HTML,
 * which round-trips through our parseHTML rules and stays portable elsewhere.
 *
 * Export limitations (documented): text color and AI attribution marks do not
 * carry into Markdown (no static syntax); they survive JSON only.
 */

/** markdown-it plugin: GFM task lists (`- [x] text`) → ul/li[data-*]. */
interface MdToken {
  type: string
  content?: string
  children?: MdToken[]
  attrSet?: (name: string, value: string) => void
}
interface MdState {
  tokens: MdToken[]
}
interface MarkdownItLike {
  core: {
    ruler: {
      after: (afterName: string, ruleName: string, fn: (state: MdState) => void) => void
    }
  }
}

function taskListPlugin(md: MarkdownItLike): void {
  md.core.ruler.after('inline', 'tessera-tasklist', state => {
    const tokens = state.tokens
    const taskItems = new Set<number>()
    for (let i = 0; i < tokens.length; i++) {
      if (tokens[i]!.type !== 'inline') continue
      let p = -1
      if (tokens[i - 1]?.type === 'paragraph_open') p = i - 2
      if (p === -1 || tokens[p]?.type !== 'list_item_open') continue
      const children = tokens[i]!.children
      if (!children || children.length === 0) continue
      const first = children[0]!
      const m = /^\[([ xX])\]\s+/.exec(first.content ?? '')
      if (!m) continue
      first.content = (first.content ?? '').slice(m[0].length)
      for (let j = 1; j < children.length; j++) {
        const child = children[j]!
        child.content = (child.content ?? '').replace(/^\[([ xX])\]\s+/, '')
      }
      tokens[p]!.attrSet?.('data-type', 'taskItem')
      tokens[p]!.attrSet?.('data-checked', m[1] === ' ' ? 'false' : 'true')
      taskItems.add(p)
    }
    for (let i = 0; i < tokens.length; i++) {
      if (tokens[i]!.type !== 'bullet_list_open') continue
      for (let j = i + 1; j < tokens.length; j++) {
        if (tokens[j]!.type === 'bullet_list_close') break
        if (tokens[j]!.type === 'list_item_open' && taskItems.has(j)) {
          tokens[i]!.attrSet?.('data-type', 'taskList')
          break
        }
      }
    }
  })
}

const md = MarkdownIt({ html: true, linkify: true }).use(
  // structural mismatch is only in the type layer (markdown-it Token typings)
  taskListPlugin as unknown as Parameters<ReturnType<typeof MarkdownIt>['use']>[0],
)

interface SerializerState {
  write: (s: string) => void
  renderContent: (n: PMNode) => void
  renderList: (n: PMNode, delim: string, firstDelim: (index: number) => string) => void
  closeBlock: (n: PMNode) => void
}

function stripIds(json: JSONContent): JSONContent {
  const walk = (node: JSONContent): JSONContent => {
    const attrs = node.attrs && 'id' in node.attrs
      ? Object.fromEntries(Object.entries(node.attrs).filter(([k]) => k !== 'id'))
      : node.attrs
    return {
      ...node,
      attrs,
      content: node.content?.map(walk),
    } as JSONContent
  }
  return walk(json)
}

function nodeToHtml(node: PMNode): string {
  // strip ids: interchange HTML must not leak internal block identity
  const clean = node.type.schema.nodeFromJSON(stripIds(node.toJSON()))
  const dom = DOMSerializer.fromSchema(node.type.schema).serializeNode(clean) as HTMLElement
  return dom.outerHTML
}

export function createMarkdownSerializer(schema: Schema): MarkdownSerializer {
  const nodes: Record<string, (state: SerializerState, node: PMNode) => void> = {
    ...defaultMarkdownSerializer.nodes,
  } as never

  // prosemirror-markdown's defaults use example-schema snake_case node
  // names; provide camelCase (TipTap) equivalents.
  const rep = (s: string, n: number) => ' '.repeat(n)
  nodes.bulletList = (state, node) => {
    state.renderList(node, '  ', () => '- ')
    state.closeBlock(node)
  }
  nodes.orderedList = (state, node) => {
    const start = Number(node.attrs.order ?? 1)
    const maxW = String(start + node.childCount - 1).length
    const space = rep(' ', maxW + 2)
    state.renderList(node, space, i => {
      const n = String(start + i)
      return rep(' ', maxW - n.length) + n + '. '
    })
    state.closeBlock(node)
  }
  nodes.listItem = (state, node) => {
    state.renderContent(node)
  }
  nodes.codeBlock = (state, node) => {
    state.write('```' + (node.attrs.language ?? '') + '\n')
    state.write(node.textContent)
    state.write('\n```')
    state.closeBlock(node)
  }
  nodes.horizontalRule = (state, node) => {
    state.write('---')
    state.closeBlock(node)
  }
  nodes.hardBreak = state => {
    state.write('\\\n')
  }

  nodes.taskList = (state, node) => {
    state.renderList(node, '  ', () => '- ')
    state.closeBlock(node)
  }
  nodes.taskItem = (state, node) => {
    state.write(node.attrs.checked ? '[x] ' : '[ ] ')
    state.renderContent(node)
  }
  nodes.hint = (state, node) => {
    state.write(nodeToHtml(node))
    state.closeBlock(node)
  }
  nodes.collapsible = (state, node) => {
    state.write(nodeToHtml(node))
    state.closeBlock(node)
  }
  nodes.imageBlock = (state, node) => {
    state.write(nodeToHtml(node))
    state.closeBlock(node)
  }
  nodes.table = (state, node) => {
    // tables carry typed-column metadata in attrs — HTML keeps it round-trip
    state.write(nodeToHtml(node))
    state.closeBlock(node)
  }
  nodes.tableRow = () => {}
  nodes.tableCell = () => {}
  nodes.tableHeader = () => {}
  nodes.embedBlock = (state, node) => {
    state.write(nodeToHtml(node))
    state.closeBlock(node)
  }
  nodes.tocBlock = (state, node) => {
    state.write('<div data-type="tessera-toc"></div>')
    state.closeBlock(node)
  }

  // prosemirror-markdown's defaults use the example-schema mark names
  // (strong/em); map TipTap's names explicitly.
  const marks = {
    ...defaultMarkdownSerializer.marks,
    bold: { open: '**', close: '**', mixable: true, expelEnclosingWhitespace: true },
    italic: { open: '*', close: '*', mixable: true, expelEnclosingWhitespace: true },
    strike: { open: '~~', close: '~~', mixable: true, expelEnclosingWhitespace: true },
    code: { open: '`', close: '`', escape: false },
    link: {
      open: '[',
      close: (state: { out: string }, mark: { attrs: { href: string } }) => `](${mark.attrs.href})`,
      mixable: false,
    } as never,
    underline: { open: '<u>', close: '</u>', mixable: true, expelEnclosingWhitespace: true },
    highlight: { open: '<mark>', close: '</mark>', mixable: true, expelEnclosingWhitespace: true },
    // transparent passthroughs: these marks carry no Markdown syntax.
    // Omitting them makes prosemirror-markdown THROW on export (crashes the
    // host app) — textStyle always accompanies Color, and aiAttribution rides
    // on AI-written text.
    textStyle: { open: '', close: '', mixable: true },
    color: { open: '', close: '', mixable: true },
    aiAttribution: { open: '', close: '', mixable: true },
    tesseraPlaceholder: { open: '', close: '', mixable: true },
    comment: { open: '', close: '', mixable: true },
  }

  return new MarkdownSerializer(nodes as never, marks as never)
}

/** Canonical JSON (or doc node) → Markdown. */
export function docToMarkdown(doc: PMNode | JSONContent, schema: Schema): string {
  const isNode = typeof (doc as PMNode).nodeSize === 'number' && typeof (doc as PMNode).type === 'object'
  const realDoc = isNode ? (doc as PMNode) : schema.nodeFromJSON(doc as JSONContent)
  return createMarkdownSerializer(schema).serialize(realDoc)
}

/** Markdown → canonical JSON (authoritative format). Requires DOM (browser/jsdom). */
export function markdownToDoc(markdown: string, schema: Schema): JSONContent {
  const html = md.render(markdown)
  const container = document.createElement('div')
  container.innerHTML = html
  const parsed = PMDOMParser.fromSchema(schema).parse(container)
  return parsed.toJSON()
}

/** Strip volatile/whitespace-irrelevant fields for round-trip comparisons. */
export function stableJson(json: JSONContent): JSONContent {
  const clone = JSON.parse(JSON.stringify(json)) as JSONContent
  const walk = (node: JSONContent) => {
    if (node.attrs && 'id' in node.attrs) {
      const { id: _drop, ...rest } = node.attrs
      if (Object.keys(rest).length === 0) {
        delete node.attrs
      } else {
        node.attrs = rest
      }
    }
    // highlight color: null (default) vs "" (parsed) are equivalent absence
    node.marks = node.marks?.map(mark => {
      if (mark.attrs) {
        const attrs = Object.fromEntries(
          Object.entries(mark.attrs).filter(([, v]) => v !== null && v !== ''),
        )
        return { ...mark, attrs }
      }
      return mark
    })
    // code blocks: trailing whitespace-only diff is not semantic
    if (node.type === 'codeBlock' && node.content) {
      node.content = node.content.map(child =>
        child.type === 'text' ? { ...child, text: (child.text ?? '').replace(/\s+$/, '') } : child,
      )
      node.content = node.content.filter(child => !(child.type === 'text' && child.text === ''))
    }
    node.content?.forEach(walk)
  }
  walk(clone)
  return clone
}
