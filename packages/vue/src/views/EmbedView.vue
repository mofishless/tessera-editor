<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { NodeViewWrapper } from '@tiptap/vue-3'
import type { NodeViewProps } from '@tiptap/vue-3'
import { useTesseraContext } from '../context'

const props = defineProps<NodeViewProps>()
const { t } = useTesseraContext()
const url = ref(typeof props.node.attrs.src === 'string' ? props.node.attrs.src : '')

function apply() {
  const next = url.value.trim()
  if (/^https?:\/\/.+/.test(next)) {
    props.updateAttributes({ src: next })
  }
}

// ---- TOC ----
const items = ref<{ id: string; level: number; text: string }[]>([])
</script>

<template>
  <NodeViewWrapper class="tessera-embed" :data-selected="selected">
    <div v-if="!node.attrs.src" class="tessera-embed tessera-embed-empty" :data-selected="selected">
      <input v-model="url" class="tessera-embed-input" :placeholder="t('embedPlaceholder')" contenteditable="false" @keydown.enter.prevent="apply" />
      <button type="button" class="tessera-embed-apply" contenteditable="false" @click="apply">{{ t('embedApply') }}</button>
    </div>
    <template v-else>
      <div class="tessera-embed-frame" :style="{ height: `${node.attrs.height ?? 360}px` }" contenteditable="false">
        <iframe :src="node.attrs.src" :title="node.attrs.title ?? node.attrs.src" sandbox="" referrerpolicy="no-referrer" loading="lazy" />
      </div>
      <a class="tessera-embed-link" :href="node.attrs.src" target="_blank" rel="noreferrer" contenteditable="false">
        {{ t('embedOpen') }} ↗
      </a>
    </template>
  </NodeViewWrapper>
</template>
