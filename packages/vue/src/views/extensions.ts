import { VueNodeViewRenderer } from '@tiptap/vue-3'
import { ImageBlock, AiTableCell, AiTableHeader, EmbedBlock, TocBlock } from '@tessera-editor/core'
import AiImageNodeView from './ImageNodeView.vue'
import AiTableCellView from './TableCellView.vue'
import AiTableHeaderView from './TableHeaderView.vue'
import AiEmbedView from './EmbedView.vue'
import AiTocView from './TocView.vue'

/** Binding-level node views: core schema + Vue renderers. */
export const ImageBlockView = ImageBlock.extend({
  addNodeView() {
    return VueNodeViewRenderer(AiImageNodeView)
  },
})

export const AiTableCellViewExtension = AiTableCell.extend({
  addNodeView() {
    return VueNodeViewRenderer(AiTableCellView)
  },
})

export const AiTableHeaderViewExtension = AiTableHeader.extend({
  addNodeView() {
    return VueNodeViewRenderer(AiTableHeaderView)
  },
})

export const EmbedBlockView = EmbedBlock.extend({
  addNodeView() {
    return VueNodeViewRenderer(AiEmbedView)
  },
})

export const TocBlockView = TocBlock.extend({
  addNodeView() {
    return VueNodeViewRenderer(AiTocView)
  },
})
