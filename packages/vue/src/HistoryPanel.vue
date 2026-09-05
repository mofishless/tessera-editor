<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { diffDocs, diffSummary, getStorageService } from '@tessera-editor/core'
import type { DocSnapshot, BlockDiffEntry } from '@tessera-editor/core'
import { useTesseraContext } from './context'

const { editor, t } = useTesseraContext()
const visible = ref(false)
const snapshots = ref<DocSnapshot[]>([])
const selected = ref<DocSnapshot | null>(null)
const entries = ref<BlockDiffEntry[]>([])
const summary = ref({ added: 0, removed: 0, changed: 0 })

async function refresh() {
  const storage = getStorageService(editor)
  if (!storage) return
  const list = await storage.listSnapshots()
  snapshots.value = [...list].sort((a, b) => b.ts - a.ts)
}

onMounted(() => {
  editor.on('tessera:historyPanel', open)
  editor.on('tessera:snapshotSaved', refresh as never)
})
onBeforeUnmount(() => {
  editor.off('tessera:historyPanel', open)
  editor.off('tessera:snapshotSaved', refresh as never)
})

function open() {
  visible.value = true
  void refresh()
}

function select(snap: DocSnapshot) {
  selected.value = snap
  const result = diffDocs(snap.doc as never, editor.getJSON() as never)
  entries.value = result
  summary.value = diffSummary(result.filter(e => e.kind !== 'unchanged'))
}

function restore(snap: DocSnapshot) {
  if (!window.confirm(t('historyConfirmRestore'))) return
  editor.commands.setContent(snap.doc as never)
  visible.value = false
}

function blockText(entry: BlockDiffEntry): string {
  const walk = (node: unknown): string => {
    if (!node || typeof node !== 'object') return ''
    const n = node as { text?: string; content?: unknown[] }
    return (n.text ?? '') + (n.content ?? []).map(walk).join('')
  }
  return walk(entry.after ?? entry.before).trim().slice(0, 120)
}

function formatTime(ts: number): string {
  const d = new Date(ts)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}
</script>

<template>
  <div v-if="visible" class="tessera-history-panel" data-testid="history-panel">
    <div class="tessera-ask-header">
      <span>{{ t('historyTitle') }}</span>
      <div class="tessera-history-actions">
        <button type="button" @click="editor.commands.captureSnapshot()">{{ t('historyCapture') }}</button>
        <button type="button" @click="visible = false">×</button>
      </div>
    </div>
    <div class="tessera-history-body">
      <div class="tessera-history-list">
        <div v-if="snapshots.length === 0" class="tessera-toc-empty">{{ t('historyEmpty') }}</div>
        <button
          v-for="snap in snapshots"
          :key="snap.id"
          type="button"
          class="tessera-history-item"
          :data-selected="selected?.id === snap.id"
          @click="select(snap)"
        >
          <span class="tessera-history-time">{{ formatTime(snap.ts) }}</span>
          <span v-if="snap.label" class="tessera-history-label">{{ snap.label }}</span>
          <span class="tessera-history-action" @click.stop="restore(snap)">{{ t('historyRestore') }}</span>
        </button>
      </div>
      <div v-if="selected" class="tessera-history-diff">
        <div class="tessera-diff-summary">
          +{{ summary.added }} {{ t('historyDiffAdded') }} · −{{ summary.removed }} {{ t('historyDiffRemoved') }} · ~{{ summary.changed }}
          {{ t('historyDiffChanged') }}
        </div>
        <div
          v-for="(entry, i) in entries.filter(e => e.kind !== 'unchanged').slice(0, 80)"
          :key="entry.id ?? i"
          class="tessera-diff-block"
          :class="`tessera-diff-block--${entry.kind}`"
        >
          <span class="tessera-diff-badge">
            {{ entry.kind === 'added' ? t('historyDiffAdded') : entry.kind === 'removed' ? t('historyDiffRemoved') : t('historyDiffChanged') }}
          </span>
          <span v-if="entry.kind === 'changed' && entry.wordDiff" class="tessera-diff-text">
            <span v-for="(part, j) in entry.wordDiff" :key="j" class="tessera-diff-part" :class="`tessera-diff-part--${part.type}`">
              {{ part.text }}
            </span>
          </span>
          <span v-else class="tessera-diff-text">{{ blockText(entry) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
