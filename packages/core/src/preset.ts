import type { Extensions } from '@tiptap/core'
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
import { PlaceholderMark, PlaceholderCommands } from './marks/placeholder'
import { TesseraInputRules } from './extensions/input-rules'
import { TesseraShortcuts } from './extensions/shortcuts'
import { TesseraFindReplace } from './extensions/find-replace'
import { SlashMenu } from './extensions/slash'
import { EmojiMenu } from './extensions/emoji'
import { TesseraHistory } from './extensions/history'
import { BlockContextMenu } from './extensions/context-menu'
import { TesseraGallery } from './extensions/gallery'
import { TesseraMetrics } from './extensions/metrics'
import { TesseraWordPaste } from './extensions/word-paste'
import { TesseraServices } from './services'
import { createTesseraT, type TesseraLocale } from './i18n'

export interface TesseraPresetOptions {
  locale?: TesseraLocale
  /** v1.1 history auto-capture idle window (playground uses a short one) */
  historyIdleMs?: number
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
 * The Tessera extension preset: framework-agnostic, UI-free. The binding layers
 * rendering (slash menu renderer, node views) on top of this.
 */
export function createTesseraExtensions(options: TesseraPresetOptions = {}): Extensions {
  const t = createTesseraT(options.locale ?? 'zh-CN')

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
    }),
    TextStyle,
    Color,
    Highlight.configure({ multicolor: true }),
    TaskList,
    TaskItem.configure({ nested: true }),
    Hint,
    Collapsible,
    CollapsibleSummary,
    CollapsibleContent,
    ImageBlock,
    AiTable,
    AiTableRow,
    AiTableCell,
    AiTableHeader,
    EmbedBlock,
    TocBlock,
    AiAttribution,
    CommentMark,
    CommentCommands,
    PlaceholderMark,
    PlaceholderCommands,
    UniqueID.configure({
      types: ID_BLOCK_TYPES,
      attributeName: 'id',
    }),
    Placeholder.configure({
      placeholder: ({ node }) => (node.type.name === 'paragraph' ? t('placeholderEmpty') : ''),
      showOnlyWhenEditable: true,
    }),
    TesseraInputRules,
    TesseraShortcuts,
    TesseraFindReplace,
    TesseraHistory.configure({ idleMs: options.historyIdleMs }),
    BlockContextMenu,
    SlashMenu.configure({ locale: options.locale ?? 'zh-CN' }),
    EmojiMenu,
    TesseraGallery,
    TesseraMetrics,
    TesseraWordPaste,
    TesseraServices,
  ]
}
