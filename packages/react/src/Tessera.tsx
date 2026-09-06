import { useEffect, useMemo, useRef, useState } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import type { Editor } from '@tiptap/react'
import type { Content } from '@tiptap/core'
import { DragHandle } from '@tiptap/extension-drag-handle-react'
import {
  createTesseraExtensions,
  createTesseraT,
} from '@tessera-editor/core'
import type {
  TesseraLocale,
  UploadService,
  StorageService,
  CommentStore,
  IdentityService,
} from '@tessera-editor/core'
import { createAiController, aiSlashItems } from '@tessera-editor/ai'
import type { AIRuntime, SuggestionSession } from '@tessera-editor/ai'
import { ImageBlockView } from './ImageNodeView'
import { AiTableCellViewExtension, AiTableHeaderViewExtension } from './TableNodeViews'
import { EmbedBlockView, TocBlockView } from './EmbedTocViews'
import { createSlashRenderer } from './SlashMenu'
import { EmptyLineToolbar } from './EmptyLineToolbar'
import { SelectionToolbar } from './SelectionToolbar'
import { FindReplacePanel, AskPanel, SuggestionBar } from './Panels'
import { HistoryPanel } from './HistoryPanel'
import { CommentPanel } from './CommentPanel'
import { BlockContextMenuUI } from './BlockMenu'
import { TesseraContext } from './context'
import '@tessera-editor/core/styles.css'

export interface TesseraProps {
  /** Initial document (JSON / HTML / markdown string). Host owns persistence. */
  content?: Content
  locale?: TesseraLocale
  /** Injected image upload capability (ADR-0001 family). */
  upload?: UploadService
  /** v1.1: version-history snapshot storage. */
  storage?: StorageService
  /** v1.1: inline comment persistence. */
  comments?: CommentStore
  /** v1.1: current user (comment authorship). */
  identity?: IdentityService
  /** Injected model runtime; presence enables all AI surfaces. */
  ai?: AIRuntime
  /** v1.1: idle window for history auto-capture (playground uses short ones) */
  historyIdleMs?: number
  onUpdate?: (editor: Editor) => void
  onCreate?: (editor: Editor) => void
}

/**
 * Batteries-included editor (M1+M2 scope). Slite-style: empty-line toolbar,
 * slash menu, selection toolbar, drag handle — deliberately NOT Notion's
 * floating "+".
 */
export function Tessera({
  content,
  locale = 'zh-CN',
  upload,
  storage,
  comments,
  identity,
  ai: runtime,
  historyIdleMs,
  onUpdate,
  onCreate,
}: TesseraProps) {
  const t = useMemo(() => createTesseraT(locale), [locale])
  const [session, setSession] = useState<SuggestionSession | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const extensions = useMemo(
    () =>
      createTesseraExtensions({ locale, historyIdleMs }).map(ext => {
        if (ext.name === 'tesseraSlashMenu') {
          return ext.configure({
            render: createSlashRenderer(t),
            extraItems: runtime
              ? (ctx: Parameters<NonNullable<import('@tessera-editor/core').SlashMenuOptions['extraItems']>>[0]) =>
                  aiSlashItems({ editor: ctx.editor, runtime, t: ctx.t })
              : undefined,
          })
        }
        if (ext.name === 'imageBlock') {
          return ImageBlockView
        }
        if (ext.name === 'tableCell') {
          return AiTableCellViewExtension
        }
        if (ext.name === 'tableHeader') {
          return AiTableHeaderViewExtension
        }
        if (ext.name === 'embedBlock') {
          return EmbedBlockView
        }
        if (ext.name === 'tocBlock') {
          return TocBlockView
        }
        return ext
      }),
    [locale, t, runtime, historyIdleMs],
  )

  const editor = useEditor({
    extensions,
    content,
    onUpdate: ({ editor: e }) => onUpdate?.(e),
    onCreate: ({ editor: e }) => onCreate?.(e),
    editorProps: {
      attributes: {
        class: 'tessera-doc',
        spellcheck: 'false',
      },
      handlePaste: (_view, event) => {
        const file = Array.from(event.clipboardData?.files ?? []).find(f => f.type.startsWith('image/'))
        if (file) {
          void uploadAndInsert(file)
          return true
        }
        return false
      },
      handleDrop: (_view, event, _slice, moved) => {
        if (moved) {
          return false
        }
        const file = Array.from(event.dataTransfer?.files ?? []).find(f => f.type.startsWith('image/'))
        if (file) {
          event.preventDefault()
          void uploadAndInsert(file)
          return true
        }
        return false
      },
    },
  })

  async function uploadAndInsert(file: File) {
    if (!editor) {
      return
    }
    const storage = editor.storage as unknown as Record<string, { upload?: UploadService }>
    const svc = storage.tesseraServices?.upload
    if (!svc) {
      return
    }
    try {
      const asset = await svc.uploadImage(file)
      editor.chain().focus().setImage({ src: asset.url, alt: asset.name }).run()
    } catch (err) {
      console.error('[Tessera] image upload failed:', err)
    }
  }

  // injected services stay current
  useEffect(() => {
    if (editor) {
      const bag = (editor.storage as unknown as Record<string, Record<string, unknown>>).tesseraServices ?? {}
      ;(editor.storage as unknown as Record<string, Record<string, unknown>>).tesseraServices = {
        ...bag,
        upload,
        storage,
        comments,
        identity,
      }
    }
  }, [editor, upload, storage, comments, identity])

  // editor events → UI (image picker, sessions from slash AI items)
  useEffect(() => {
    if (!editor) {
      return
    }
    const pickImage = () => fileInputRef.current?.click()
    const onSession = (payload: { session: SuggestionSession | null }) => setSession(payload.session)
    editor.on('tessera:insertImage', pickImage)
    editor.on('tessera:session', onSession as never)
    return () => {
      editor.off('tessera:insertImage', pickImage)
      editor.off('tessera:session', onSession as never)
    }
  }, [editor])

  const ai = useMemo(
    () => (editor && runtime ? createAiController(editor, runtime, locale) : null),
    [editor, runtime, locale],
  )

  if (!editor) {
    return null
  }

  return (
    <TesseraContext.Provider value={{ editor, locale, t, ai }}>
      <div className="tessera-root">
        <EditorContent editor={editor} />
        {/* 'left' (vertical center) instead of the default 'left-start': the
            handle must sit mid-row like Slite, not above multi-line blocks */}
        <DragHandle
          editor={editor}
          pluginKey="tesseraDragHandle"
          computePositionConfig={{ placement: 'left', strategy: 'absolute' }}
        >
          <div className="tessera-drag-handle">⠿</div>
        </DragHandle>
        <EmptyLineToolbar />
        <SelectionToolbar onSession={setSession} />
        <FindReplacePanel />
        <AskPanel />
        <HistoryPanel />
        <CommentPanel />
        <BlockContextMenuUI />
        <SuggestionBar session={session} onClear={() => setSession(null)} />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={e => {
            const file = e.target.files?.[0]
            if (file) {
              void uploadAndInsert(file)
            }
            e.target.value = ''
          }}
        />
      </div>
    </TesseraContext.Provider>
  )
}
