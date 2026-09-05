<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { docToMarkdown } from '@tessera-editor/core'
import { IMPROVE_PRESETS, improveSelection } from '@tessera-editor/ai'
import type { SuggestionSession } from '@tessera-editor/ai'
import { useTesseraContext } from './context'
import CommentComposer from './CommentComposer.vue'

const emit = defineEmits<{ (e: 'session', s: SuggestionSession | null): void }>()

const { editor, t, locale, ai } = useTesseraContext()
const style = ref<{ top: string; left: string } | null>(null)
const popover = ref<null | 'color' | 'highlight' | 'link' | 'improve' | 'more' | 'comment'>(null)
const linkValue = ref('')
const instruction = ref('')
const busy = ref(false)
const error = ref<string | null>(null)
let composing = false

const TEXT_COLORS = ['#262629', '#d9414f', '#e8912d', '#31a56f', '#2f9ea8', '#4f6df5', '#7a4fd8', '#98a0ab']
const HIGHLIGHT_COLORS = ['#fff2a8', '#d6eaff', '#d3f5df', '#fdd9e7', '#e6dcff']

const chain = () => editor.chain().focus()
const currentColor = computed(() => (editor.getAttributes('textStyle').color as string | undefined) ?? null)

function reposition() {
  if (composing || !editor.isFocused) {
    style.value = null
    return
  }
  const { from, to, empty } = editor.state.selection
  if (empty || !editor.state.doc.textBetween(from, to, ' ').trim()) {
    style.value = null
    return
  }
  const start = editor.view.coordsAtPos(from)
  const end = editor.view.coordsAtPos(to)
  const left = (Math.min(start.left, end.left) + Math.min(Math.max(start.left, end.left), window.innerWidth - 20)) / 2
  style.value = {
    top: `${Math.max(8, start.top - 48)}px`,
    left: `${Math.max(8, Math.min(left, window.innerWidth - 380))}px`,
  }
}

function onSelectionUpdate() {
  if (!editor.state.selection.empty) {
    const existing = editor.getAttributes('link').href
    linkValue.value = typeof existing === 'string' ? existing : ''
  } else {
    popover.value = null
  }
  reposition()
}

function applyLink() {
  if (linkValue.value.trim()) {
    chain().toggleLink({ href: linkValue.value.trim() }).run()
  }
  popover.value = null
}

async function runImprove(presetInstruction?: string) {
  if (!ai) {
    error.value = t('aiRuntimeMissing')
    return
  }
  popover.value = null
  style.value = null
  busy.value = true
  try {
    const session = await improveSelection(editor, ai.runtime, { instruction: presetInstruction })
    emit('session', session)
  } catch (err) {
    error.value = String(err)
  } finally {
    busy.value = false
  }
}

async function copyMarkdown() {
  const { to } = editor.state.selection
  const start = editor.state.selection.$from.before(1)
  const sliced = editor.state.doc.cut(start, to)
  await navigator.clipboard.writeText(docToMarkdown(sliced, editor.state.schema))
  popover.value = null
}

let onCompositionStart: () => void
let onCompositionEnd: () => void
let hide: () => void

onMounted(() => {
  hide = () => {
    style.value = null
    popover.value = null
  }
  onCompositionStart = () => {
    composing = true
    style.value = null
    popover.value = null
  }
  onCompositionEnd = () => {
    composing = false
    requestAnimationFrame(reposition)
  }
  const dom = editor.view.dom
  editor.on('selectionUpdate', onSelectionUpdate)
  editor.on('focus', reposition)
  editor.on('blur', hide)
  dom.addEventListener('compositionstart', onCompositionStart)
  dom.addEventListener('compositionend', onCompositionEnd)
  window.addEventListener('scroll', hide, true)
})

onBeforeUnmount(() => {
  const dom = editor.view.dom
  editor.off('selectionUpdate', onSelectionUpdate)
  editor.off('focus', reposition)
  editor.off('blur', hide)
  dom.removeEventListener('compositionstart', onCompositionStart)
  dom.removeEventListener('compositionend', onCompositionEnd)
  window.removeEventListener('scroll', hide, true)
})
</script>

<template>
  <Teleport to="body">
    <div
      v-if="style"
      class="tessera-selection-toolbar"
      :style="{ position: 'fixed', ...style }"
      data-testid="selection-toolbar"
      @mousedown.prevent
    >
      <button v-if="ai" type="button" class="tessera-tb-btn tessera-tb-ai" :title="t('tooltipImprove')" @click="popover = popover === 'improve' ? null : 'improve'">
        ✨
      </button>
      <button type="button" class="tessera-tb-btn" :data-active="editor.isActive('bold')" :title="t('tooltipBold')" @click="chain().toggleBold().run()"><b>B</b></button>
      <button type="button" class="tessera-tb-btn" :data-active="editor.isActive('italic')" :title="t('tooltipItalic')" @click="chain().toggleItalic().run()"><i>I</i></button>
      <button type="button" class="tessera-tb-btn" :data-active="editor.isActive('underline')" :title="t('tooltipUnderline')" @click="chain().toggleUnderline().run()"><u>U</u></button>
      <button type="button" class="tessera-tb-btn" :data-active="editor.isActive('strike')" :title="t('tooltipStrike')" @click="chain().toggleStrike().run()"><s>S</s></button>
      <button type="button" class="tessera-tb-btn" :data-active="editor.isActive('code')" :title="t('tooltipCode')" @click="chain().toggleCode().run()">&lt;/&gt;</button>
      <button type="button" class="tessera-tb-btn" :data-active="!!currentColor" :title="t('tooltipColor')" @click="popover = popover === 'color' ? null : 'color'">
        <span class="tessera-tb-colorchip" :style="{ background: currentColor ?? '#262629' }" />
      </button>
      <button type="button" class="tessera-tb-btn" :data-active="editor.isActive('highlight')" :title="t('tooltipHighlight')" @click="popover = popover === 'highlight' ? null : 'highlight'">
        <span class="tessera-tb-colorchip" style="background: #fff2a8" />
      </button>
      <button type="button" class="tessera-tb-btn" :data-active="editor.isActive('link')" :title="t('tooltipLink')" @click="popover = popover === 'link' ? null : 'link'">🔗</button>
      <button type="button" class="tessera-tb-btn" :title="t('tooltipCommentV11')" @click="popover = popover === 'comment' ? null : 'comment'">💬</button>
      <button type="button" class="tessera-tb-btn" :title="t('tooltipTurnCollapsible')" @click="chain().insertCollapsible().run()">▸</button>
      <button type="button" class="tessera-tb-btn" :title="t('tooltipMore')" @click="popover = popover === 'more' ? null : 'more'">⋯</button>

      <div v-if="popover === 'color'" class="tessera-popover">
        <button type="button" class="tessera-color-swatch tessera-color-none" :title="t('colorDefault')" @click="chain().unsetColor().run()" />
        <button v-for="color in TEXT_COLORS" :key="color" type="button" class="tessera-color-swatch" :style="{ background: color }" @click="chain().setColor(color).run()" />
      </div>

      <div v-if="popover === 'highlight'" class="tessera-popover">
        <button type="button" class="tessera-color-swatch tessera-color-none" :title="t('highlightNone')" @click="chain().unsetHighlight().run()" />
        <button v-for="color in HIGHLIGHT_COLORS" :key="color" type="button" class="tessera-color-swatch" :style="{ background: color }" @click="chain().toggleHighlight({ color }).run()" />
      </div>

      <div v-if="popover === 'link'" class="tessera-popover tessera-link-popover">
        <input v-model="linkValue" :placeholder="t('linkPlaceholder')" @keydown.enter.prevent="applyLink" />
        <button type="button" @click="applyLink">{{ t('linkApply') }}</button>
        <button v-if="editor.isActive('link')" type="button" class="tessera-danger" @click="chain().unsetLink().run(); popover = null">
          {{ t('linkRemove') }}
        </button>
      </div>

      <div v-if="popover === 'more'" class="tessera-popover tessera-popover-menu">
        <button type="button" @click="copyMarkdown">{{ t('tooltipCopyMarkdown') }}</button>
      </div>

      <div v-if="popover === 'improve'" class="tessera-popover tessera-improve-popover" data-testid="improve-popover">
        <button v-for="preset in IMPROVE_PRESETS" :key="preset.id" type="button" :disabled="busy" @click="runImprove(preset.instruction)">
          {{ locale === 'zh-CN' ? preset.labelZh : preset.labelEn }}
        </button>
        <div class="tessera-improve-custom">
          <input v-model="instruction" :placeholder="t('aiImprovePrompt')" @keydown.enter.prevent="runImprove(instruction.trim())" />
          <button type="button" :disabled="busy || !instruction.trim()" @click="runImprove(instruction.trim())">
            {{ t('aiImproveRun') }}
          </button>
        </div>
        <div v-if="error" class="tessera-popover-error">{{ error }}</div>
      </div>

      <CommentComposer v-if="popover === 'comment'" @close="popover = null" />
    </div>
  </Teleport>
</template>
