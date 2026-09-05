<script setup lang="ts">
import { ref } from 'vue'
import { NodeViewWrapper } from '@tiptap/vue-3'
import type { NodeViewProps } from '@tiptap/vue-3'
import { useTesseraContext } from '../context'

const props = defineProps<NodeViewProps>()
const { t } = useTesseraContext()
const imgRef = ref<HTMLImageElement | null>(null)

function startResize(event: PointerEvent) {
  event.preventDefault()
  event.stopPropagation()
  const startX = event.clientX
  const startWidth = imgRef.value?.getBoundingClientRect().width ?? Number(props.node.attrs.width) ?? 400
  const onMove = (e: PointerEvent) => {
    const next = Math.round(Math.max(80, Math.min(startWidth + (e.clientX - startX), 1200)))
    props.updateAttributes({ width: next })
  }
  const onUp = () => {
    window.removeEventListener('pointermove', onMove)
    window.removeEventListener('pointerup', onUp)
  }
  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', onUp)
}

const align = () => String(props.node.attrs.align ?? 'center')
</script>

<template>
  <NodeViewWrapper class="tessera-image" :data-align="align()" :data-selected="selected">
    <div class="tessera-image-frame" :style="node.attrs.width ? { width: `${node.attrs.width}px` } : undefined">
      <img ref="imgRef" :src="node.attrs.src" :alt="node.attrs.alt ?? ''" draggable="false" />
      <div class="tessera-image-resize" title="↔" @pointerdown="startResize" />
    </div>
    <div class="tessera-image-align">
      <button type="button" :title="t('imageAlignLeft')" :data-on="align() === 'left'" @click="updateAttributes({ align: 'left' })">⭰</button>
      <button type="button" :title="t('imageAlignCenter')" :data-on="align() === 'center'" @click="updateAttributes({ align: 'center' })">⭤</button>
      <button type="button" :title="t('imageAlignFull')" :data-on="align() === 'full'" @click="updateAttributes({ align: 'full' })">⭥</button>
    </div>
  </NodeViewWrapper>
</template>
