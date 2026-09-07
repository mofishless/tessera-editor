# Tessera

**中文** · Tessera 是一个开箱即用（batteries-included）的富文本编辑器组件家族（MIT）：对标 [Slite](https://slite.com) 的编辑体验，内置 AI 交互骨架。产品引入后即获得一致的功能、交互与界面，无需二次开发。

**English** · Tessera is a batteries-included rich-text editor component family (MIT): Slite-grade editing experience with a built-in AI interaction skeleton. Drop it into any product and get consistent features, interactions and UI with zero secondary development.

## Status: v1.0 功能完备（M0 / M1 / M2 / v1.1 / Vue 绑定 / 文档站 / 构建就绪）

**M1（编辑器地板）**：P0 全部块 + Hint/折叠块；输入体系三件套（斜杠菜单 / Markdown 触发符 `!!`·`>>`·`[]`·`::高亮::` / 选中工具栏）；空行工具栏（含 › 展开面板）；全快捷键表；查找替换（⌘F）；图片块（上传服务注入 + NodeView 调宽/对齐）；权威 JSON（稳定块 ID）↔ Markdown 双向转换；i18n 中英双语；Slite 风格主题（单一来源 `@tessera-editor/core/styles.css`）。

**M2（AI 骨架）**：`AIRuntime` 注入式接口；划词 ✨ Improve（9 预设 + 自定义，流式写入）；/summarize；/ask 问答面板；`aiAttribution` 待审标记 + 审阅条接受/拒绝；适配器 `@tessera-editor/ai-openai`（SSE）与 `@tessera-editor/ai-cli`（Node 子进程）。

**v1.1**：
- **类型化表格**（质量重点）：7 种列类型（文本/复选框/单选/多选标签/数字/日期/链接），表头 ⌄ 菜单（类型切换/升降序/插删列/切换表头/复制 CSV/删表），右键行菜单，冻结首列，⌘⌥S/⌘⌥T 建表；不做合并单元格与计算（对标 Slite 教训）
- **行内评论**：`CommentStore`/`IdentityService` 注入；划词 💬 或 ⌘⌥M 评论；面板按文档序列线程、解决/删除、↑↓ 跳转
- **Embed / TOC**：iframe 沙箱嵌入（默认零权限 sandbox）、目录块（H1–H4 实时大纲 + 锚点跳转）
- **块右键菜单**：复制锚链接 / 复制块 ID / 删除块（表格上下文含行列操作）；Ask 快捷键 ⌘⇧K

**v1.0 收尾（本轮）**：
- **`@tessera-editor/vue` Vue 3 绑定**：与 React 绑定完全对等（12 个 SFC：主组件 / provide-inject 上下文 / 斜杠渲染器 / 双工具栏 / 五面板 / 块菜单 / 5 组 NodeView / 核心版拖拽手柄），浏览器实测全绿
- **文档站（VitePress）**：快速开始 / 注入服务 / AI 能力 / 数据格式 / Props 参考，ADR 与验收清单自动编入
- **发布就绪**：6 包可构建（tsup×5 + vue vite-lib + dts），exports 三态（development→src 调试 / dist 发布），元数据齐备；`@tessera` scope 在 npm 未被占用；实际 `npm publish` 待仓库凭据

**验证**：23 个单元测试全绿 + 双 playground（React 5173 / Vue 5174）浏览器实测。

架构与范围见 [docs/product-definition.md](./docs/product-definition.md)，行为验收见 [docs/acceptance-checklist.md](./docs/acceptance-checklist.md)，文档站 `pnpm docs:dev`。

## Packages

| Package | 说明 |
|---|---|
| `@tessera-editor/core` | 框架无关引擎（TipTap 3 之上）：块 schema、输入规则、写回协议、格式层、i18n、主题 CSS（`/styles.css`） |
| `@tessera-editor/react` | React 绑定 + 全套默认 UI |
| `@tessera-editor/vue` | Vue 3 绑定 + 全套默认 UI |
| `@tessera-editor/ai` | AI 交互骨架：AIRuntime 接口、动作（improve/summarize/ask）、审阅协议 |
| `@tessera-editor/ai-openai` / `@tessera-editor/ai-cli` | 官方适配器：OpenAI 兼容 SSE / 本地 CLI Agent（Node/Electron 主进程） |

## Develop

```bash
pnpm install
pnpm dev                    # React playground (5173)
pnpm --filter @tessera-editor/playground-vue dev   # Vue playground (5174)
pnpm docs:dev               # 文档站 (5175)
pnpm build                  # 构建 6 个发布包（dist + dts）
pnpm test                   # 23 个单元测试
```

## License

MIT
