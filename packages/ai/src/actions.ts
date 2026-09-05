import type { Editor, JSONContent } from '@tiptap/core'
import type { AIRuntime } from './runtime'

/**
 * AI actions: the interaction skeleton around an AIRuntime. All writes carry
 * pending aiAttribution marks — "Agent drafts, human approves" (Slite-style
 * triage) — with explicit accept / reject sessions.
 */

export interface SuggestionSession {
  /** apply: flip pending marks to accepted (content keeps its attribution) */
  accept: () => void
  /** roll back to the pre-AI content */
  reject: () => void
}

const AI_MARK = 'aiAttribution'

function pendingMark(editor: Editor, action: string, extra: Record<string, unknown> = {}) {
  return editor.schema.marks[AI_MARK]!.create({
    pending: true,
    action,
    ts: Date.now(),
    ...extra,
  })
}

function textBlocksFrom(editor: Editor, text: string, action: string): JSONContent[] {
  return text
    .split(/\n{2,}/)
    .map(par => par.trim())
    .filter(Boolean)
    .map(par => ({
      type: 'paragraph',
      content: [{ type: 'text', text: par, marks: [{ type: AI_MARK, attrs: { pending: true, action, ts: Date.now() } }] }],
    }))
}

function topBlocksAroundSelection(editor: Editor): JSONContent[] {
  const { $from, $to } = editor.state.selection
  const from = $from.before(1)
  const to = $to.after(1)
  const cut = editor.state.doc.cut(from, to)
  return cut.content.toJSON?.() ?? (cut.toJSON().content as JSONContent[])
}

function findPendingBlockRanges(editor: Editor): { from: number; to: number }[] {
  const ranges: { from: number; to: number }[] = []
  editor.state.doc.forEach((node, offset) => {
    let has = false
    node.descendants(child => {
      if (child.marks.some(m => m.type.name === AI_MARK && m.attrs.pending)) {
        has = true
      }
      return true
    })
    if (has) {
      ranges.push({ from: offset, to: offset + node.nodeSize })
    }
  })
  return ranges
}

function makeSession(editor: Editor, originalBlocks: JSONContent[]): SuggestionSession {
  return {
    accept() {
      const tr = editor.state.tr
      const markType = editor.schema.marks[AI_MARK]!
      editor.state.doc.descendants((node, pos) => {
        node.marks
          .filter(m => m.type.name === AI_MARK && m.attrs.pending)
          .forEach(m => {
            const accepted = markType.create({ ...m.attrs, pending: false })
            tr.removeMark(pos, pos + node.nodeSize, m)
            tr.addMark(pos, pos + node.nodeSize, accepted)
          })
        return true
      })
      if (tr.steps.length > 0) {
        editor.view.dispatch(tr)
      }
    },
    reject() {
      const ranges = findPendingBlockRanges(editor)
      if (ranges.length === 0) {
        return
      }
      const insertAt = ranges[0]!.from
      const tr = editor.state.tr
      for (let i = ranges.length - 1; i >= 0; i--) {
        tr.delete(ranges[i]!.from, ranges[i]!.to)
      }
      if (originalBlocks.length > 0) {
        tr.insert(
          insertAt,
          originalBlocks.map(json => editor.state.schema.nodeFromJSON(json)),
        )
      }
      editor.view.dispatch(tr)
    },
  }
}

function stripFences(text: string): string {
  return text.replace(/^```[a-zA-Z]*\n?/, '').replace(/\n?```$/, '').trim()
}

/**
 * Improve the current selection (Slite's划词 Improve). Single-textblock
 * selections stream token-by-token; multi-block selections apply once at the
 * end. Returns an accept/reject session.
 */
export async function improveSelection(
  editor: Editor,
  runtime: AIRuntime,
  options: { instruction?: string } = {},
): Promise<SuggestionSession | null> {
  const { from, to, empty, $from, $to } = editor.state.selection
  if (empty || !$from.sameParent($to)) {
    return null
  }
  const original = editor.state.doc.textBetween(from, to, '\n')
  const originalBlocks = topBlocksAroundSelection(editor)

  const messages = [
    {
      role: 'system' as const,
      content:
        'You are a writing assistant embedded in a rich text editor. Rewrite the user text per the instruction. Reply with the rewritten text ONLY — no preamble, no quotes, no markdown fences, keep the original language.',
    },
    {
      role: 'user' as const,
      content: `Instruction: ${options.instruction || 'Improve clarity, grammar and flow while keeping the meaning.'}\n\nText:\n${original}`,
    },
  ]

  let prevEnd = to
  let received = ''
  const applyStream = (full: string) => {
    const text = stripFences(full)
    if (!text) {
      return
    }
    const tr = editor.state.tr
    tr.replaceWith(from, prevEnd, editor.state.schema.text(text, [pendingMark(editor, 'improve')]))
    prevEnd = from + text.length
    editor.view.dispatch(tr)
  }

  const full = await runtime.chat({
    messages,
    stream: {
      onToken: token => {
        received += token
        applyStream(received)
      },
    },
  })
  // non-streaming runtimes deliver everything via the resolved value
  if (!received) {
    applyStream(full)
  }
  return makeSession(editor, originalBlocks)
}

/** Generate a TL;DR as a pending hint block at the top of the document. */
export async function summarizeDoc(
  editor: Editor,
  runtime: AIRuntime,
  options: { locale?: 'zh-CN' | 'en-US' } = {},
): Promise<SuggestionSession | null> {
  const body = editor.state.doc.textBetween(0, editor.state.doc.content.size, '\n')
  if (!body.trim()) {
    return null
  }
  const lang = options.locale === 'en-US' ? 'English' : '中文'
  const answer = stripFences(
    await runtime.chat({
      messages: [
        {
          role: 'system',
          content: `Summarize the document in ${lang} as a TL;DR of at most 5 sentences. Reply with the summary text only.`,
        },
        { role: 'user', content: body.slice(0, 60_000) },
      ],
    }),
  )
  if (!answer) {
    return null
  }
  const content: JSONContent = {
    type: 'hint',
    attrs: { variant: 'info' },
    content: [
      {
        type: 'paragraph',
        content: [
          { type: 'text', text: 'TL;DR · ' },
          {
            type: 'text',
            text: answer,
            marks: [{ type: AI_MARK, attrs: { pending: true, action: 'summarize', ts: Date.now() } }],
          },
        ],
      },
    ],
  }
  const tr = editor.state.tr.insert(0, editor.state.schema.nodeFromJSON(content))
  editor.view.dispatch(tr)
  return makeSession(editor, [])
}

/** Ask questions about the document — pure chat, no document writes. */
export async function askDoc(
  editor: Editor,
  runtime: AIRuntime,
  question: string,
  handlers: { onToken?: (token: string) => void; signal?: AbortSignal } = {},
): Promise<string> {
  const body = editor.state.doc.textBetween(0, editor.state.doc.content.size, '\n')
  return runtime.chat({
    messages: [
      {
        role: 'system',
        content:
          'Answer questions strictly based on the provided document. Reply in the language of the question. If the document does not contain the answer, say so.',
      },
      { role: 'user', content: `Document:\n${body.slice(0, 60_000)}\n\nQuestion: ${question}` },
    ],
    stream: handlers,
  })
}

export { textBlocksFrom }
