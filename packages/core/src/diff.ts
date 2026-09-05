import type { JSONContent } from '@tiptap/core'

/**
 * Document diff (v1.1 history panel): block-level via stable ids (LCS on the
 * id sequence) + word-level inside changed text blocks. Pure utility — the
 * panel renders it.
 */

export interface WordDiffPart {
  text: string
  type: 'same' | 'add' | 'del'
}

export interface BlockDiffEntry {
  kind: 'added' | 'removed' | 'changed' | 'unchanged'
  id?: string
  before?: JSONContent
  after?: JSONContent
  wordDiff?: WordDiffPart[]
}

function topLevel(doc: JSONContent): JSONContent[] {
  return doc.content ?? []
}

function blockId(block: JSONContent): string | null {
  const id = block.attrs?.id
  return typeof id === 'string' ? id : null
}

function collectText(node: JSONContent): string {
  let text = ''
  if (node.text) {
    text += node.text
  }
  for (const child of node.content ?? []) {
    text += collectText(child)
  }
  return text
}

function tokenize(text: string): string[] {
  return text.match(/[\u4e00-\u9fa5]|[a-zA-Z0-9]+|\s+|[^\sa-zA-Z0-9\u4e00-\u9fa5]/g) ?? []
}

/** Classic LCS word diff with a size guard. */
export function wordDiff(beforeText: string, afterText: string): WordDiffPart[] {
  const a = tokenize(beforeText)
  const b = tokenize(afterText)
  if (a.length * b.length > 4_000_000) {
    return [
      { text: beforeText, type: 'del' },
      { text: afterText, type: 'add' },
    ]
  }
  // dp[i][j] = LCS length of a[i:], b[j:]
  const dp: Uint32Array[] = Array.from({ length: a.length + 1 }, () => new Uint32Array(b.length + 1))
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      dp[i]![j] = a[i] === b[j] ? dp[i + 1]![j + 1]! + 1 : Math.max(dp[i + 1]![j]!, dp[i]![j + 1]!)
    }
  }
  const parts: WordDiffPart[] = []
  const push = (text: string, type: WordDiffPart['type']) => {
    const last = parts[parts.length - 1]
    if (last && last.type === type) {
      last.text += text
    } else {
      parts.push({ text, type })
    }
  }
  let i = 0
  let j = 0
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      push(a[i]!, 'same')
      i++
      j++
    } else if (dp[i + 1]![j]! >= dp[i]![j + 1]!) {
      push(a[i]!, 'del')
      i++
    } else {
      push(b[j]!, 'add')
      j++
    }
  }
  while (i < a.length) {
    push(a[i++]!, 'del')
  }
  while (j < b.length) {
    push(b[j++]!, 'add')
  }
  return parts
}

function sameBlock(a: JSONContent, b: JSONContent): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}

export function diffDocs(before: JSONContent, after: JSONContent): BlockDiffEntry[] {
  const beforeBlocks = topLevel(before)
  const afterBlocks = topLevel(after)
  const afterById = new Map<string, JSONContent>()
  for (const block of afterBlocks) {
    const id = blockId(block)
    if (id) {
      afterById.set(id, block)
    }
  }
  const seen = new Set<string>()
  const entries: BlockDiffEntry[] = []

  for (const block of beforeBlocks) {
    const id = blockId(block)
    if (id && afterById.has(id)) {
      seen.add(id)
      const next = afterById.get(id)!
      if (sameBlock(block, next)) {
        entries.push({ kind: 'unchanged', id, before: block, after: next })
      } else {
        entries.push({ kind: 'changed', id, before: block, after: next, wordDiff: wordDiff(collectText(block), collectText(next)) })
      }
    } else {
      entries.push({ kind: 'removed', id: id ?? undefined, before: block })
    }
  }
  for (const block of afterBlocks) {
    const id = blockId(block)
    if (id && seen.has(id)) {
      continue
    }
    if (!id || !beforeBlocks.some(b => blockId(b) === id)) {
      entries.push({ kind: 'added', id: id ?? undefined, after: block })
    }
  }
  return entries
}

/** Compact summary for the panel header. */
export function diffSummary(entries: BlockDiffEntry[]): { added: number; removed: number; changed: number } {
  let added = 0
  let removed = 0
  let changed = 0
  for (const entry of entries) {
    if (entry.kind === 'added') added++
    else if (entry.kind === 'removed') removed++
    else if (entry.kind === 'changed') changed++
  }
  return { added, removed, changed }
}
