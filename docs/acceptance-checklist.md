# Tessera 编辑器验收清单（行为规格）

> 来源：`slite-teardown-prd.md` 第 3.3–3.5 节 + 第 8 章「直接采用」结论。
> 版本标注：**M1**（无 AI 的编辑器地板）、**M2**（AI 骨架）、**v1.1**（表格/评论）、**v1.x**（预留位）。
> 进度标记：✅ = 已实现并通过验证（单测/浏览器实测）；⏳ = 未开始。

## 1. 斜杠菜单

- [x] 行内输入 `/` 呼出全部可插入块（M1）✅
- [x] 继续输入实时过滤（M1）✅
- [x] Return 插入选中项；Esc 关闭（M1）✅（键盘导航 ✅ / Esc ✅）
- [x] 每项右侧显示对应快捷键（M1）✅
- [x] v1 命令集：标题 H1–H4、无序/有序列表、任务清单、引用、分割线、代码块、Hint、折叠块、图片 ✅；M2 增：AI 摘要 / AI 问答 / AI 改写 ✅
- [x] 宿主可通过插件 API 追加/裁剪命令（`SlashMenu.configure({ extraItems })`）✅

## 2. Markdown 触发符

行首 + 空格（M1）：

| 输入 | 结果 | 状态 |
|---|---|---|
| `# ` ~ `#### ` | H1–H4 | ✅（StarterKit） |
| `- ` | 无序列表 | ✅（StarterKit） |
| `1. ` | 有序列表 | ✅（StarterKit） |
| `[] ` | 任务清单 | ✅（自实现 inputRule） |
| `> ` | 引用 | ✅（StarterKit） |
| `---` | 分割线 | ✅（StarterKit） |
| `!! ` | Hint 提示块 | ✅ |
| `>> ` | 折叠块 | ✅ |

行内（M1）：

| 输入 | 结果 | 状态 |
|---|---|---|
| `**bold**` | 加粗 | ✅（StarterKit） |
| `*italic*` | 斜体 | ✅（StarterKit） |
| `~text~` | 删除线 | ✅（StarterKit） |
| `` `code` `` | 行内代码 | ✅（StarterKit） |
| `::highlight::` | 高亮 | ✅（自实现 markInputRule） |
| `:` | emoji 选择器 | ✅ v1.1（过滤 + 键盘/点击插入） |

- [x] **中文/日文 IME 硬门槛**：composition 期间触发符不误发、UI 不闪烁 ✅（M0 实测 + 全 UI 组件 composition 守卫）

## 3. 键盘快捷键（M1）

| 动作 | Mac | Windows | 状态 |
|---|---|---|---|
| Undo / Redo | ⌘Z / ⌘⇧Z | Ctrl Z / Ctrl Y | ✅ |
| 加粗/斜体/下划线 | ⌘B / ⌘I / ⌘U | 同 | ✅ |
| 删除线 | ⌘⇧S | Ctrl ⇧S | ✅ |
| 颜色/高亮面板 | ⌘E | Ctrl E | ✅（事件驱动开面板） |
| H1–H4 | ⌘⇧1..4 | Ctrl ⇧1..4 | ✅ |
| 有序/无序列表 | ⌘⇧7 / ⌘⇧8 | Ctrl ⇧7 / ⇧8 | ✅（实测 Ctrl+Shift+8） |
| 任务清单 | ⌘⇧C | Ctrl ⇧C | ✅ |
| 表格 | ⌘⌥S / ⌘⌥T | Ctrl Alt S / T | ✅（含无表头形态） |
| 行内代码/代码块 | ⌘J / ⌘⇧9 | Ctrl J / ⇧9 | ✅ |
| 引用 / Hint | ⌘⇧> / ⌘⌥H | Ctrl ⇧> / Alt H | ✅（统一为 Mod-Alt-h） |
| 链接 | ⌘K | Ctrl K | ✅（链接面板） |
| 占位符 | ⌘⌥P | Ctrl Alt P | 🚫 已移除（2026-09，产品取舍） |
| 行内评论 | ⌘⌥M | Ctrl Alt M | ✅（评论面板 + 划词 💬） |
| 块上/下移 | ⌥↑/↓ | Alt ↑/↓ | ✅（实测 Alt+↓） |
| 列表缩进 | Tab / ⇧Tab | 同 | ✅（list-keymap） |
| 查找替换 | ⌘F | Ctrl F | ✅（面板 + 高亮/导航/替换） |
| Ask | ⌘⇧K | Ctrl ⇧K | ✅（/ask + 快捷键均开面板） |

## 4. 选区与内联工具栏（M1，Improve 为 M2）

- [x] 划词浮现工具栏 ✅：**Improve（✨）**、加粗、斜体、下划线、删除线、行内代码、文字颜色（8 色 + 默认）、高亮（yellow/blue/green/pink/purple）、链接、转为折叠块、More
- [x] Improve 弹层 ✅：9 预设（一键优化/语法/缩短/简化/语气×2/排版/翻译×2）+ 自定义指令
- [x] More 菜单：Copy as Markdown ✅
- [x] 工具栏不遮挡选区；IME 组合态隐藏 ✅

## 5. 块操作

- [x] 四点手柄：悬停块左侧吸附、按住拖拽排序 ✅（M0 实测 H1 0→6 位）
- [x] 手柄菜单：Copy anchor link、Copy block id、删除 ✅（点击手柄/右键均可唤出）
- [x] **空行工具栏**：光标空行浮现 + `›` 展开全部块 ✅
- [x] 文档级布局 API：页宽配置 ✅（docWidth prop → --te-doc-max-width）

## 6. 图片与附件（M1：图片）

- [x] 粘贴/拖拽/文件选择三入口，经注入 UploadService ✅
- [x] NodeView 悬停调宽 + 左/中/全宽对齐 ✅（代码就位，交互待浏览器复验）
- [x] 多图成画廊（每行 3 张）✅（tesseraGallery 装饰 + CSS，格式不变）

## 7. 撤销/重做与 AI 归因（M1/M2）

- [x] Undo/Redo 完整覆盖用户编辑 ✅
- [x] AI 写回为独立事务 ✅（写回协议单测：一次 undo 回滚整次写回）
- [x] AI 拒绝 = 显式回滚（不依赖 undo）✅（单测：原文还原）
- [x] AI 改动带归因标记（pending 紫 / accepted 点线）✅（实测接受翻转）

## 8. 长文档性能

- [x] 性能量化指标 ✅（getTesseraMetrics：块/词/图表数量 + serializeMs；虚拟化渲染专项仍预留）

## 9. 复制粘贴保真（M1 起作为正式需求）

- [x] 外部粘贴：纯文本/HTML 走 PM 默认清洗；图片粘贴上传 ✅
- [x] Copy as Markdown（选中范围）✅
- [x] Word 源专项清洗规则表 ✅（R1–R7 规则 + 表驱动单测）

## 10. i18n 与主题

- [x] 中英双语，宿主注入 locale，语言包可扩展 ✅
- [x] Slite 风格亮/暗双主题 tokens（CSS variables，宿主可覆盖）✅（暗色主题选择器就位，v1.1 出暗色调色板）

## 11. AI 能力（M2）

- [x] AIRuntime 注入式接口（组件零网络请求）✅
- [x] 划词 Improve：9 预设 + 自定义 prompt，流式写入 + pending 标记 ✅
- [x] /summarize：TL;DR hint 置顶 + 审阅条 ✅（实测：接受翻转）
- [x] /ask：文档问答面板，流式回答 ✅（mock 实测）
- [x] 审阅条 接受/拒绝（显式回滚）✅
- [x] 官方适配器：@tessera-editor/ai-openai（SSE）✅ / @tessera-editor/ai-cli（Node 子进程）✅
- [x] 权威格式 ↔ Markdown 交换（含 Hint/折叠块/任务列表往返）✅（4 个单测）
- [x] 写回协议 getBlocks/modifyRange/appendBlocks/removeBlocks ✅（7 个单测）

## 12. v1.1 能力

- [x] **类型化表格**：7 种列类型（文本/复选框/单选/多选标签/数字/日期/链接）✅；表头 ⌄ 列菜单（类型/升降序/插删列/删列/切换表头/复制 CSV/删表）✅（实测 14 项菜单 + 降序排序）；右键行菜单（上下插行/删行）+ 表格操作 ✅；冻结首列 ✅；值存 cell attrs、元数据存 table.types（HTML 往返单测）✅；明确不做合并单元格与计算 ✅
- [x] ~~持久化版本历史~~ 🚫 已移除（2026-09，产品取舍）：实现已从 preset/绑定/文档中剔除
- [x] **行内评论**：CommentStore/IdentityService 注入 ✅；划词 💬 / ⌘⌥M 评论 ✅（实测：标记→面板线程→解决翻转 data-resolved）；面板按文档序、解决/重开/删除、↑↓ 跳转 ✅
- [x] **Embed**：iframe 沙箱（默认 sandbox="" 零权限，不与 allow-same-origin 组合）✅（实测插入 + URL 应用 + sandbox 属性）
- [x] **TOC**：/outline 目录块，H1–H4 实时大纲 + data-id 锚点平滑滚动 ✅（实测插入 + 条目渲染）
- [x] ~~占位符~~ 🚫 已移除（2026-09，产品取舍）：⌘⌥P 与 /待填人、/待填日期 已删除
- [x] **块右键菜单**：复制锚链接（#block-id）/ 复制块 ID / 删除块；表格上下文含行/表操作 ✅（实测真实块 ID 复制）
