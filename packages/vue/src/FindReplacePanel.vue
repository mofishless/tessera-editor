<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { findReplaceKey } from '@tessera-editor/core'
import type { FindReplaceState } from '@tessera-editor/core'
import { useTesseraContext } from './context'

const { editor, t } = useTesseraContext()
const visible = ref(false)
const query = ref('')
const replacement = ref('')
const count = ref(0)
const active = ref(0)

function sync() {
  const s = findReplaceKey.getState(editor.state) as FindReplaceState | undefined
  if (!s) return
  visible.value = s.visible
  count.value = s.matches.length
  active.value = s.active
}

onMounted(() => {
  editor.on('tessera:findPanel', open)
  editor.on('transaction', sync)
})
onBeforeUnmount(() => {
  editor.off('tessera:findPanel', open)
  editor.off('transaction', sync)
})

function open() {
  visible.value = true
}

function updateQuery(value: string) {
  query.value = value
  editor.commands.setFindQuery(value)
}
</script>

<template>
  <div v-if="visible" class="tessera-find-panel" data-testid="find-panel">
    <input
      class="tessera-find-input"
      :value="query"
      :placeholder="t('findPlaceholder')"
      @input="updateQuery(($event.target as HTMLInputElement).value)"
      @keydown.enter.prevent="editor.commands.findNext()"
      @keydown.esc.prevent="editor.commands.closeFindPanel()"
    />
    <span class="tessera-find-count">{{ count > 0 ? `${active + 1}/${count}` : '0' }}</span>
    <button type="button" :title="t('findPrev')" @click="editor.commands.findPrev()">↑</button>
    <button type="button" :title="t('findNext')" @click="editor.commands.findNext()">↓</button>
    <input :value="replacement" :placeholder="t('replacePlaceholder')" @input="replacement = ($event.target as HTMLInputElement).value" />
    <button type="button" @click="editor.commands.replaceCurrent(replacement)">{{ t('replaceOne') }}</button>
    <button type="button" @click="editor.commands.replaceAll(replacement)">{{ t('replaceAll') }}</button>
    <button type="button" class="tessera-find-close" :title="t('findClose')" @click="editor.commands.closeFindPanel()">×</button>
  </div>
</template>
