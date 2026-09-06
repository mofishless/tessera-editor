<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { defaultSlashItems } from '@tessera-editor/core'
import type { SlashMenuItem } from '@tessera-editor/core'
import { useTesseraContext } from './context'
import { useTesseraPortalRoot } from './portal'

const { editor, t, ai } = useTesseraContext()
const style = ref<{ top: string; left: string } | null>(null)
const expanded = ref(false)
const toolbarRef = ref<HTMLElement | null>(null)
const panelRef = ref<HTMLElement | null>(null)
const portalRoot = useTesseraPortalRoot(editor)
const panelPlacement = ref<'bottom' | 'top'>('bottom')
const panelMaxHeight = ref<number | undefined>(undefined)
let composing = false

// Slite-style placement: near the bottom of the viewport the panel opens
// upward and is clamped to the available space instead of spilling past
// the content edge
watch(
  [expanded, style],
  () => {
    const toolbar = toolbarRef.value
    if (!expanded.value || !toolbar) {
      panelPlacement.value = 'bottom'
      panelMaxHeight.value = undefined
      return
    }
    const rect = toolbar.getBoundingClientRect()
    const spaceBelow = window.innerHeight - rect.bottom
    const spaceAbove = rect.top
    const natural = panelRef.value?.offsetHeight ?? 320
    const flip = spaceBelow < natural + 12 && spaceAbove > spaceBelow
    panelPlacement.value = flip ? 'top' : 'bottom'
    const avail = (flip ? spaceAbove : spaceBelow) - 12
    panelMaxHeight.value = avail > 120 && avail < natural ? avail : undefined
  },
  { flush: 'post' },
)

const items = computed(() => defaultSlashItems(t))

function hideAll() {
  style.value = null
  expanded.value = false
  editor.view.dom.removeAttribute('data-toolbar-line')
}

function reposition() {
  const dom = editor.view.dom
  if (composing || !editor.isFocused) {
    style.value = null
    dom.removeAttribute('data-toolbar-line')
    return
  }
  const { $from, empty } = editor.state.selection
  const isEmptyParagraph = empty && $from.parent.type.name === 'paragraph' && $from.parent.content.size === 0
  if (!isEmptyParagraph) {
    hideAll()
    return
  }
  const coords = editor.view.coordsAtPos($from.pos)
  // the toolbar is glued to the anchor line; once that line leaves the
  // visible part of the editor (inner scroll or page scroll) it must go
  const viewRect = dom.getBoundingClientRect()
  if (
    coords.top < Math.max(viewRect.top, 0) - 2 ||
    coords.top > Math.min(viewRect.bottom, window.innerHeight) + 2
  ) {
    hideAll()
    return
  }
  style.value = {
  // Float just ABOVE the empty line so the caret stays visible; the
  // toolbar bottom sits a couple of pixels over the line's top edge.
  top: `${Math.max(2, coords.top - 38)}px`,
    left: `${coords.left}px`,
  }
  // hide the placeholder text while the toolbar owns this line
  dom.setAttribute('data-toolbar-line', 'true')
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
let onScroll: (event: Event) => void

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
  // scroll inside our own panel (its scrollbar) must not close the menu;
  // any other scroll keeps the toolbar glued to the anchor line via
  // reposition (which hides it once the line leaves the viewport)
  onScroll = (event: Event) => {
    const node = toolbarRef.value
    if (node && event.target instanceof Node && node.contains(event.target)) {
      return
    }
    requestAnimationFrame(reposition)
  }
  const dom = editor.view.dom
  editor.on('selectionUpdate', reposition)
  editor.on('focus', reposition)
  editor.on('blur', hide)
  dom.addEventListener('compositionstart', onCompositionStart)
  dom.addEventListener('compositionend', onCompositionEnd)
  window.addEventListener('scroll', onScroll, true)
})

onBeforeUnmount(() => {
  const dom = editor.view.dom
  editor.off('selectionUpdate', reposition)
  editor.off('focus', reposition)
  editor.off('blur', hide)
  dom.removeEventListener('compositionstart', onCompositionStart)
  dom.removeEventListener('compositionend', onCompositionEnd)
  window.removeEventListener('scroll', onScroll, true)
})
void ai
</script>

<template>
  <Teleport v-if="portalRoot" :to="portalRoot">
    <div
      v-if="style"
      ref="toolbarRef"
      class="tessera-emptyline-toolbar"
      :style="{ position: 'fixed', ...style }"
      data-testid="empty-line-toolbar"
    >
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
      <div
        v-if="expanded"
        ref="panelRef"
        class="tessera-emptyline-panel"
        :data-placement="panelPlacement"
        :style="panelMaxHeight ? { maxHeight: `${panelMaxHeight}px` } : undefined"
        data-testid="empty-line-panel"
      >
        <button v-for="item in items" :key="item.id" type="button" class="tessera-slash-item" @click="runItem(item)">
          <span class="tessera-slash-item-title">{{ item.title }}</span>
          <span class="tessera-slash-item-desc">{{ item.description }}</span>
        </button>
      </div>
    </div>
  </Teleport>
</template>
