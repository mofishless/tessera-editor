import { useContext, useEffect, useRef, useState } from 'react'
import { findReplaceKey } from '@tessera-editor/core'
import type { FindReplaceState } from '@tessera-editor/core'
import type { SuggestionSession } from '@tessera-editor/ai'
import { TesseraContext } from './context'

/** ⌘F find & replace panel — drives the core findReplace commands. */
export function FindReplacePanel() {
  const { editor, t } = useContext(TesseraContext)!
  const [visible, setVisible] = useState(false)
  const [query, setQuery] = useState('')
  const [replacement, setReplacement] = useState('')
  const [count, setCount] = useState(0)
  const [active, setActive] = useState(0)
  const queryRef = useRef(query)
  queryRef.current = query

  useEffect(() => {
    const open = () => {
      setVisible(true)
      requestAnimationFrame(() => {
        const input = document.querySelector<HTMLInputElement>('.tessera-find-input')
        input?.focus()
      })
    }
    editor.on('tessera:findPanel', open)

    const sync = () => {
      const s = findReplaceKey.getState(editor.state) as FindReplaceState | undefined
      if (!s) {
        return
      }
      setVisible(s.visible)
      setCount(s.matches.length)
      setActive(s.active)
      if (s.query !== queryRef.current && !s.visible) {
        setQuery(s.query)
      }
    }
    editor.on('transaction', sync)
    return () => {
      editor.off('tessera:findPanel', open)
      editor.off('transaction', sync)
    }
  }, [editor])

  if (!visible) {
    return null
  }

  const updateQuery = (value: string) => {
    setQuery(value)
    editor.commands.setFindQuery(value)
  }

  return (
    <div className="tessera-find-panel" data-testid="find-panel">
      <input
        className="tessera-find-input"
        autoFocus
        value={query}
        placeholder={t('findPlaceholder')}
        onChange={e => updateQuery(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') {
            editor.commands.findNext()
          }
          if (e.key === 'Escape') {
            editor.commands.closeFindPanel()
          }
        }}
      />
      <span className="tessera-find-count">{count > 0 ? `${active + 1}/${count}` : '0'}</span>
      <button type="button" title={t('findPrev')} onClick={() => editor.commands.findPrev()}>
        ↑
      </button>
      <button type="button" title={t('findNext')} onClick={() => editor.commands.findNext()}>
        ↓
      </button>
      <input
        value={replacement}
        placeholder={t('replacePlaceholder')}
        onChange={e => setReplacement(e.target.value)}
      />
      <button type="button" onClick={() => editor.commands.replaceCurrent(replacement)}>
        {t('replaceOne')}
      </button>
      <button type="button" onClick={() => editor.commands.replaceAll(replacement)}>
        {t('replaceAll')}
      </button>
      <button type="button" className="tessera-find-close" title={t('findClose')} onClick={() => editor.commands.closeFindPanel()}>
        ×
      </button>
    </div>
  )
}

/** AI 问答面板（/ask 唤起）：流式回答，不写文档。 */
export function AskPanel() {
  const { editor, t, ai } = useContext(TesseraContext)!
  const [visible, setVisible] = useState(false)
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [thinking, setThinking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const open = () => setVisible(true)
    editor.on('tessera:askPanel', open)
    return () => {
      editor.off('tessera:askPanel', open)
    }
  }, [editor])

  if (!visible) {
    return null
  }

  const ask = async () => {
    if (!ai || !question.trim()) {
      return
    }
    setThinking(true)
    setAnswer('')
    setError(null)
    try {
      await ai.ask(question, { onToken: token => setAnswer(prev => prev + token) })
    } catch (err) {
      setError(String(err))
    } finally {
      setThinking(false)
    }
  }

  return (
    <div className="tessera-ask-panel" data-testid="ask-panel">
      <div className="tessera-ask-header">
        <span>{t('aiTitle')}</span>
        <button type="button" onClick={() => setVisible(false)}>
          ×
        </button>
      </div>
      {ai ? null : <div className="tessera-ask-error">{t('aiRuntimeMissing')}</div>}
      <div className="tessera-ask-body">
        {answer ? <div className="tessera-ask-answer">{answer}</div> : null}
        {thinking ? <div className="tessera-ask-thinking">{t('aiThinking')}</div> : null}
        {error ? <div className="tessera-ask-error">{error}</div> : null}
      </div>
      <div className="tessera-ask-input">
        <input
          value={question}
          placeholder={t('aiAskPlaceholder')}
          onChange={e => setQuestion(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              ask()
            }
          }}
        />
        <button type="button" disabled={!ai || thinking || !question.trim()} onClick={ask}>
          {t('aiSend')}
        </button>
      </div>
    </div>
  )
}

/** "Agent 起草、人批准"：pending 建议存在时显示审阅条。 */
export function SuggestionBar({
  session,
  onClear,
}: {
  session: SuggestionSession | null
  onClear: () => void
}) {
  const { t } = useContext(TesseraContext)!
  if (!session) {
    return null
  }
  return (
    <div className="tessera-suggestion-bar" data-testid="suggestion-bar">
      <span className="tessera-suggestion-label">✨ {t('aiStreaming')}</span>
      <button
        type="button"
        className="tessera-suggestion-accept"
        onClick={() => {
          session.accept()
          onClear()
        }}
      >
        {t('aiAccept')}
      </button>
      <button
        type="button"
        className="tessera-suggestion-reject"
        onClick={() => {
          session.reject()
          onClear()
        }}
      >
        {t('aiReject')}
      </button>
    </div>
  )
}
