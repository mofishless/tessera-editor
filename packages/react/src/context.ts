import { createContext, useContext } from 'react'
import type { Editor } from '@tiptap/react'
import type { TesseraLocale, TesseraTranslator } from '@tessera-editor/core'
import type { AiController } from '@tessera-editor/ai'

export interface TesseraContextValue {
  editor: Editor
  locale: TesseraLocale
  t: TesseraTranslator
  ai: AiController | null
}

export const TesseraContext = createContext<TesseraContextValue | null>(null)

export function useTesseraContext(): TesseraContextValue {
  const ctx = useContext(TesseraContext)
  if (!ctx) {
    throw new Error('Tessera: useTesseraContext outside provider')
  }
  return ctx
}
