<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'

/**
 * Popover container that flips above the toolbar when there is not enough
 * room below (Slite-style placement). Measured after mount and again on
 * every toolbar position change (scroll/selection), so the flip applies to
 * the rendered element right after it appears. Extra classes fall through
 * to the root element (single root).
 */
const props = defineProps<{ watchKey?: unknown }>()

const el = ref<HTMLElement | null>(null)
const placement = ref<'bottom' | 'top'>('bottom')
const maxHeight = ref<number | undefined>(undefined)

function measure() {
  const pop = el.value
  const toolbar = pop?.parentElement
  if (!pop || !toolbar) {
    return
  }
  const rect = toolbar.getBoundingClientRect()
  const spaceBelow = window.innerHeight - rect.bottom
  const spaceAbove = rect.top
  const natural = pop.offsetHeight
  const flip = spaceBelow < natural + 12 && spaceAbove > spaceBelow
  placement.value = flip ? 'top' : 'bottom'
  const avail = (flip ? spaceAbove : spaceBelow) - 12
  maxHeight.value = avail > 100 && avail < natural ? avail : undefined
}

onMounted(measure)
watch(() => props.watchKey, measure, { flush: 'post' })
</script>

<template>
  <div
    ref="el"
    class="tessera-popover"
    :data-placement="placement"
    :style="maxHeight ? { maxHeight: `${maxHeight}px`, overflowY: 'auto' } : undefined"
  >
    <slot />
  </div>
</template>
