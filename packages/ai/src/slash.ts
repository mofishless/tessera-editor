import type { SlashMenuItem } from '@tessera-editor/core'
import type { Editor } from '@tiptap/core'
import type { TesseraTranslator } from '@tessera-editor/core'
import { improveSelection, summarizeDoc, askDoc } from './actions'
import type { SuggestionSession } from './actions'
import type { AIRuntime } from './runtime'

/**
 * AI slash items for the slash menu. The binding passes this factory via
 * SlashMenu extraItems when an AIRuntime is injected (ADR-0001: the AI layer
 * never renders UI itself; it only emits editor events for panels).
 */

export interface AiSlashContext {
  editor: Editor
  runtime: AIRuntime
  t: TesseraTranslator
}

export interface AiController {
  runtime: AIRuntime
  improve: (options?: { instruction?: string }) => Promise<SuggestionSession | null>
  summarize: () => Promise<SuggestionSession | null>
  ask: (question: string, handlers?: { onToken?: (t: string) => void }) => Promise<string>
}

export function createAiController(editor: Editor, runtime: AIRuntime, locale: 'zh-CN' | 'en-US' = 'zh-CN'): AiController {
  return {
    runtime,
    improve: options => improveSelection(editor, runtime, options),
    summarize: () => summarizeDoc(editor, runtime, { locale }),
    ask: (question, handlers) => askDoc(editor, runtime, question, handlers),
  }
}

export function aiSlashItems({ editor, runtime, t }: AiSlashContext): SlashMenuItem[] {
  return [
    {
      id: 'ai-summarize',
      group: 'ai',
      title: t('itemSummarize'),
      description: t('itemSummarizeDesc'),
      keywords: ['ai', 'summarize', 'tldr', '摘要'],
      command: async ({ editor: e, range }) => {
        e.chain().focus().deleteRange(range).run()
        const session = await summarizeDoc(e, runtime)
        editor.emit('tessera:session', { session })
      },
    },
    {
      id: 'ai-ask',
      group: 'ai',
      title: t('itemAsk'),
      description: t('itemAskDesc'),
      keywords: ['ai', 'ask', 'question', '问答'],
      command: ({ editor: e, range }) => {
        e.chain().focus().deleteRange(range).run()
        editor.emit('tessera:askPanel', {})
      },
    },
    {
      id: 'ai-improve',
      group: 'ai',
      title: t('itemImprove'),
      description: t('itemImproveDesc'),
      keywords: ['ai', 'improve', 'rewrite', '改写'],
      command: ({ editor: e, range }) => {
        e.chain().focus().deleteRange(range).run()
        editor.emit('tessera:improvePanel', {})
      },
    },
  ]
}

declare module '@tiptap/core' {
  interface EditorEvents {
    'tessera:askPanel': Record<string, never>
    'tessera:improvePanel': Record<string, never>
    'tessera:session': { session: import('./actions').SuggestionSession | null }
  }
}
