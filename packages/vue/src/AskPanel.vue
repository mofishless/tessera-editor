<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useTesseraContext } from './context'

const { editor, t, ai } = useTesseraContext()
const visible = ref(false)
const question = ref('')
const answer = ref('')
const thinking = ref(false)
const error = ref<string | null>(null)

onMounted(() => {
  editor.on('tessera:askPanel', open)
})
onBeforeUnmount(() => {
  editor.off('tessera:askPanel', open)
})

function open() {
  visible.value = true
}

async function ask() {
  if (!ai || !question.value.trim()) return
  thinking.value = true
  answer.value = ''
  error.value = null
  try {
    await ai.ask(question.value, { onToken: token => (answer.value += token) })
  } catch (err) {
    error.value = String(err)
  } finally {
    thinking.value = false
  }
}
</script>

<template>
  <div v-if="visible" class="tessera-ask-panel" data-testid="ask-panel">
    <div class="tessera-ask-header">
      <span>{{ t('aiTitle') }}</span>
      <button type="button" @click="visible = false">×</button>
    </div>
    <div v-if="!ai" class="tessera-ask-error">{{ t('aiRuntimeMissing') }}</div>
    <div class="tessera-ask-body">
      <div v-if="answer" class="tessera-ask-answer">{{ answer }}</div>
      <div v-if="thinking" class="tessera-ask-thinking">{{ t('aiThinking') }}</div>
      <div v-if="error" class="tessera-ask-error">{{ error }}</div>
    </div>
    <div class="tessera-ask-input">
      <input v-model="question" :placeholder="t('aiAskPlaceholder')" @keydown.enter.prevent="ask" />
      <button type="button" :disabled="!ai || thinking || !question.trim()" @click="ask">{{ t('aiSend') }}</button>
    </div>
  </div>
</template>
