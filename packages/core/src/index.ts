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
export { PlaceholderMark, PlaceholderCommands } from './marks/placeholder'
export type { PlaceholderKind } from './marks/placeholder'

// extensions
export { TesseraInputRules } from './extensions/input-rules'
export { TesseraShortcuts } from './extensions/shortcuts'
export { TesseraFindReplace, findReplaceKey } from './extensions/find-replace'
export type { FindMatch, FindReplaceState } from './extensions/find-replace'
export { SlashMenu, defaultSlashItems } from './extensions/slash'
export type { SlashMenuItem, SlashMenuOptions, SlashRenderFactory } from './extensions/slash'
export { TesseraHistory, historyKey } from './extensions/history'
export type { HistorySnapshotOptions } from './extensions/history'
export { BlockContextMenu } from './extensions/context-menu'

// preset
export { createTesseraExtensions, ID_BLOCK_TYPES } from './preset'
export type { TesseraPresetOptions } from './preset'

// i18n
export { createTesseraT, tesseraMessages } from './i18n'
export type { TesseraLocale, TesseraMessageKey, TesseraTranslator } from './i18n'

// services
export {
  TesseraServices,
  getUploadService,
  getStorageService,
  getCommentStore,
  getIdentityService,
} from './services'
export type {
  UploadService,
  UploadedAsset,
  TesseraServicesStorage,
  StorageService,
  DocSnapshot,
  CommentStore,
  CommentThread,
  CommentEntry,
  IdentityService,
} from './services'

// format layer
export { docToMarkdown, markdownToDoc, createMarkdownSerializer, stableJson } from './markdown'

// diff (history panel)
export { diffDocs, wordDiff, diffSummary } from './diff'
export type { WordDiffPart, BlockDiffEntry } from './diff'

// write-back protocol
export {
  getTopLevelBlocks,
  getBlockJson,
  modifyRange,
  appendBlocks,
  removeBlocks,
} from './writeback'
export type { BlockHandle, ModifyRangeOptions, AppendBlocksOptions } from './writeback'
