<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { defaultSlashItems } from '@tessera-editor/core'
import type { SlashMenuItem } from '@tessera-editor/core'
import { useTesseraContext } from './context'

const { editor, t, ai } = useTesseraContext()
const style = ref<{ top: string; left: string } | null>(null)
const expanded = ref(false)
let composing = false

const items = computed(() => defaultSlashItems(t))

function reposition() {
  if (composing || !editor.isFocused) {
    style.value = null
    return
  }
  const { $from, empty } = editor.state.selection
  const isEmptyParagraph = empty && $from.parent.type.name === 'paragraph' && $from.parent.content.size === 0
  if (!isEmptyParagraph) {
    style.value = null
    expanded.value = false
    return
  }
  const coords = editor.view.coordsAtPos($from.pos)
  style.value = {
    top: `${Math.max(8, coords.top - 46)}px`,
    left: `${coords.left}px`,
  }
}

const quick = computed(() => {
  const wanted = ['text', 'h2', 'bulletList', 'taskList', 'quote', 'codeBlock']
  return wanted.map(id => items.value.find(i => i.id === id)).filter(Boolean) as SlashMenuItem[]
})

function runItem(item: SlashMenuItem) {
  const { $from } = editor.state.selection
  item.command({ editor, range: { from: $from.pos, to: $from.pos } })
  expanded.value = false
}

let onCompositionStart: () => void
let onCompositionEnd: () => void
let hide: () => void

onMounted(() => {
  hide = () => {
    style.value = null
    expanded.value = false
  }
  onCompositionStart = () => {
    composing = true
    style.value = null
  }
  onCompositionEnd = () => {
    composing = false
    requestAnimationFrame(reposition)
  }
  const dom = editor.view.dom
  editor.on('selectionUpdate', reposition)
  editor.on('focus', reposition)
  editor.on('blur', hide)
  dom.addEventListener('compositionstart', onCompositionStart)
  dom.addEventListener('compositionend', onCompositionEnd)
  window.addEventListener('scroll', hide, true)
})

onBeforeUnmount(() => {
  const dom = editor.view.dom
  editor.off('selectionUpdate', reposition)
  editor.off('focus', reposition)
  editor.off('blur', hide)
  dom.removeEventListener('compositionstart', onCompositionStart)
  dom.removeEventListener('compositionend', onCompositionEnd)
  window.removeEventListener('scroll', hide, true)
})
void ai
</script>

<template>
  <Teleport to="body">
    <div v-if="style" class="tessera-emptyline-toolbar" :style="{ position: 'fixed', ...style }" data-testid="empty-line-toolbar">
      <button
        v-for="item in quick"
        :key="item.id"
        type="button"
        class="tessera-tb-btn"
        :title="item.title"
        @mousedown.prevent
        @click="runItem(item)"
      >
        <template v-if="item.id === 'text'">¶</template>
        <template v-else-if="item.id === 'h2'">H2</template>
        <template v-else-if="item.id === 'bulletList'">•</template>
        <template v-else-if="item.id === 'taskList'">☑</template>
        <template v-else-if="item.id === 'quote'">❝</template>
        <template v-else>&lt;/&gt;</template>
      </button>
      <button
        type="button"
        class="tessera-tb-btn tessera-emptyline-expand"
        :title="t('emptyLineExpand')"
        :data-expanded="expanded"
        @mousedown.prevent
        @click="expanded = !expanded"
      >
        ›
      </button>
      <div v-if="expanded" class="tessera-emptyline-panel" data-testid="empty-line-panel">
        <button v-for="item in items" :key="item.id" type="button" class="tessera-slash-item" @click="runItem(item)">
          <span class="tessera-slash-item-title">{{ item.title }}</span>
          <span class="tessera-slash-item-desc">{{ item.description }}</span>
        </button>
      </div>
    </div>
  </Teleport>
</template>
