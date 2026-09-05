import { useContext, useEffect, useState } from 'react'
import {
  diffDocs,
  diffSummary,
  getStorageService,
} from '@tessera-editor/core'
import type { DocSnapshot, BlockDiffEntry } from '@tessera-editor/core'
import { TesseraContext } from './context'

/**
 * Version history panel (v1.1): snapshots from the injected StorageService,
 * block+word level diff against the current doc, one-click restore.
 */
export function HistoryPanel() {
  const { editor, t } = useContext(TesseraContext)!
  const [visible, setVisible] = useState(false)
  const [snapshots, setSnapshots] = useState<DocSnapshot[]>([])
  const [selected, setSelected] = useState<DocSnapshot | null>(null)
  const [entries, setEntries] = useState<BlockDiffEntry[] | null>(null)
  const [summary, setSummary] = useState({ added: 0, removed: 0, changed: 0 })

  const refresh = async () => {
    const storage = getStorageService(editor)
    if (!storage) {
      return
    }
    const list = await storage.listSnapshots()
    setSnapshots([...list].sort((a, b) => b.ts - a.ts))
  }

  useEffect(() => {
    const open = () => {
      setVisible(true)
      void refresh()
    }
    editor.on('tessera:historyPanel', open)
    const saved = () => void refresh()
    editor.on('tessera:snapshotSaved', saved as never)
    return () => {
      editor.off('tessera:historyPanel', open)
      editor.off('tessera:snapshotSaved', saved as never)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor])

  if (!visible) {
    return null
  }

  const hasStorage = !!getStorageService(editor)

  const select = (snap: DocSnapshot) => {
    setSelected(snap)
    const result = diffDocs(snap.doc as never, editor.getJSON() as never)
    setEntries(result)
    setSummary(diffSummary(result.filter(e => e.kind !== 'unchanged')))
  }

  const restore = (snap: DocSnapshot) => {
    if (!window.confirm(t('historyConfirmRestore'))) {
      return
    }
    editor.commands.setContent(snap.doc as never)
    setVisible(false)
  }

  return (
    <div className="tessera-history-panel" data-testid="history-panel">
      <div className="tessera-ask-header">
        <span>{t('historyTitle')}</span>
        <div className="tessera-history-actions">
          {hasStorage ? (
            <button type="button" onClick={() => editor.commands.captureSnapshot()}>
              {t('historyCapture')}
            </button>
          ) : null}
          <button type="button" onClick={() => setVisible(false)}>
            ×
          </button>
        </div>
      </div>
      {!hasStorage ? (
        <div className="tessera-ask-error">{t('aiRuntimeMissing').replace('AI Runtime', 'StorageService')}</div>
      ) : null}
      <div className="tessera-history-body">
        <div className="tessera-history-list">
          {snapshots.length === 0 ? <div className="tessera-toc-empty">{t('historyEmpty')}</div> : null}
          {snapshots.map(snap => (
            <button
              key={snap.id}
              type="button"
              className="tessera-history-item"
              data-selected={selected?.id === snap.id}
              onClick={() => select(snap)}
            >
              <span className="tessera-history-time">{formatTime(snap.ts)}</span>
              {snap.label ? <span className="tessera-history-label">{snap.label}</span> : null}
              <span className="tessera-history-action" role="button" tabIndex={0}
                onClick={e => {
                  e.stopPropagation()
                  restore(snap)
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter') restore(snap)
                }}
              >
                {t('historyRestore')}
              </span>
            </button>
          ))}
        </div>
        {selected ? (
          <div className="tessera-history-diff">
            <div className="tessera-diff-summary">
              +{summary.added} {t('historyDiffAdded')} · −{summary.removed} {t('historyDiffRemoved')} · ~{summary.changed}{' '}
              {t('historyDiffChanged')}
            </div>
            {(entries ?? [])
              .filter(e => e.kind !== 'unchanged')
              .slice(0, 80)
              .map((entry, i) => (
                <div key={entry.id ?? i} className={`tessera-diff-block tessera-diff-block--${entry.kind}`}>
                  <span className="tessera-diff-badge">
                    {entry.kind === 'added'
                      ? t('historyDiffAdded')
                      : entry.kind === 'removed'
                        ? t('historyDiffRemoved')
                        : t('historyDiffChanged')}
                  </span>
                  {entry.kind === 'changed' && entry.wordDiff ? (
                    <span className="tessera-diff-text">
                      {entry.wordDiff.map((part, j) => (
                        <span key={j} className={`tessera-diff-part tessera-diff-part--${part.type}`}>
                          {part.text}
                        </span>
                      ))}
                    </span>
                  ) : (
                    <span className="tessera-diff-text">{blockText(entry)}</span>
                  )}
                </div>
              ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}

function blockText(entry: BlockDiffEntry): string {
  const json = entry.after ?? entry.before
  const walk = (node: unknown): string => {
    if (!node || typeof node !== 'object') {
      return ''
    }
    const n = node as { text?: string; content?: unknown[] }
    return (n.text ?? '') + (n.content ?? []).map(walk).join('')
  }
  return walk(json).trim().slice(0, 120)
}

function formatTime(ts: number): string {
  const d = new Date(ts)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}
