<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import { Editor, EditorContent } from '@tiptap/vue-3'
import { DragHandle } from '@tiptap/extension-drag-handle'
import { createEmojiRenderer } from './emojiRenderer'
import {
  createTesseraExtensions,
  createTesseraT,
} from '@tessera-editor/core'
import type {
  TesseraLocale,
  UploadService,
  CommentStore,
  IdentityService,
} from '@tessera-editor/core'
import { createAiController, aiSlashItems } from '@tessera-editor/ai'
import type { AIRuntime, SuggestionSession } from '@tessera-editor/ai'
import { createSlashRenderer } from './slashRenderer'
import {
  ImageBlockView,
  AiTableCellViewExtension,
  AiTableHeaderViewExtension,
  EmbedBlockView,
  TocBlockView,
} from './views/extensions'
import EmptyLineToolbar from './EmptyLineToolbar.vue'
import SelectionToolbar from './SelectionToolbar.vue'
import LinkEditor from './LinkEditor.vue'
import FindReplacePanel from './FindReplacePanel.vue'
import AskPanel from './AskPanel.vue'
import CommentPanel from './CommentPanel.vue'
import BlockMenu from './BlockMenu.vue'
import SuggestionBar from './SuggestionBar.vue'
import { provideTessera } from './context'
import '@tessera-editor/core/styles.css'

const props = withDefaults(
  defineProps<{
    content?: unknown
    locale?: TesseraLocale
    upload?: UploadService
    comments?: CommentStore
    identity?: IdentityService
    ai?: AIRuntime
  /** v1.1: document column max-width in px. */
  docWidth?: number
  }>(),
  { locale: 'zh-CN' },
)

const emit = defineEmits<{
  (e: 'update', editor: import('@tiptap/core').Editor): void
  (e: 'create', editor: import('@tiptap/core').Editor): void
}>()

const t = computed(() => createTesseraT(props.locale))

const docWidthStyle = computed(() =>
  props.docWidth ? ({ '--te-doc-max-width': `${props.docWidth}px` }) : undefined,
)
const editor = shallowRef<Editor | null>(null)
const session = ref<SuggestionSession | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)

function buildExtensions() {
  return createTesseraExtensions({ locale: props.locale }).map(ext => {
    if (ext.name === 'tesseraSlashMenu') {
      return ext.configure({
        render: createSlashRenderer(t.value),
        extraItems: props.ai
          ? (ctx: { editor: Editor; t: ReturnType<typeof createTesseraT> }) =>
              aiSlashItems({ editor: ctx.editor, runtime: props.ai!, t: ctx.t })
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
  })
}

async function uploadAndInsert(file: File) {
  const ed = editor.value
  if (!ed) return
  const bag = (ed.storage as unknown as Record<string, { upload?: UploadService }>).tesseraServices
  if (!bag?.upload) return
  try {
    const asset = await bag.upload.uploadImage(file)
    ed.chain().focus().setImage({ src: asset.url, alt: asset.name }).run()
  } catch (err) {
    console.error('[Tessera] image upload failed:', err)
  }
}

onMounted(() => {
  const ed = new Editor({
    extensions: [
      ...buildExtensions().map(ext =>
        ext.name === 'tesseraEmojiMenu'
          ? (ext as unknown as { configure: (o: { render: unknown }) => typeof ext }).configure({
              render: createEmojiRenderer(),
            })
          : ext,
      ),
      // 'left' (vertical center) instead of the default 'left-start': the
      // handle must sit mid-row like Slite, not above multi-line blocks.
      // nested: hovering a list item targets that item (Slite-style).
      DragHandle.configure({
        computePositionConfig: { placement: 'left', strategy: 'absolute' },
      }),
    ],
    content: props.content as never,
    onUpdate: ({ editor: e }) => emit('update', e),
    onCreate: ({ editor: e }) => {
      // legacy docs may carry stray hidden text in typed cells
      e.commands.normalizeTypedCells()
      emit('create', e)
    },
    editorProps: {
      attributes: { class: 'tessera-doc', spellcheck: 'false' },
      handlePaste: (_view, event) => {
        const file = Array.from(event.clipboardData?.files ?? []).find(f => f.type.startsWith('image/'))
        if (file) {
          void uploadAndInsert(file)
          return true
        }
        return false
      },
      handleDrop: (_view, event, _slice, moved) => {
        if (moved) return false
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
  editor.value = ed
  syncServices()

  ed.on('tessera:insertImage', () => fileInput.value?.click())
  ed.on('tessera:session', ((payload: { session: SuggestionSession | null }) => {
    session.value = payload.session
  }) as never)
})

function syncServices() {
  const ed = editor.value
  if (!ed) return
  ;(ed.storage as unknown as Record<string, Record<string, unknown>>).tesseraServices = {
    ...((ed.storage as unknown as Record<string, Record<string, unknown>>).tesseraServices ?? {}),
    upload: props.upload,
    comments: props.comments,
    identity: props.identity,
  }
}

watch(() => [props.upload, props.comments, props.identity], syncServices)

onBeforeUnmount(() => {
  editor.value?.destroy()
  editor.value = null
})

const aiController = computed(() => {
  const ed = editor.value
  return ed && props.ai ? createAiController(ed, props.ai, props.locale) : null
})

provideTessera({
  get editor() {
    return editor.value!
  },
  get locale() {
    return props.locale
  },
  get t() {
    return t.value
  },
  get ai() {
    return aiController.value
  },
} as never)
</script>

<template>
  <div v-if="editor" class="tessera-root">
    <EditorContent :editor="editor" />
    <EmptyLineToolbar />
    <SelectionToolbar @session="s => (session = s)" />
    <LinkEditor />
    <FindReplacePanel />
    <AskPanel />
    <CommentPanel />
    <BlockMenu />
    <SuggestionBar :session="session" @clear="session = null" />
    <input
      ref="fileInput"
      type="file"
      accept="image/*"
      hidden
      @change="event => {
        const file = (event.target as HTMLInputElement).files?.[0]
        if (file) uploadAndInsert(file)
        ;(event.target as HTMLInputElement).value = ''
      }"
    />
  </div>
</template>
