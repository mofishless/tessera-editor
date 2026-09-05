<script setup lang="ts">
import { computed, ref } from 'vue'
import { NodeViewWrapper, NodeViewContent } from '@tiptap/vue-3'
import type { NodeViewProps } from '@tiptap/vue-3'
import { TABLE_COLUMN_KINDS, tableToCsvAt } from '@tessera-editor/core'
import type { TableColumnKind } from '@tessera-editor/core'
import { useTesseraContext } from '../context'

const props = defineProps<NodeViewProps>()
const { editor, t } = useTesseraContext()
const open = ref(false)
const tagInput = ref('')

const columnIndex = computed(() => {
  const pos = props.getPos()
  if (typeof pos !== 'number') return 0
  const $pos = editor.state.doc.resolve(pos)
  return $pos.index($pos.depth)
})

function run(fn: () => unknown) {
  open.value = false
  const pos = props.getPos()
  if (typeof pos === 'number') {
    editor.commands.setTextSelection(pos + 2)
  }
  void fn()
}

function kindLabel(kind: TableColumnKind): string {
  const map: Record<TableColumnKind, string> = {
    text: t('colTypeText'),
    checkbox: t('colTypeCheckbox'),
    select: t('colTypeSelect'),
    multiSelect: t('colTypeMultiSelect'),
    number: t('colTypeNumber'),
    date: t('colTypeDate'),
    link: t('colTypeLink'),
  }
  return map[kind]
}

function copyCsv() {
  const csv = tableToCsvAt(editor)
  if (csv) {
    void navigator.clipboard.writeText(csv)
  }
  open.value = false
}
</script>

<template>
  <NodeViewWrapper as="th" class="tessera-th" :data-index="columnIndex">
    <NodeViewContent class="tessera-th-content" />
    <button
      type="button"
      class="tessera-col-menu-btn"
      contenteditable="false"
      :title="t('colMenuTitle')"
      @mousedown.prevent
      @click="open = !open"
    >
      ⌄
    </button>
    <div v-if="open" class="tessera-popover tessera-col-menu" contenteditable="false" @mousedown.prevent>
      <div class="tessera-menu-section">
        <button v-for="kind in TABLE_COLUMN_KINDS" :key="kind" type="button" @click="run(() => editor.commands.setColumnType(columnIndex, kind))">
          {{ kindLabel(kind) }}
        </button>
      </div>
      <div class="tessera-menu-sep" />
      <button type="button" @click="run(() => editor.commands.sortTableByColumn(columnIndex, 'asc'))">{{ t('colMenuSortAsc') }}</button>
      <button type="button" @click="run(() => editor.commands.sortTableByColumn(columnIndex, 'desc'))">{{ t('colMenuSortDesc') }}</button>
      <div class="tessera-menu-sep" />
      <button type="button" @click="run(() => editor.commands.addColumnBefore())">{{ t('colMenuInsertLeft') }}</button>
      <button type="button" @click="run(() => editor.commands.addColumnAfter())">{{ t('colMenuInsertRight') }}</button>
      <button type="button" class="tessera-danger" @click="run(() => editor.commands.deleteColumn())">{{ t('colMenuDelete') }}</button>
      <div class="tessera-menu-sep" />
      <button type="button" @click="run(() => editor.commands.toggleHeaderRow())">{{ t('tableToggleHeader') }}</button>
      <button type="button" @click="copyCsv()">{{ t('tableCopyCsv') }}</button>
      <button type="button" class="tessera-danger" @click="run(() => editor.commands.deleteTable())">{{ t('tableDelete') }}</button>
    </div>
  </NodeViewWrapper>
</template>
