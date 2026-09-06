<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { SuggestionProps, SuggestionKeyDownProps } from '@tiptap/suggestion'
import type { EmojiItem } from '@tessera-editor/core'

const props = defineProps<SuggestionProps<EmojiItem>>()

const selectedIndex = ref(0)
const rect = ref<DOMRect | null>(null)

watch(
  () => props.items,
  () => {
    selectedIndex.value = 0
    rect.value = props.clientRect?.() ?? null
  },
  { immediate: true },
)

function onKeyDown({ event }: SuggestionKeyDownProps): boolean {
  if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
    selectedIndex.value = (selectedIndex.value + 1) % Math.max(props.items.length, 1)
    return true
  }
  if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
    selectedIndex.value = (selectedIndex.value - 1 + Math.max(props.items.length, 1)) % Math.max(props.items.length, 1)
    return true
  }
  if (event.key === 'Enter') {
    const item = props.items[selectedIndex.value]
    if (item) {
      props.command(item)
    }
    return true
  }
  return false
}

defineExpose({ onKeyDown })

const menuMax = 264
const style = computed(() => {
  if (!rect.value || props.items.length === 0) {
    return { left: '-9999px', top: '-9999px', position: 'fixed' as const }
  }
  const r = rect.value
  const fitsBelow = r.bottom + 8 + menuMax <= window.innerHeight
  const fitsAbove = r.top - 8 - menuMax >= 0
  const flip = !fitsBelow && fitsAbove
  return {
    left: `${Math.min(r.left, window.innerWidth - 300)}px`,
    ...(flip
      ? { bottom: `${window.innerHeight - r.top + 8}px` }
      : { top: `${Math.min(r.bottom + 8, window.innerHeight - menuMax)}px` }),
  }
})
</script>

<template>
  <div class="tessera-emoji-menu" :style="style" data-testid="emoji-menu">
    <button
      v-for="(item, i) in items"
      :key="item.name"
      type="button"
      class="tessera-emoji-item"
      :title="`:${item.name}:`"
      :data-selected="i === selectedIndex"
      @mouseenter="selectedIndex = i"
      @click="command(item)"
    >
      {{ item.char }}
    </button>
  </div>
</template>
