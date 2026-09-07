import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import type { Editor } from '@tiptap/react'
import type { Content, EditorOptions } from '@tiptap/core'
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
import { createEmojiRenderer } from './EmojiMenu'
import { EmptyLineToolbar } from './EmptyLineToolbar'
import { LinkEditor } from './LinkEditor'
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
  /** v1.1: document column max-width in px (Slite-style centered column). */
  docWidth?: number
  onUpdate?: (editor: Editor) => void
  onCreate?: (editor: Editor) => void
}

/**
 * Batteries-included editor (M1+M2 scope). Slite-style: empty-line toolbar,
 * slash menu, selection toolbar, drag handle — deliberately NOT Notion's
 * floating "+".
 */

/** Stable reference is required: see the DragHandle usage comment below. */
const DRAG_HANDLE_POSITION_CONFIG = { placement: 'left', strategy: 'absolute' } as const
// NOTE: DragHandle `nested` mode (per-item list dragging) was evaluated and
// deferred — with nested rules active the handle stopped appearing on plain
// hover in smoke checks. Revisit with:
//   nested={{ edgeDetection: 'left', allowedContainers: ['bulletList', 'orderedList', 'taskList'] }}
export function Tessera({
  content,
  locale = 'zh-CN',
  upload,
  storage,
  comments,
  identity,
  ai: runtime,
  historyIdleMs,
  docWidth,
  onUpdate,
  onCreate,
}: TesseraProps) {
  const t = useMemo(() => createTesseraT(locale), [locale])
  const [session, setSession] = useState<SuggestionSession | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  type DragNodeData = {
    node: { attrs: Record<string, unknown>; type: { name: string } } | null
    pos: number
  }
  const dragNodeRef = useRef<DragNodeData | null>(null)
  const handleDragNodeChange = useCallback((data: DragNodeData) => {
    dragNodeRef.current = data.node ? data : null
  }, [])

  // Everything handed to useEditor must be referentially stable: an unstable
  // option (any inline callback) makes @tiptap/react call editor.setOptions
  // on every render, and TipTap's setOptions runs view.updateState, which
  // destroys and recreates ALL plugin views. A recreated suggestion view
  // starts from an already-active state with no "started" transition, so
  // renderer.onStart never fires and the slash menu UI never mounts.
  // Latest prop values are therefore read through refs instead.
  const onUpdateRef = useRef(onUpdate)
  onUpdateRef.current = onUpdate
  const onCreateRef = useRef(onCreate)
  onCreateRef.current = onCreate
  const runtimeRef = useRef(runtime)
  runtimeRef.current = runtime
  const initialContentRef = useRef(content)
  const editorRef = useRef<Editor | null>(null)

  const extensions = useMemo(
    () =>
      createTesseraExtensions({ locale, historyIdleMs }).map(ext => {
        if (ext.name === 'tesseraSlashMenu') {
          return ext.configure({
            render: createSlashRenderer(t),
            extraItems: (ctx: Parameters<NonNullable<import('@tessera-editor/core').SlashMenuOptions['extraItems']>>[0]) => {
              const rt = runtimeRef.current
              return rt ? aiSlashItems({ editor: ctx.editor, runtime: rt, t: ctx.t }) : []
            },
          })
        }
        if (ext.name === 'tesseraEmojiMenu') {
          return ext.configure({ render: createEmojiRenderer() })
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
    // runtime is read through runtimeRef on purpose: rebuilding the extension
    // list after mount cannot apply anyway (extensions are only read when the
    // editor is created) and would only trigger the setOptions churn above
    [locale, t, historyIdleMs],
  )

  async function uploadAndInsert(file: File) {
    const ed = editorRef.current
    if (!ed) {
      return
    }
    const storage = ed.storage as unknown as Record<string, { upload?: UploadService }>
    const svc = storage.tesseraServices?.upload
    if (!svc) {
      return
    }
    try {
      const asset = await svc.uploadImage(file)
      ed.chain().focus().setImage({ src: asset.url, alt: asset.name }).run()
    } catch (err) {
      console.error('[Tessera] image upload failed:', err)
    }
  }
  const uploadAndInsertRef = useRef(uploadAndInsert)
  uploadAndInsertRef.current = uploadAndInsert

  const editorProps: EditorOptions['editorProps'] = useMemo(
    () => ({
      attributes: {
        class: 'tessera-doc',
        spellcheck: 'false',
      },
      handlePaste: (_view, event) => {
        const file = Array.from(event.clipboardData?.files ?? []).find(f => f.type.startsWith('image/'))
        if (file) {
          void uploadAndInsertRef.current(file)
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
          void uploadAndInsertRef.current(file)
          return true
        }
        return false
      },
    }),
    [],
  )

  const handleUpdate = useCallback(({ editor: e }: { editor: Editor }) => onUpdateRef.current?.(e), [])
  const handleCreate = useCallback(({ editor: e }: { editor: Editor }) => onCreateRef.current?.(e), [])

  const editor = useEditor({
    extensions,
    content: initialContentRef.current,
    onUpdate: handleUpdate,
    onCreate: handleCreate,
    editorProps,
  })

  editorRef.current = editor ?? null

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
      <div
        className="tessera-root"
        style={{ '--te-doc-max-width': docWidth ? `${docWidth}px` : undefined } as CSSProperties}
      >
        <EditorContent editor={editor} />
        {/* 'left' (vertical center) instead of the default 'left-start': the
            handle must sit mid-row like Slite, not above multi-line blocks.
            The config object must be referentially stable — DragHandle
            re-registers its plugin whenever its props change identity, and
            that re-registration recreates every PM plugin view (killing any
            active slash-menu UI). */}
        <DragHandle
          editor={editor}
          pluginKey="tesseraDragHandle"
          computePositionConfig={DRAG_HANDLE_POSITION_CONFIG}
          onNodeChange={handleDragNodeChange}
        >
          <div
            className="tessera-drag-handle"
            onClick={event => {
              // handle click opens the block menu (drag still reorders);
              // context menu UI selects the block and positions at pointer
              const data = dragNodeRef.current
              if (!data?.node) {
                return
              }
              const id = (data.node.attrs as { id?: string }).id
              if (!id) {
                return
              }
              editor.emit('tessera:blockMenu', {
                blockId: id,
                blockType: data.node.type.name,
                clientX: event.clientX,
                clientY: event.clientY,
              } as never)
            }}
          >
            ⠿
          </div>
        </DragHandle>
        <EmptyLineToolbar />
        <SelectionToolbar onSession={setSession} />
        <LinkEditor />
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
