import { inject, provide } from 'vue'
import type { VNode } from 'vue'
import type { Editor } from '@tiptap/vue-3'
import type { TesseraLocale, TesseraTranslator } from '@tessera-editor/core'
import type { AiController } from '@tessera-editor/ai'

export interface TesseraContextValue {
  editor: Editor
  locale: TesseraLocale
  t: TesseraTranslator
  ai: AiController | null
  /**
   * Host buttons appended to the selection toolbar (e.g. custom AI actions).
   * A render function receives the live editor + translator, so a host button
   * like 「让 AI 改写此段」 can read the current selection on click.
   */
  extraSelectionItems?: VNode | ((ctx: { editor: Editor; t: TesseraTranslator }) => VNode)
}

export const TesseraContextKey = Symbol('tessera-context') as InjectionKey<TesseraContextValue>
type InjectionKey<T> = symbol & { __type?: T }

export function provideTessera(context: TesseraContextValue) {
  provide(TesseraContextKey, context)
}

export function useTesseraContext(): TesseraContextValue {
  const ctx = inject<TesseraContextValue | null>(TesseraContextKey, null)
  if (!ctx) {
    throw new Error('Tessera: useTesseraContext outside provider')
  }
  return ctx
}
