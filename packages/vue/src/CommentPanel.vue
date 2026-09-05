<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { getCommentStore, getIdentityService, listCommentRanges } from '@tessera-editor/core'
import type { CommentThread } from '@tessera-editor/core'
import { useTesseraContext } from './context'

const { editor, t } = useTesseraContext()
const visible = ref(false)
const threads = ref<(CommentThread & { from: number })[]>([])

async function refresh() {
  const store = getCommentStore(editor)
  if (!store) return
  const all = await store.list()
  const ranges = listCommentRanges(editor.state)
  const views: (CommentThread & { from: number })[] = []
  for (const range of ranges) {
    const thread = all.find(tr => tr.id === range.threadId)
    if (thread) {
      const { ...rest } = thread
      views.push({ ...rest, from: range.from })
    }
  }
  views.sort((a, b) => a.from - b.from)
  threads.value = views
}

onMounted(() => {
  editor.on('tessera:commentPanel', open)
  editor.on('transaction', refresh as never)
})
onBeforeUnmount(() => {
  editor.off('tessera:commentPanel', open)
  editor.off('transaction', refresh as never)
})

function open() {
  visible.value = true
  void refresh()
}

async function toggleResolve(thread: CommentThread & { from: number }) {
  const store = getCommentStore(editor)
  if (!store) return
  const { from: _omit, ...rest } = thread
  void _omit
  await store.upsert({ ...rest, resolved: !thread.resolved })
  editor.commands.setCommentResolved(thread.id, !thread.resolved)
  await refresh()
}

async function removeThread(thread: CommentThread) {
  const store = getCommentStore(editor)
  if (!store) return
  await store.remove(thread.id)
  editor.commands.removeCommentThread(thread.id)
  await refresh()
}

const store = getCommentStore(editor)
const me = getIdentityService(editor)?.getCurrentUser() ?? { id: 'anonymous', name: 'Anonymous' }
</script>

<template>
  <div v-if="visible" class="tessera-comment-panel" data-testid="comment-panel">
    <div class="tessera-ask-header">
      <span>{{ t('commentTitle') }} · {{ threads.filter(x => !x.resolved).length }}</span>
      <div class="tessera-history-actions">
        <button type="button" title="↑" @click="editor.commands.focusNextCommentThread()">↑</button>
        <button type="button" title="↓" @click="editor.commands.focusNextCommentThread()">↓</button>
        <button type="button" @click="visible = false">×</button>
      </div>
    </div>
    <div v-if="!store" class="tessera-ask-error">CommentStore not injected</div>
    <div class="tessera-ask-body">
      <div v-if="threads.length === 0" class="tessera-toc-empty">{{ t('commentEmpty') }}</div>
      <div v-for="thread in threads" :key="thread.id" class="tessera-thread" :class="{ 'tessera-thread--resolved': thread.resolved }">
        <div class="tessera-thread-quote">“{{ thread.quote }}”</div>
        <div v-for="entry in thread.entries" :key="entry.id" class="tessera-thread-entry">
          <span class="tessera-thread-author">{{ entry.authorName }}</span>
          <span class="tessera-thread-text">{{ entry.text }}</span>
        </div>
        <div class="tessera-thread-actions">
          <button type="button" @click="toggleResolve(thread)">
            {{ thread.resolved ? t('commentReopen') : t('commentResolve') }}
          </button>
          <button type="button" class="tessera-danger" @click="removeThread(thread)">{{ t('commentDelete') }}</button>
          <span v-if="thread.resolved" class="tessera-thread-badge">{{ t('commentResolvedBadge') }}</span>
        </div>
      </div>
    </div>
    <div class="tessera-comment-hint">⌘⌥M / 💬 · {{ me.name }}</div>
  </div>
</template>
