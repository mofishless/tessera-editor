# Tessera 产品定义（共识文档）

> 2026-09-05 四轮需求访谈的共识汇总，**待最终确认后作为实施基线**。
> 配套文档：`CONTEXT.md`（术语表）、`docs/adr/`（决策记录）、`docs/acceptance-checklist.md`（行为验收）、`docs/research/editor-baseline-comparison-2026-09.md`（基座调研）。

## 1. 定位

**一句话**：个人开源（MIT）的富文本编辑器组件家族——任何产品引入后即获得与 Slite 同级的编辑体验与 AI 能力，功能、交互、界面保持一致，无需二次开发。

- **使用场景**：公司及外部各产品统一采用的开源依赖；不绑定任何公司资产（ADR-0003）。
- **产品承诺**：开箱即用。headless 核心是多框架复用的内部手段，不是产品形态。

**明确的非目标**：多人实时协同（ADR-0002）、任何后端/云服务、移动端原生、组件内置模型供给（ADR-0001）。

## 2. 宿主与平台

| 项 | 决定 |
|---|---|
| Web | Chrome/Edge evergreen |
| Electron 桌面 | 支持（本地 CLI 调度经主进程，ADR/共识见 §4） |
| 移动端原生 | 不进路线图（移动 Web 可用即可） |
| React 18+ | 一等绑定，M1 起交付 |
| Vue 3 | 一等绑定，v1.0 起交付（core 层自第一天框架无关） |
| i18n | 中英双语，语言包可扩展 |
| 主题 | Slite 风格对齐（非像素复刻，自有 design tokens），亮暗双主题，全 CSS variables |

## 3. 架构分层与包结构（npm scope：`@tessera-editor/*`）

```
@tessera-editor/core        框架无关引擎（TipTap 3.x 之上，ADR-0005）：
                    块 schema、输入规则、写回协议、权威/交换格式、
                    AI 紧凑序列化、i18n、主题 tokens
@tessera-editor/react       React 绑定 + 全套默认 UI（斜杠菜单、选中工具栏、
                    空行工具栏、四点手柄…）
@tessera-editor/vue         Vue 3 绑定（v1.0）
@tessera-editor/ai          AI 交互骨架：AIRuntime 接口、AI Action、流式插入、
                    diff 接受/拒绝、写回协议执行、人/Agent 归因
@tessera-editor/ai-openai   OpenAI-compatible HTTP 适配器（浏览器/Node）
@tessera-editor/ai-cli      本地 CLI 适配器（Node/Electron 主进程；sidecar 接口预留）
@tessera-editor/block-*     可选块包：LaTeX、Mermaid、多栏、Embed…（v1.1+ 按需）
playground          演示与验收环境（M1 起部署 GitHub Pages）
```

**注入服务**（组件只依赖接口，ADR-0001）：`AIRuntime`（M2）、`UploadService`（M1）、`IdentityService`/`CommentStore`（v1.1 评论）。

**插件 API 公开度**：v1.0 只承诺最小公共面（透传 TipTap extension 注册自定义块 + 斜杠命令注册）；完整插件 API 走 `experimental` 命名空间、不带 semver 承诺，v2 转正。

## 4. 数据与格式（ADR-0004）

- **权威格式**：JSON 文档模型 + 稳定块 ID + 归因元数据；宿主按它持久化。
- **交换格式**：Markdown，组件保证双向转换（导入导出、Git 友好、Obsidian 迁移路径）。
- **AI 紧凑序列化**：从权威格式派生的块级 Markdown+XML 混合格式（对标 SliteML 省 token 思路），M2 设计定稿。
- **本地 CLI 调度**：v1 仅 Electron 主进程适配器（`@tessera-editor/ai-cli` 为 Node 包）；`AIRuntime` 为传输无关异步流接口，为 Web 宿主的 sidecar 守护进程预留。

## 5. 里程碑（单人业余节奏）

| 阶段 | 内容 | 验收口径 |
|---|---|---|
| **M0 交互 spike**（1–2 周） | 四点手柄 + 空行工具栏 + `!!`/`>>` 触发符 + IME 测试矩阵最小原型 | 验证最难三件事，跑通即弃 |
| **M1**（2–3 月） | P0 全部块 + Hint/折叠块 + 输入体系三件套 + 权威/交换格式 + UploadService + playground 上线 | acceptance-checklist M1 项 |
| **M2** | AI 骨架（Runtime 接口、流式插入、diff 接受/拒绝、写回协议、归因）+ `ai-openai`/`ai-cli` 两适配器 | acceptance-checklist M2 项 |
| **v1.0** | Vue 3 绑定 + 文档站 + 双语 README，正式发布 | 双绑定 IME 回归通过 |
| **v1.1** | 类型化列表格（质量重点）+ 行内评论（CommentStore/IdentityService）+ Embed/TOC | 对应清单项 |

**块范围三批**：P0 = 段落、H1–H4、有序/无序列表、任务清单、引用、分割线、行内格式全套（颜色/高亮）、行内代码、代码块、链接、图片；P1 = Hint、折叠块（v1 内），轻表格、Embed、TOC（v1.1）；P2 = 可选块包（LaTeX、Mermaid、多栏、Collection 等，需宿主数据服务的做成注入模式）。

## 6. 工程约定

- **发布**：公有 GitHub 仓库 + 公有 npm，MIT（ADR-0003）；changesets 管版本。
- **工具链**：pnpm monorepo；Playwright E2E + IME 回归矩阵为首周基建；core 写回协议单元测试全覆盖。
- **依赖纪律**：TipTap 白名单，CI 禁止 `@tiptap-cloud/*`（ADR-0005）。
- **性能预留**：从第一天按「块 = NodeView 容器」设计，视口外占位懒挂载。

## 7. 风险登记（Top 5）

1. **长文档虚拟化**（高）：三家基座均无现成方案，纯自研——最大技术投入点。
2. **中文 IME 残留点位**（中）：已知 tiptap #6800/#7271/#5584/#6982，第一周建矩阵覆盖。
3. **TipTap 3.x 高频迭代**（低-中）：锁 `~3.31`、季度升级窗口。
4. **单人带宽**（中）：靠里程碑纪律控范围，M0 不通过不铺开。
5. **Slite 交互无公开规范**（中）：M0 spike 先行验证。

## 8. 决策记录索引

| ADR | 决定 |
|---|---|
| [0001](./adr/0001-ai-runtime-injected-by-host.md) | AI Runtime 由宿主注入，组件不发网络请求 |
| [0002](./adr/0002-no-realtime-collaboration.md) | 不做多人实时协同 |
| [0003](./adr/0003-personal-open-source-mit.md) | 个人开源，MIT，公有 GitHub/npm |
| [0004](./adr/0004-json-canonical-markdown-interchange.md) | JSON 权威格式 + Markdown 交换格式 |
| [0005](./adr/0005-tiptap-baseline.md) | 技术基座 TipTap 3.x |
