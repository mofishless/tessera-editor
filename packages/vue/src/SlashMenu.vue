<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { SuggestionProps, SuggestionKeyDownProps } from '@tiptap/suggestion'
import type { SlashMenuItem } from '@tessera-editor/core'

const props = defineProps<{
  items: SlashMenuItem[]
  command: (item: SlashMenuItem) => void
  clientRect?: (() => DOMRect | null) | null
  t: (key: string) => string
}>()

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

const groups = computed(() => {
  const map = new Map<string, SlashMenuItem[]>()
  for (const item of props.items) {
    const list = map.get(item.group) ?? []
    list.push(item)
    map.set(item.group, list)
  }
  return [...map.entries()]
})

const groupTitle = (group: string) =>
  group === 'ai' ? props.t('groupAi') : group === 'advanced' ? props.t('groupAdvanced') : props.t('groupBasic')

function onKeyDown({ event }: SuggestionKeyDownProps): boolean {
  if (event.key === 'ArrowDown') {
    selectedIndex.value = (selectedIndex.value + 1) % Math.max(props.items.length, 1)
    return true
  }
  if (event.key === 'ArrowUp') {
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

const flatIndex = (groupIdx: number, itemIdx: number) => {
  let n = 0
  for (let g = 0; g < groupIdx; g++) {
    n += groups.value[g]![1].length
  }
  return n + itemIdx
}

const style = computed(() => {
  if (!rect.value || props.items.length === 0) {
    return { left: '-9999px', top: '-9999px', position: 'fixed' as const }
  }
  const r = rect.value
  const flip = r.bottom + 8 > window.innerHeight
  return {
    position: 'fixed' as const,
    left: `${Math.min(r.left, window.innerWidth - 340)}px`,
    ...(flip
      ? { bottom: `${window.innerHeight - r.top + 8}px` }
      : { top: `${r.bottom + 8}px` }),
    width: '320px',
  }
})
</script>

<template>
  <div class="tessera-slash-menu" :style="style" data-testid="slash-menu">
    <div v-for="[group, groupItems] in groups" :key="group" class="tessera-slash-group">
      <div class="tessera-slash-group-title">{{ groupTitle(group) }}</div>
      <button
        v-for="(item, idx) in groupItems"
        :key="item.id"
        type="button"
        class="tessera-slash-item"
        :data-selected="flatIndex(groups.findIndex(g => g[0] === group), idx) === selectedIndex"
        @mouseenter="selectedIndex = flatIndex(groups.findIndex(g => g[0] === group), idx)"
        @click="command(item)"
      >
        <span class="tessera-slash-item-title">{{ item.title }}</span>
        <span class="tessera-slash-item-desc">{{ item.description }}</span>
        <span v-if="item.shortcut" class="tessera-slash-item-shortcut">{{ item.shortcut }}</span>
      </button>
    </div>
  </div>
</template>
