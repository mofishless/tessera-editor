<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { findLinkRange, removeLinkRange, saveLinkRange } from '@tessera-editor/core'
import type { TesseraLinkRange } from '@tessera-editor/core'
import { useTesseraContext } from './context'
import { useTesseraPortalRoot } from './portal'

/**
 * Click-to-edit link panel: clicking a link in the document opens a compact
 * editor for its display text and href; 移除链接 degrades it back to plain
 * text. Doc semantics live in core (linkedit.ts) so both bindings match.
 */

const { editor, t } = useTesseraContext()
const portalRoot = useTesseraPortalRoot(editor)
const range = ref<TesseraLinkRange | null>(null)
const text = ref('')
const href = ref('')
const style = ref<Record<string, string>>({})

function openPanel(found: TesseraLinkRange) {
  range.value = found
  text.value = found.text
  href.value = found.href
  const a = editor.view.coordsAtPos(found.from)
  const b = editor.view.coordsAtPos(found.to)
  const left = Math.min(Math.max(8, (a.left + b.left) / 2 - 160), window.innerWidth - 328)
  const bottom = Math.max(a.bottom, b.bottom)
  const panelMax = 170
  const flip = bottom + 8 + panelMax > window.innerHeight && a.top - 8 - panelMax >= 0
  style.value = flip
    ? { left: `${left}px`, bottom: `${window.innerHeight - Math.min(a.top, b.top) + 8}px` }
    : { left: `${left}px`, top: `${bottom + 8}px` }
}

function onEditorClick(e: MouseEvent) {
  const target = e.target as HTMLElement
  const anchor = target.closest('a[href]')
  if (!anchor || !editor.view.dom.contains(target)) {
    range.value = null
    return
  }
  const found = findLinkRange(editor, editor.view.posAtDOM(anchor, 0))
  if (found) openPanel(found)
}

function save() {
  if (!range.value || !text.value.trim()) return
  saveLinkRange(editor, range.value, { text: text.value, href: href.value })
  range.value = null
}

function remove() {
  if (!range.value) return
  removeLinkRange(editor, range.value)
  range.value = null
}

function close() {
  range.value = null
}

onMounted(() => {
  editor.view.dom.addEventListener('click', onEditorClick)
  window.addEventListener('mousedown', close)
})
onBeforeUnmount(() => {
  editor.view.dom.removeEventListener('click', onEditorClick)
  window.removeEventListener('mousedown', close)
})
</script>

<template>
  <Teleport v-if="portalRoot" :to="portalRoot">
    <div v-if="range" class="tessera-link-editor" :style="style" @mousedown.stop>
      <input
        v-model="text"
        autofocus
        :placeholder="t('linkTextPlaceholder')"
        @keydown.enter.prevent="save"
        @keydown.esc="close"
      />
      <input
        v-model="href"
        :placeholder="t('linkPlaceholder')"
        @keydown.enter.prevent="save"
        @keydown.esc="close"
      />
      <div class="tessera-link-editor-row">
        <button type="button" :disabled="!text.trim()" @click="save">{{ t('linkSave') }}</button>
        <button type="button" class="tessera-danger" @click="remove">{{ t('linkRemove') }}</button>
      </div>
    </div>
  </Teleport>
</template>
