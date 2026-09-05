<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { tableToCsvAt } from '@tessera-editor/core'
import { useTesseraContext } from './context'

const { editor, t } = useTesseraContext()
const menu = ref<{ blockId: string; blockType: string; clientX: number; clientY: number } | null>(null)

function findBlockPosById(id: string): number | null {
  let found: number | null = null
  editor.state.doc.forEach((node, offset) => {
    if (found === null && node.attrs.id === id) {
      found = offset
    }
  })
  return found
}

function onMenu(payload: { blockId: string; blockType: string; clientX: number; clientY: number }) {
  const found = findBlockPosById(payload.blockId)
  if (found !== null) {
    editor.commands.setTextSelection(Math.min(found + 2, editor.state.doc.content.size))
  }
  menu.value = payload
}

function close() {
  menu.value = null
}

function copy(text: string) {
  void navigator.clipboard.writeText(text)
  close()
}

function anchorUrl(blockId: string): string {
  return `${location.origin}${location.pathname}#block-${blockId}`
}

function deleteBlock() {
  const id = menu.value?.blockId
  if (!id) return
  const pos = findBlockPosById(id)
  if (pos === null) return
  const node = editor.state.doc.nodeAt(pos)
  if (!node) return
  const tr = editor.state.tr.delete(pos, pos + node.nodeSize)
  editor.view.dispatch(tr)
  close()
}

onMounted(() => {
  editor.on('tessera:blockMenu', onMenu as never)
  window.addEventListener('mousedown', close)
  window.addEventListener('scroll', close, true)
})
onBeforeUnmount(() => {
  editor.off('tessera:blockMenu', onMenu as never)
  window.removeEventListener('mousedown', close)
  window.removeEventListener('scroll', close, true)
})

const menuStyle = computed(() => {
  if (!menu.value) {
    return {}
  }
  return {
    position: 'fixed' as const,
    left: `${Math.min(menu.value.clientX, window.innerWidth - 220)}px`,
    top: `${Math.min(menu.value.clientY, window.innerHeight - 300)}px`,
  }
})
</script>

<template>
  <Teleport to="body">
    <div v-if="menu" class="tessera-block-menu" :style="menuStyle" @mousedown.stop>
      <template v-if="menu.blockType === 'table' || menu.blockType === 'tableRow'">
        <div class="tessera-menu-label">{{ t('rowMenuTitle') }}</div>
        <button type="button" @click="editor.commands.addRowBefore(); close()">{{ t('rowMenuInsertAbove') }}</button>
        <button type="button" @click="editor.commands.addRowAfter(); close()">{{ t('rowMenuInsertBelow') }}</button>
        <button type="button" class="tessera-danger" @click="editor.commands.deleteRow(); close()">{{ t('rowMenuDelete') }}</button>
        <div class="tessera-menu-sep" />
        <button type="button" @click="copy(tableToCsvAt(editor) ?? '')">{{ t('tableCopyCsv') }}</button>
        <button type="button" @click="editor.commands.toggleHeaderRow(); close()">{{ t('tableToggleHeader') }}</button>
        <button type="button" class="tessera-danger" @click="editor.commands.deleteTable(); close()">{{ t('tableDelete') }}</button>
        <div class="tessera-menu-sep" />
      </template>
      <button type="button" @click="copy(anchorUrl(menu.blockId))">{{ t('menuCopyAnchor') }}</button>
      <button type="button" @click="copy(menu.blockId)">{{ t('menuCopyBlockId') }}</button>
      <button type="button" class="tessera-danger" @click="deleteBlock()">{{ t('menuDeleteBlock') }}</button>
    </div>
  </Teleport>
</template>
