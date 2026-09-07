# 组件 Props

`@tessera-editor/react` 与 `@tessera-editor/vue` 的 `<Tessera>` 共享同一 props 集（Vue 侧为 camelCase props + `@update` / `@create` 事件）。

| Prop | 类型 | 默认 | 说明 |
|---|---|---|---|
| `content` | `JSONContent \| string` | — | 初始文档（JSON / HTML / Markdown 字符串）；宿主持有持久化，编辑器不回写 |
| `locale` | `'zh-CN' \| 'en-US'` | `'zh-CN'` | 界面语言（全部 UI 文案，语言包可扩展） |
| `upload` | `UploadService` | — | 图片上传服务；注入后启用 粘贴/拖拽//图片 三入口 |
| `comments` | `CommentStore` | — | 评论线程存储；注入后启用行内评论 |
| `identity` | `IdentityService` | — | 当前用户（评论作者署名） |
| `ai` | `AIRuntime` | — | 模型运行时；注入后启用 ✨Improve、/summarize、/ask |

## 事件

| 事件 | 载荷 | 时机 |
|---|---|---|
| `update` | `Editor` | 任意文档变更（`editor.getJSON()` 取权威格式） |
| `create` | `Editor` | 编辑器就绪 |

## 主题

Slite 风格默认主题，全部设计 tokens 走 CSS variables，宿主覆盖 `.tessera-root` 上的变量即可换肤；`data-tessera-theme="dark"` 启用暗色基调。

```css
.tessera-root {
  --te-accent: #0d7a5f; /* 你的品牌色 */
}
```

## 编辑器能力速览

- **输入体系**：斜杠菜单（24+ 项，过滤 + 键盘导航 + 快捷键提示）、Markdown 触发符（`!!` `>>` `[]` `::高亮::` 及全套标准符）、空行工具栏（`›` 展开全块面板）、选中工具栏（格式/颜色/高亮/链接/评论/Improve）
- **块**：段落、H1–H4、三种列表、引用、分割线、行内代码/代码块、Hint（5 变体）、折叠块、图片（调宽/对齐）、类型化表格、沙箱 Embed、目录、占位符
- **快捷键**：⌘⇧1-4 / 7 / 8 / C、⌘J、⌘⇧9、⌘E、⌘K、⌘F、⌘⌥S/T/P/M/H、⌥↑↓、⌘⇧K
- **v1.1**：类型化表格（7 列类型/排序/CSV/冻结首列）、行内评论、链接点击编辑、块右键菜单（锚链接/块 ID/删除）
