import type { Editor, JSONContent } from '@tiptap/core'

/**
 * Write-back protocol (ADR-0001 / product-definition §4): AI and host code
 * mutate the document by stable block IDs — never whole-doc rewrites.
 * Semantics mirror SliteML's modifyRange / appendBlocks / removeBlocks.
 */

export interface BlockHandle {
  /** stable block id (UniqueID extension); null when the block predates ids */
  id: string | null
  type: string
  pos: number
  node: import('@tiptap/pm/model').Node
}

/** Top-level blocks with their ids, in document order. */
export function getTopLevelBlocks(editor: Editor): BlockHandle[] {
  const blocks: BlockHandle[] = []
  editor.state.doc.forEach((node, offset) => {
    blocks.push({ id: (node.attrs.id as string | undefined) ?? null, type: node.type.name, pos: offset, node })
  })
  return blocks
}

function findBlockPosById(editor: Editor, id: string): number | null {
  let found: number | null = null
  editor.state.doc.forEach((node, offset) => {
    if (found === null && node.attrs.id === id) {
      found = offset
    }
  })
  return found
}

function newBlockId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `tessera-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

function resolveBlocks(editor: Editor, blocks: JSONContent[]) {
  return blocks.map(json => {
    const clean = { ...json }
    // Write-back content carries fresh ids of its own: UniqueID skips nodes
    // that already have one, so the ids land inside the same transaction
    // (single undo step) instead of a follow-up append.
    clean.attrs = { ...(clean.attrs ?? {}), id: newBlockId() }
    return editor.state.schema.nodeFromJSON(clean)
  })
}

export interface ModifyRangeOptions {
  /** first block to replace (default: first block in doc) */
  fromId?: string
  /** last block to replace, inclusive (default: fromId) */
  toId?: string
  content: JSONContent[]
}

/**
 * Replace the inclusive block range [fromId … toId] with `content`.
 * One transaction → one undo step.
 */
export function modifyRange(editor: Editor, options: ModifyRangeOptions): boolean {
  const blocks = getTopLevelBlocks(editor).filter(b => b.id)
  if (blocks.length === 0) {
    return false
  }
  const ids = blocks.map(b => b.id as string)
  const fromId = options.fromId ?? ids[0]
  const toId = options.toId ?? fromId

  let fromIndex = ids.indexOf(fromId)
  let toIndex = ids.indexOf(toId)
  if (fromIndex === -1 || toIndex === -1) {
    return false
  }
  if (fromIndex > toIndex) {
    ;[fromIndex, toIndex] = [toIndex, fromIndex]
  }

  const fromBlock = blocks[fromIndex]
  const toBlock = blocks[toIndex]
  const from = fromBlock.pos
  const to = toBlock.pos + toBlock.node.nodeSize

  const nodes = resolveBlocks(editor, options.content)
  const tr = editor.state.tr
  tr.replaceWith(from, to, nodes)
  editor.view.dispatch(tr)
  return true
}

export interface AppendBlocksOptions {
  /** insert after this block (default: end of document) */
  afterId?: string
  content: JSONContent[]
}

/** Append blocks after `afterId` (or at the document end). */
export function appendBlocks(editor: Editor, options: AppendBlocksOptions): boolean {
  const nodes = resolveBlocks(editor, options.content)
  if (nodes.length === 0) {
    return false
  }
  let insertPos = editor.state.doc.content.size
  if (options.afterId) {
    const pos = findBlockPosById(editor, options.afterId)
    if (pos === null) {
      return false
    }
    const node = editor.state.doc.nodeAt(pos)
    if (!node) {
      return false
    }
    insertPos = pos + node.nodeSize
  }
  const tr = editor.state.tr
  tr.insert(insertPos, nodes)
  editor.view.dispatch(tr)
  return true
}

/** Remove blocks by ids. One transaction → one undo step. */
export function removeBlocks(editor: Editor, ids: string[]): boolean {
  if (ids.length === 0) {
    return false
  }
  const ranges: { from: number; to: number }[] = []
  editor.state.doc.forEach((node, offset) => {
    if (node.attrs.id && ids.includes(node.attrs.id)) {
      ranges.push({ from: offset, to: offset + node.nodeSize })
    }
  })
  if (ranges.length === 0) {
    return false
  }
  const tr = editor.state.tr
  for (let i = ranges.length - 1; i >= 0; i--) {
    tr.delete(ranges[i].from, ranges[i].to)
  }
  editor.view.dispatch(tr)
  return true
}

/** Read a block (and its subtree) by id as canonical JSON. */
export function getBlockJson(editor: Editor, id: string): JSONContent | null {
  const pos = findBlockPosById(editor, id)
  if (pos === null) {
    return null
  }
  const node = editor.state.doc.nodeAt(pos)
  return node ? node.toJSON() : null
}
