# 数据与格式

## 权威格式（canonical）与交换格式（interchange）

**权威格式是 JSON 文档模型**（ADR-0004）：块 ID、归因、表格列类型、评论锚点等结构信息只有 JSON 能完整承载，宿主按它持久化。

**Markdown 是交换格式**，由 `@tessera-editor/core` 保证双向转换：

```ts
import { docToMarkdown, markdownToDoc } from '@tessera-editor/core'

const md = docToMarkdown(editor.state.doc, editor.state.schema)
const json = markdownToDoc(md, editor.state.schema)  // 需 DOM（浏览器/jsdom）
```

转换规则：

- 标准块 ↔ 纯 Markdown；任务列表 ↔ GFM `- [x]`
- 结构块（Hint / 折叠块 / 表格 / Embed）↔ 语义 HTML（round-trip 无损，外部可读）
- 已知取舍：文字颜色与 AI 归因 mark 不进 Markdown（JSON-only），以透明透传保证导出不抛错

## 稳定块 ID

`UniqueID` 扩展为所有顶层块及关键容器赋予稳定 `id`（UUID）。它同时是：

- **写回协议**的定位基准
- **锚链接**目标（`#block-{id}`，块右键「复制锚链接」）
- **版本历史 diff** 的块对齐键
- 目录（TOC）跳转目标（`[data-id]`）

## 写回协议

AI 与宿主代码通过块 ID 增量修改文档，而非整篇重写（对标 SliteML 的 modifyRange/appendBlocks/removeBlocks）：

```ts
import { getTopLevelBlocks, appendBlocks, modifyRange, removeBlocks } from '@tessera-editor/core'

const blocks = getTopLevelBlocks(editor)         // [{id, type, pos, node}]
appendBlocks(editor, { content: [json], afterId: blocks.at(-1).id })
modifyRange(editor, { fromId, toId, content: [json] })   // 闭区间替换，单事务
removeBlocks(editor, [id1, id2])
```

每次写回是**单事务 = 单 undo 步**；新块自带新鲜 ID（不依赖追加事务补号）。

## 版本历史数据

快照即权威 JSON 全量 + 时间戳 + 可选标签（见 [注入服务](/guide/services)）。diff 由 `diffDocs(before, after)` 计算：块级按 ID 对齐（LCS），变更块内做词级 LCS，面板渲染红绿标注。
