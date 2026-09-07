<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { NodeViewWrapper } from '@tiptap/vue-3'
import type { NodeViewProps } from '@tiptap/vue-3'
import { useTesseraContext } from '../context'

const props = defineProps<NodeViewProps>()
const { t } = useTesseraContext()
const imgRef = ref<HTMLImageElement | null>(null)
const preview = ref<string | null>(null)
const zoom = ref(1)
const clampZoom = (z: number) => Math.min(8, Math.max(0.2, z))

function onPreviewKey(e: KeyboardEvent) {
  if (e.key === 'Escape') preview.value = null
  else if (e.key === '+' || e.key === '=') zoom.value = clampZoom(zoom.value * 1.25)
  else if (e.key === '-') zoom.value = clampZoom(zoom.value / 1.25)
  else if (e.key === '0') zoom.value = 1
}
// ctrl+wheel needs preventDefault to suppress the browser's own page zoom;
// an element-level wheel listener is non-passive by default
function onLightboxWheel(e: WheelEvent) {
  if (!e.ctrlKey) return
  e.preventDefault()
  zoom.value = clampZoom(zoom.value * (e.deltaY < 0 ? 1.15 : 1 / 1.15))
}
watch(preview, v => {
  if (v) {
    zoom.value = 1
    window.addEventListener('keydown', onPreviewKey)
  } else {
    window.removeEventListener('keydown', onPreviewKey)
  }
})

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

// gallery membership comes from the tesseraGallery decoration attrs
const galleryAttrs = computed(() => {
  for (const deco of props.decorations ?? []) {
    const attrs = (deco as unknown as { type?: { attrs?: Record<string, string> } }).type?.attrs
    if (attrs && 'data-gallery' in attrs) {
      return attrs
    }
  }
  return null
})
</script>

<template>
  <NodeViewWrapper
    class="tessera-image"
    :data-align="align()"
    :data-selected="selected"
    :data-gallery="galleryAttrs ? 'true' : undefined"
    :data-gallery-index="galleryAttrs?.['data-gallery-index']"
    :data-gallery-size="galleryAttrs?.['data-gallery-size']"
  >
    <div class="tessera-image-frame" :style="node.attrs.width ? { width: `${node.attrs.width}px` } : undefined">
      <img
        ref="imgRef"
        :src="node.attrs.src"
        :alt="node.attrs.alt ?? ''"
        draggable="false"
        style="cursor: zoom-in"
        @click.stop="preview = node.attrs.src"
      />
      <div class="tessera-image-resize" title="↔" @pointerdown="startResize" />
    </div>
    <div class="tessera-image-align">
      <button type="button" :title="t('imageAlignLeft')" :data-on="align() === 'left'" @click="updateAttributes({ align: 'left' })">⭰</button>
      <button type="button" :title="t('imageAlignCenter')" :data-on="align() === 'center'" @click="updateAttributes({ align: 'center' })">⭤</button>
      <button type="button" :title="t('imageAlignFull')" :data-on="align() === 'full'" @click="updateAttributes({ align: 'full' })">⭥</button>
    </div>
  </NodeViewWrapper>
  <Teleport to="body">
    <div v-if="preview" class="tessera-lightbox" @click="preview = null" @wheel="onLightboxWheel">
      <img
        :src="preview"
        :alt="node.attrs.alt ?? ''"
        :style="{ transform: `scale(${zoom})` }"
        @click.stop
        @dblclick="zoom = 1"
      />
      <div class="tessera-lightbox-bar" @click.stop>
        <button type="button" :title="t('imageZoomOut')" @click="zoom = clampZoom(zoom / 1.25)">−</button>
        <span class="tessera-lightbox-scale">{{ Math.round(zoom * 100) }}%</span>
        <button type="button" :title="t('imageZoomIn')" @click="zoom = clampZoom(zoom * 1.25)">+</button>
        <button type="button" :title="t('imageZoomReset')" @click="zoom = 1">1:1</button>
        <span class="tessera-lightbox-hint">{{ t('imageZoomHint') }}</span>
      </div>
    </div>
  </Teleport>
</template>
