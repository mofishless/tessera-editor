<script setup lang="ts">
import { computed, ref } from 'vue'
import { NodeViewWrapper, NodeViewContent } from '@tiptap/vue-3'
import type { NodeViewProps } from '@tiptap/vue-3'
import type { TableColumnKind } from '@tessera-editor/core'
import { useTesseraContext } from '../context'

const props = defineProps<NodeViewProps>()
const { editor } = useTesseraContext()
const value = computed(() => props.node.attrs.value as unknown)
const tagInput = ref('')

const kind = computed<TableColumnKind>(() => {
  const pos = props.getPos()
  if (typeof pos !== 'number') return 'text'
  const $pos = editor.state.doc.resolve(pos)
  let tableDepth = -1
  for (let d = $pos.depth; d >= 1; d--) {
    if ($pos.node(d).type.name === 'table') {
      tableDepth = d
      break
    }
  }
  if (tableDepth < 1) return 'text'
  const table = $pos.node(tableDepth)
  const cellIndex = $pos.index(tableDepth + 1)
  const types = Array.isArray(table.attrs.types) ? (table.attrs.types as TableColumnKind[]) : []
  return types[cellIndex] ?? 'text'
})

const tagValues = computed<string[]>(() =>
  Array.isArray(value.value) ? (value.value as string[]) : value.value ? [String(value.value)] : [],
)

function setValue(next: unknown) {
  props.updateAttributes({ value: next })
}

function commitTag(multi: boolean) {
  const tag = tagInput.value.trim()
  if (!tag) return
  const next = multi ? Array.from(new Set([...tagValues.value, tag])) : [tag]
  setValue(multi ? next : (next[0] ?? null))
  tagInput.value = ''
}
</script>

<template>
  <NodeViewWrapper as="td" class="tessera-td" :class="`tessera-td--${kind}`">
    <NodeViewContent class="tessera-td-hidden" />
    <input
      v-if="kind === 'checkbox'"
      type="checkbox"
      class="tessera-cell-checkbox"
      :checked="value === true || value === 'true'"
      contenteditable="false"
      @change="setValue(($event.target as HTMLInputElement).checked)"
    />
    <input
      v-else-if="kind === 'number'"
      type="number"
      class="tessera-cell-input"
      :value="typeof value === 'number' ? value : ''"
      placeholder="—"
      contenteditable="false"
      @change="setValue(($event.target as HTMLInputElement).value === '' ? null : Number(($event.target as HTMLInputElement).value))"
    />
    <input
      v-else-if="kind === 'date'"
      type="date"
      class="tessera-cell-input"
      :value="typeof value === 'string' ? value : ''"
      contenteditable="false"
      @change="setValue(($event.target as HTMLInputElement).value || null)"
    />
    <div v-else-if="kind === 'select' || kind === 'multiSelect'" class="tessera-cell-tags" contenteditable="false">
      <span v-for="tag in tagValues" :key="tag" class="tessera-tag">
        {{ tag }}
        <button type="button" class="tessera-tag-x" @click="setValue(tagValues.filter(v => v !== tag))">×</button>
      </span>
      <input
        v-model="tagInput"
        class="tessera-cell-input tessera-cell-taginput"
        placeholder="+ 标签"
        @keydown.enter.prevent="commitTag(kind === 'multiSelect')"
        @blur="commitTag(kind === 'multiSelect')"
      />
    </div>
    <input
      v-else-if="kind === 'link'"
      type="url"
      class="tessera-cell-input"
      placeholder="https://…"
      :value="typeof value === 'string' ? value : ''"
      contenteditable="false"
      @change="setValue(($event.target as HTMLInputElement).value || null)"
    />
  </NodeViewWrapper>
</template>
