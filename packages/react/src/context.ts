import { createContext, useContext } from 'react'
import type { ReactNode } from 'react'
import type { Editor } from '@tiptap/react'
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
  extraSelectionItems?: ReactNode | ((ctx: { editor: Editor; t: TesseraTranslator }) => ReactNode)
}

export const TesseraContext = createContext<TesseraContextValue | null>(null)

export function useTesseraContext(): TesseraContextValue {
  const ctx = useContext(TesseraContext)
  if (!ctx) {
    throw new Error('Tessera: useTesseraContext outside provider')
  }
  return ctx
}
