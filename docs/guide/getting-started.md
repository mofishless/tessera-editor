# 快速开始

Tessera 是开箱即用的富文本编辑器组件家族：引入即获得与 Slite 一致的编辑体验，宿主通过注入服务持有全部数据与网络策略。

## 安装

```bash
# React 宿主
pnpm add @tessera-editor/react

# Vue 3 宿主
pnpm add @tessera-editor/vue
```

绑定包自带全部默认 UI（斜杠菜单、工具栏、面板、NodeView）；主题样式来自核心包：

```ts
import '@tessera-editor/core/styles.css'
```

## React

```tsx
import { Tessera } from '@tessera-editor/react'
import '@tessera-editor/core/styles.css'

export function Editor() {
  return <Tessera onUpdate={editor => persist(editor.getJSON())} />
}
```

## Vue 3

```vue
<script setup>
import { Tessera } from '@tessera-editor/vue'
import '@tessera-editor/core/styles.css'
</script>

<template>
  <Tessera @update="ed => persist(ed.getJSON())" />
</template>
```

## 注入 AI（可选）

组件自身不发任何网络请求。传入 `ai`（任意 [AIRuntime](/guide/ai) 实现）即可解锁全部 AI 入口：

```tsx
import { createOpenAIRuntime } from '@tessera-editor/ai-openai'

const runtime = createOpenAIRuntime({
  baseUrl: 'https://api.deepseek.com/v1', // 任何 OpenAI 兼容端点
  apiKey: import.meta.env.VITE_KEY,        // 由宿主保管
  model: 'deepseek-chat',
})

<Tessera ai={runtime} />
```

传入后：选中工具栏出现 ✨ Improve（9 预设 + 自定义指令，流式写入）、斜杠菜单出现 AI 分组（/summarize、/ask、AI 改写），AI 产物带紫色待审标记与 接受/拒绝 审阅条。

## 在线演示

```bash
git clone https://github.com/tessera-editor/tessera && cd tessera
pnpm install
pnpm dev          # React playground (5173)
pnpm --filter @tessera-editor/playground-vue dev   # Vue playground (5174)
```
