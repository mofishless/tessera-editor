<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { NodeViewWrapper } from '@tiptap/vue-3'
import type { NodeViewProps } from '@tiptap/vue-3'
import { useTesseraContext } from '../context'

const props = defineProps<NodeViewProps>()
const { t } = useTesseraContext()
const items = ref<{ id: string; level: number; text: string }[]>([])

function scan() {
  const found: { id: string; level: number; text: string }[] = []
  props.editor.state.doc.forEach(node => {
    if (node.type.name === 'heading' && typeof node.attrs.id === 'string') {
      found.push({ id: node.attrs.id, level: Number(node.attrs.level), text: node.textContent })
    }
  })
  items.value = found
}

onMounted(() => {
  scan()
  props.editor.on('transaction', scan)
})
onBeforeUnmount(() => {
  props.editor.off('transaction', scan)
})

function jump(id: string) {
  document.querySelector(`[data-id="${id}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
</script>

<template>
  <NodeViewWrapper class="tessera-toc">
    <div class="tessera-toc-title">{{ t('itemToc') }}</div>
    <div v-if="items.length === 0" class="tessera-toc-empty">{{ t('tocEmpty') }}</div>
    <div v-else class="tessera-toc-list" contenteditable="false">
      <button
        v-for="item in items"
        :key="item.id"
        type="button"
        class="tessera-toc-item"
        :data-level="item.level"
        @click="jump(item.id)"
      >
        {{ item.text }}
      </button>
    </div>
  </NodeViewWrapper>
</template>
