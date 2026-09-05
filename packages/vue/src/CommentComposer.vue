<script setup lang="ts">
import { ref } from 'vue'
import { getCommentStore, getIdentityService } from '@tessera-editor/core'
import type { CommentThread } from '@tessera-editor/core'
import { useTesseraContext } from './context'

const emit = defineEmits<{ (e: 'close'): void }>()
const { editor, t } = useTesseraContext()
const text = ref('')
const quote = editor.state.doc.textBetween(editor.state.selection.from, editor.state.selection.to, ' ')

function uid(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

async function submit() {
  if (!text.value.trim()) return
  const store = getCommentStore(editor)
  if (!store) return
  const identity = getIdentityService(editor)
  const me = identity?.getCurrentUser() ?? { id: 'anonymous', name: 'Anonymous' }
  const thread: CommentThread = {
    id: uid('thread'),
    quote,
    resolved: false,
    createdAt: Date.now(),
    entries: [{ id: uid('c'), authorId: me.id, authorName: me.name, text: text.value.trim(), ts: Date.now() }],
  }
  await store.upsert(thread)
  editor.commands.addCommentThread(thread.id)
  emit('close')
  editor.emit('tessera:commentPanel', {})
}
</script>

<template>
  <div class="tessera-popover tessera-comment-composer" data-testid="comment-composer">
    <div class="tessera-thread-quote">“{{ quote.slice(0, 60) }}{{ quote.length > 60 ? '…' : '' }}”</div>
    <textarea
      v-model="text"
      :placeholder="t('commentPlaceholder')"
      @keydown.enter.prevent="submit"
    />
    <div class="tessera-comment-composer-actions">
      <button type="button" :disabled="!text.trim()" @click="submit">{{ t('commentSend') }}</button>
    </div>
  </div>
</template>
