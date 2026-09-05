<script setup lang="ts">
import type { SuggestionSession } from '@tessera-editor/ai'
import { useTesseraContext } from './context'

defineProps<{ session: SuggestionSession | null }>()
const emit = defineEmits<{ (e: 'clear'): void }>()
const { t } = useTesseraContext()
</script>

<template>
  <div v-if="session" class="tessera-suggestion-bar" data-testid="suggestion-bar">
    <span class="tessera-suggestion-label">✨ {{ t('aiStreaming') }}</span>
    <button
      type="button"
      class="tessera-suggestion-accept"
      @click="session.accept(); emit('clear')"
    >
      {{ t('aiAccept') }}
    </button>
    <button
      type="button"
      class="tessera-suggestion-reject"
      @click="session.reject(); emit('clear')"
    >
      {{ t('aiReject') }}
    </button>
  </div>
</template>
