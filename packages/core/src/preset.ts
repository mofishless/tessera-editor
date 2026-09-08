import { getSchema } from '@tiptap/core'
import type { Extensions } from '@tiptap/core'
import type { Schema } from '@tiptap/pm/model'
import StarterKit from '@tiptap/starter-kit'
import { TaskList, TaskItem } from '@tiptap/extension-list'
import { TextStyle } from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import { Highlight } from '@tiptap/extension-highlight'
import { UniqueID } from '@tiptap/extension-unique-id'
import { Placeholder } from '@tiptap/extensions'
import { Hint } from './nodes/hint'
import { Collapsible, CollapsibleSummary, CollapsibleContent } from './nodes/collapsible'
import { ImageBlock } from './nodes/image'
import { AiTable, AiTableRow, AiTableCell, AiTableHeader } from './nodes/table'
import { EmbedBlock } from './nodes/embed'
import { TocBlock } from './nodes/toc'
import { AiAttribution } from './marks/ai'
import { CommentMark, CommentCommands } from './marks/comment'
import { TesseraInputRules } from './extensions/input-rules'
import { TesseraShortcuts } from './extensions/shortcuts'
import { TesseraFindReplace } from './extensions/find-replace'
import { SlashMenu } from './extensions/slash'
import { EmojiMenu } from './extensions/emoji'
import { BlockContextMenu } from './extensions/context-menu'
import { TesseraGallery } from './extensions/gallery'
import { TesseraMetrics } from './extensions/metrics'
import { TesseraWordPaste } from './extensions/word-paste'
import { TesseraServices } from './services'
import { createTesseraT, type TesseraLocale, type TesseraMessageOverrides } from './i18n'

export interface TesseraPresetOptions {
  locale?: TesseraLocale
  /** Empty-paragraph placeholder text (default: the i18n `placeholderEmpty` string). */
  placeholder?: string
  /** Per-key overrides of the built-in UI dictionary (slash items, tooltips…). */
  messages?: TesseraMessageOverrides
  /**
   * Host block policy: top-level block types to exclude entirely. An excluded
   * node is dropped from the extension preset, the slash menu, UniqueID's id
   * list and the keyboard shortcuts that produce it — the editor cannot create
   * it and rejects its JSON on parse. Recognized names: `hint`, `collapsible`,
   * `embedBlock`, `tocBlock`, `horizontalRule`, `table`, `taskList`,
   * `imageBlock`.
   */
  excludeBlocks?: string[]
}

/** Node types that receive stable block IDs (write-back protocol basis). */
export const ID_BLOCK_TYPES = [
  'paragraph',
  'heading',
  'bulletList',
  'orderedList',
  'taskList',
  'listItem',
  'taskItem',
  'blockquote',
  'codeBlock',
  'horizontalRule',
  'hint',
  'collapsible',
  'imageBlock',
  'table',
  'tableRow',
  'embedBlock',
  'tocBlock',
]

/**
 * Every top-level block type the FULL preset can emit into the canonical JSON.
 * Hosts gating saves server-side (a block whitelist) should align their list
 * with this one; `excludeBlocks` trims the editor to match a narrower policy.
 * (Nested containers — listItem/taskItem/tableRow — are not listed: they only
 * appear inside their parents.)
 */
export const SUPPORTED_BLOCK_TYPES = [
  'paragraph',
  'heading',
  'bulletList',
  'orderedList',
  'taskList',
  'blockquote',
  'codeBlock',
  'horizontalRule',
  'imageBlock',
  'table',
  'hint',
  'collapsible',
  'embedBlock',
  'tocBlock',
] as const

/**
 * The Tessera extension preset: framework-agnostic, UI-free. The binding layers
 * rendering (slash menu renderer, node views) on top of this.
 */
export function createTesseraExtensions(options: TesseraPresetOptions = {}): Extensions {
  const t = createTesseraT(options.locale ?? 'zh-CN', options.messages)
  const excluded = new Set(options.excludeBlocks ?? [])
  const keep = (name: string): boolean => !excluded.has(name)

  return [
    StarterKit.configure({
      heading: { levels: [1, 2, 3, 4] },
      link: {
        openOnClick: false,
        autolink: true,
        defaultProtocol: 'https',
      },
      // undoRedo keeps defaults (newGroupDelay 500ms): streaming AI chunks
      // arriving faster than that already merge into one undo step.
      horizontalRule: keep('horizontalRule') ? undefined : false,
    }),
    TextStyle,
    Color,
    Highlight.configure({ multicolor: true }),
    ...(keep('taskList') ? [TaskList, TaskItem.configure({ nested: true })] : []),
    ...(keep('hint') ? [Hint] : []),
    ...(keep('collapsible') ? [Collapsible, CollapsibleSummary, CollapsibleContent] : []),
    ...(keep('imageBlock') ? [ImageBlock] : []),
    ...(keep('table') ? [AiTable, AiTableRow, AiTableCell, AiTableHeader] : []),
    ...(keep('embedBlock') ? [EmbedBlock] : []),
    ...(keep('tocBlock') ? [TocBlock] : []),
    AiAttribution,
    CommentMark,
    CommentCommands,
    UniqueID.configure({
      types: ID_BLOCK_TYPES.filter(keep),
      attributeName: 'id',
    }),
    Placeholder.configure({
      placeholder: ({ node }) =>
        node.type.name === 'paragraph' ? (options.placeholder ?? t('placeholderEmpty')) : '',
      showOnlyWhenEditable: true,
    }),
    TesseraInputRules,
    TesseraShortcuts,
    TesseraFindReplace,
    BlockContextMenu,
    SlashMenu.configure({ locale: options.locale ?? 'zh-CN', excludeItems: options.excludeBlocks }),
    EmojiMenu,
    ...(keep('imageBlock') ? [TesseraGallery] : []),
    TesseraMetrics,
    TesseraWordPaste,
    TesseraServices,
  ]
}

/**
 * ProseMirror schema for the preset without instantiating an editor — the
 * headless entry for hosts that only need format conversion (markdown ⇄ JSON).
 * Honors `excludeBlocks` so conversion always agrees with the mounted editor.
 */
export function createTesseraSchema(options: TesseraPresetOptions = {}): Schema {
  return getSchema(createTesseraExtensions(options))
}
