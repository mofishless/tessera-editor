import { useContext, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { getCommentStore, getIdentityService, listCommentRanges } from '@tessera-editor/core'
import type { CommentThread } from '@tessera-editor/core'
import { TesseraContext } from './context'

/**
 * Inline comments (v1.1): comment composer on selection (⌘⌥M or the 💬
 * toolbar button), side panel with threads in document order, resolve /
 * delete, ↑/↓ thread navigation. Data flows through the injected
 * CommentStore + IdentityService.
 */

interface ThreadView extends CommentThread {
  from: number
}

function uid(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

export function CommentPanel() {
  const { editor, t } = useContext(TesseraContext)!
  const [visible, setVisible] = useState(false)
  const [threads, setThreads] = useState<ThreadView[]>([])

  const refresh = async () => {
    const store = getCommentStore(editor)
    if (!store) {
      return
    }
    const all = await store.list()
    const ranges = listCommentRanges(editor.state)
    const views: ThreadView[] = []
    for (const range of ranges) {
      const thread = all.find(tr => tr.id === range.threadId)
      if (thread) {
        views.push({ ...thread, from: range.from })
      }
    }
    views.sort((a, b) => a.from - b.from)
    setThreads(views)
  }

  useEffect(() => {
    const open = () => {
      setVisible(true)
      void refresh()
    }
    editor.on('tessera:commentPanel', open)
    editor.on('transaction', refresh)
    return () => {
      editor.off('tessera:commentPanel', open)
      editor.off('transaction', refresh)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor])

  if (!visible) {
    return null
  }

  const store = getCommentStore(editor)
  const identity = getIdentityService(editor)
  const me = identity?.getCurrentUser() ?? { id: 'anonymous', name: 'Anonymous' }

  const toggleResolve = async (thread: ThreadView) => {
    if (!store) {
      return
    }
    const next = { ...thread, resolved: !thread.resolved }
    delete (next as Partial<ThreadView>).from
    await store.upsert(next as CommentThread)
    editor.commands.setCommentResolved(thread.id, next.resolved)
    await refresh()
  }

  const removeThread = async (thread: ThreadView) => {
    if (!store) {
      return
    }
    await store.remove(thread.id)
    editor.commands.removeCommentThread(thread.id)
    await refresh()
  }

  return (
    <div className="tessera-comment-panel" data-testid="comment-panel">
      <div className="tessera-ask-header">
        <span>
          {t('commentTitle')} · {threads.filter(x => !x.resolved).length}
        </span>
        <div className="tessera-history-actions">
          <button type="button" title="↑" onClick={() => editor.commands.focusNextCommentThread()}>
            ↑
          </button>
          <button type="button" title="↓" onClick={() => editor.commands.focusNextCommentThread()}>
            ↓
          </button>
          <button type="button" onClick={() => setVisible(false)}>
            ×
          </button>
        </div>
      </div>
      {!store ? <div className="tessera-ask-error">CommentStore not injected</div> : null}
      <div className="tessera-ask-body">
        {threads.length === 0 ? <div className="tessera-toc-empty">{t('commentEmpty')}</div> : null}
        {threads.map(thread => (
          <div key={thread.id} className={`tessera-thread${thread.resolved ? ' tessera-thread--resolved' : ''}`}>
            <div className="tessera-thread-quote">“{thread.quote}”</div>
            {thread.entries.map(entry => (
              <div key={entry.id} className="tessera-thread-entry">
                <span className="tessera-thread-author">{entry.authorName}</span>
                <span className="tessera-thread-text">{entry.text}</span>
              </div>
            ))}
            <div className="tessera-thread-actions">
              <button type="button" onClick={() => void toggleResolve(thread)}>
                {thread.resolved ? t('commentReopen') : t('commentResolve')}
              </button>
              <button type="button" className="tessera-danger" onClick={() => void removeThread(thread)}>
                {t('commentDelete')}
              </button>
              {thread.resolved ? <span className="tessera-thread-badge">{t('commentResolvedBadge')}</span> : null}
            </div>
          </div>
        ))}
      </div>
      <div className="tessera-comment-hint">⌘⌥M / 💬 · {me.name}</div>
    </div>
  )
}

/** Selection-toolbar composer popover: quote + comment → thread + mark. */
export function CommentComposer({ onClose }: { onClose: () => void }) {
  const { editor, t } = useContext(TesseraContext)!
  const [text, setText] = useState('')
  const quote = editor.state.doc.textBetween(editor.state.selection.from, editor.state.selection.to, ' ')

  const submit = async () => {
    if (!text.trim()) {
      return
    }
    const store = getCommentStore(editor)
    if (!store) {
      return
    }
    const identity = getIdentityService(editor)
    const me = identity?.getCurrentUser() ?? { id: 'anonymous', name: 'Anonymous' }
    const thread: CommentThread = {
      id: uid('thread'),
      quote,
      resolved: false,
      createdAt: Date.now(),
      entries: [{ id: uid('c'), authorId: me.id, authorName: me.name, text: text.trim(), ts: Date.now() }],
    }
    await store.upsert(thread)
    editor.commands.addCommentThread(thread.id)
    onClose()
    editor.emit('tessera:commentPanel', {})
  }

  return createPortal(
    <div className="tessera-popover tessera-comment-composer" data-testid="comment-composer">
      <div className="tessera-thread-quote">“{quote.slice(0, 60)}{quote.length > 60 ? '…' : ''}”</div>
      <textarea
        autoFocus
        value={text}
        placeholder={t('commentPlaceholder')}
        onChange={e => setText(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            void submit()
          }
        }}
      />
      <div className="tessera-comment-composer-actions">
        <button type="button" disabled={!text.trim()} onClick={() => void submit()}>
          {t('commentSend')}
        </button>
      </div>
    </div>,
    document.body,
  )
}
