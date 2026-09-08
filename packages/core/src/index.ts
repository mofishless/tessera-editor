// nodes & marks
export { Hint } from './nodes/hint'
export type { HintVariant, HintOptions } from './nodes/hint'
export { Collapsible, CollapsibleSummary, CollapsibleContent } from './nodes/collapsible'
export type { CollapsibleOptions } from './nodes/collapsible'
export { ImageBlock } from './nodes/image'
export type { ImageAlign, ImageBlockOptions } from './nodes/image'
export { AiTable, AiTableRow, AiTableCell, AiTableHeader, TABLE_COLUMN_KINDS, normalizeTypes, tableNodeToCsv, tableToCsvAt } from './nodes/table'
export type { TableColumnKind } from './nodes/table'
export { EmbedBlock } from './nodes/embed'
export { TocBlock } from './nodes/toc'
export { AiAttribution } from './marks/ai'
export type { AiAttributionOptions } from './marks/ai'
export { CommentMark, CommentCommands, listCommentRanges } from './marks/comment'

// extensions
export { TesseraInputRules } from './extensions/input-rules'
export { TesseraShortcuts } from './extensions/shortcuts'
export { TesseraFindReplace, findReplaceKey } from './extensions/find-replace'
export type { FindMatch, FindReplaceState } from './extensions/find-replace'
export { SlashMenu, defaultSlashItems, filterSlashItems, slashItemNodeName } from './extensions/slash'
export type { SlashMenuItem, SlashMenuOptions, SlashRenderFactory } from './extensions/slash'
export { EmojiMenu, EMOJI_ITEMS, filterEmojiItems } from './extensions/emoji'
export type { EmojiItem, EmojiMenuOptions } from './extensions/emoji'
export { BlockContextMenu } from './extensions/context-menu'
export { TesseraGallery, galleryKey, findGalleryRuns } from './extensions/gallery'
export { TesseraMetrics, getTesseraMetrics, measureTesseraMetrics } from './extensions/metrics'
export type { TesseraMetricsSnapshot } from './extensions/metrics'
export { TesseraWordPaste } from './extensions/word-paste'
export { isWordHtml, cleanWordHtml } from './wordpaste'
export { findBlockPosById, deleteBlockById, blockAnchorUrl } from './blockmenu'
export { findLinkRange, saveLinkRange, removeLinkRange } from './linkedit'
export type { TesseraLinkRange } from './linkedit'

// preset
export { createTesseraExtensions, createTesseraSchema, ID_BLOCK_TYPES, SUPPORTED_BLOCK_TYPES } from './preset'
export type { TesseraPresetOptions } from './preset'

// i18n
export { createTesseraT, tesseraMessages } from './i18n'
export type { TesseraLocale, TesseraMessageKey, TesseraMessageOverrides, TesseraTranslator } from './i18n'

// re-exported host-facing types (hosts build on these without a direct
// @tiptap/core dependency)
export type { Editor } from '@tiptap/core'
export type { JSONContent } from '@tiptap/core'

// services
export {
  TesseraServices,
  getUploadService,
  getCommentStore,
  getIdentityService,
} from './services'
export type {
  UploadService,
  UploadedAsset,
  TesseraServicesStorage,
  CommentStore,
  CommentThread,
  CommentEntry,
  IdentityService,
} from './services'

// format layer
export { docToMarkdown, markdownToDoc, createMarkdownSerializer, stableJson } from './markdown'


// write-back protocol
export {
  getTopLevelBlocks,
  getBlockJson,
  modifyRange,
  appendBlocks,
  removeBlocks,
} from './writeback'
export type { BlockHandle, ModifyRangeOptions, AppendBlocksOptions } from './writeback'
