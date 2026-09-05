<script setup lang="ts">
import { computed, ref, shallowRef } from 'vue'
import type { Editor } from '@tiptap/vue-3'
import { Tessera } from '@tessera-editor/vue'
import type { TesseraLocale, UploadService, StorageService, CommentStore } from '@tessera-editor/core'
import type { AIRuntime } from '@tessera-editor/ai'
import { createMockRuntime } from './mockRuntime'
import { createLocalStorage, createMemoryComments, demoIdentity } from './services'
import { initialDoc } from './doc'

const locale = ref<TesseraLocale>('zh-CN')
const aiSource = ref<'mock' | 'off'>('mock')
const editorRef = shallowRef<Editor | null>(null)
const docSize = ref(0)

const runtime = computed<AIRuntime | undefined>(() => (aiSource.value === 'mock' ? createMockRuntime() : undefined))

const storage: StorageService = createLocalStorage()
const comments: CommentStore = createMemoryComments()

const mockUpload: UploadService = {
  uploadImage: file =>
    new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve({ url: String(reader.result), name: (file as File).name, mime: file.type })
      reader.onerror = () => reject(reader.error)
      reader.readAsDataURL(file)
    }),
}

function openPanel(event: 'tessera:historyPanel' | 'tessera:commentPanel') {
  editorRef.value?.emit(event, {})
}

function onEditorCreate(ed: import('@tiptap/core').Editor) {
  editorRef.value = ed as unknown as Editor
  ;(window as unknown as Record<string, unknown>).__tessera = ed
}
</script>

<template>
  <div class="page">
    <header class="page-header">
      <div class="logo">
        <span class="logo-mark">A</span>
        <span class="logo-name">Tessera</span>
      </div>
      <div class="sub">Vue 3 绑定 · TipTap 3.31 · 与 React 绑定共用 @tessera-editor/core</div>
      <div class="header-actions">
        <button type="button" @click="locale = locale === 'zh-CN' ? 'en-US' : 'zh-CN'">
          {{ locale === 'zh-CN' ? 'EN' : '中文' }}
        </button>
        <select v-model="aiSource">
          <option value="mock">AI: mock</option>
          <option value="off">AI: 关闭</option>
        </select>
      </div>
    </header>

    <main class="page-main">
      <div class="doc-card">
        <Tessera
          :key="`${locale}-${aiSource}`"
          :locale="locale"
          :content="initialDoc"
          :upload="mockUpload"
          :storage="storage"
          :comments="comments"
          :identity="demoIdentity"
          :history-idle-ms="90000"
          :ai="runtime"
          @create="onEditorCreate"
          @update="ed => (docSize = JSON.stringify(ed.getJSON()).length)"
        />
      </div>
      <aside class="checklist">
        <h3>Vue 绑定验证</h3>
        <ul>
          <li>与 React 绑定共用：core 预设 / AI 骨架 / 主题 CSS</li>
          <li>斜杠菜单、空行/选中工具栏、IME 守卫</li>
          <li>类型化表格（表头 ⌄ 菜单 + 类型化单元格）</li>
          <li>版本历史（diff + 恢复）、行内评论</li>
          <li>Embed / TOC / 占位符、块右键菜单</li>
          <li>AI：划词 ✨ Improve、/summarize、/ask + 审阅条</li>
        </ul>
        <div class="md-tools">
          <button type="button" @click="openPanel('tessera:historyPanel')">版本历史</button>
          <button type="button" @click="openPanel('tessera:commentPanel')">评论</button>
        </div>
        <p class="meta">权威 JSON 大小：{{ docSize || '—' }} 字符</p>
      </aside>
    </main>
  </div>
</template>
