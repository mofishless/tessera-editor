<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { NodeViewWrapper, NodeViewContent } from '@tiptap/vue-3'
import type { NodeViewProps } from '@tiptap/vue-3'
import { TABLE_COLUMN_KINDS, tableToCsvAt } from '@tessera-editor/core'
import type { TableColumnKind } from '@tessera-editor/core'
import { useTesseraContext } from '../context'
import { useTesseraPortalRoot } from '../portal'

const props = defineProps<NodeViewProps>()
const { editor, t } = useTesseraContext()
const portalRoot = useTesseraPortalRoot(editor)
const open = ref(false)
const tagInput = ref('')
const menuStyle = ref<Record<string, string>>({})
const menuRef = ref<HTMLElement | null>(null)

const columnIndex = computed(() => {
  const pos = props.getPos()
  if (typeof pos !== 'number') return 0
  const $pos = editor.state.doc.resolve(pos)
  return $pos.index($pos.depth)
})

// the table has overflow:hidden (corner rounding), so an inline dropdown
// would be clipped away — the menu teleports out of the table and anchors
// to the header cell with fixed positioning, flipping near the viewport
// bottom like every other popover
function toggle(e: MouseEvent) {
  const th = (e.currentTarget as HTMLElement).closest('.tessera-th')
  if (th) {
    const r = th.getBoundingClientRect()
    const flip = window.innerHeight - r.bottom < 340 && r.top > 340
    const left = Math.min(Math.max(8, r.left), window.innerWidth - 198)
    menuStyle.value = flip
      ? { left: `${left}px`, top: 'auto', bottom: `${window.innerHeight - r.top + 6}px` }
      : { left: `${left}px`, top: `${r.bottom + 6}px`, bottom: 'auto' }
  }
  open.value = !open.value
}

function onWindowMouseDown(e: MouseEvent) {
  const target = e.target as HTMLElement
  if (menuRef.value?.contains(target) || target.closest('.tessera-col-menu-btn')) return
  open.value = false
}

onMounted(() => window.addEventListener('mousedown', onWindowMouseDown))
onBeforeUnmount(() => window.removeEventListener('mousedown', onWindowMouseDown))

function run(fn: () => unknown) {
  // read-only docs must not mutate, however the menu was triggered
  if (!editor.isEditable) {
    open.value = false
    return
  }
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
      @click="toggle($event)"
    >
      ⌄
    </button>
  </NodeViewWrapper>
  <Teleport v-if="portalRoot" :to="portalRoot">
    <div
      v-if="open"
      ref="menuRef"
      class="tessera-popover tessera-col-menu"
      :style="{ position: 'fixed', ...menuStyle }"
      contenteditable="false"
      @mousedown.stop
    >
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
  </Teleport>
</template>
