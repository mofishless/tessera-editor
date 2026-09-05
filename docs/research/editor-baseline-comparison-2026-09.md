# 富文本编辑器底层框架深度对比调研报告（2026-09-05）

> 调研代理产出（46 次工具调用，npm/GitHub API 当日实时核实）。用于 Tessera 技术基座定案。

数据来源：npm registry API、GitHub API（2026-09-05 实时拉取）、官方文档与 issue tracker。所有版本号/许可证/star 数均为当日核实值。

---

## 一、核心事实速览（当日核实）

| | TipTap | BlockNote | Lexical |
|---|---|---|---|
| 最新版本 | **3.31.3**（core/react/vue-3 三包同步） | **0.54.0** | **0.50.0** |
| 许可证 | **MIT**（核心+全部 editor 扩展） | **MPL-2.0**（核心）+ XL 包 **GPL-3.0/商业双许可** | **MIT** |
| GitHub stars | 38,278 | 10,152 | 23,832 |
| 周下载（npm） | @tiptap/core 1,861 万 | @blocknote/core 55 万 | lexical 511 万 |
| 最后提交 | 2026-09-04 | 2026-09-05 | 2026-09-04 |
| 维护方 | Tiptap 公司（德国，GitHub org: ueberdosis），开源核心+付费云平台商业模式 | TypeCellOS 组织，MPL 核心 + XL 订阅（Business $195/月年付） | Meta 官方，月度发布，仍为 0.x |
| 底层引擎 | ProseMirror | ProseMirror + TipTap | 自研（类虚拟 DOM 树 + beforeinput） |

---

## 二、逐项对比（按 10 个调研问题）

### 1. 当前状态与维护
- **TipTap**：3.x 稳定线高频迭代（2025 年 3.0 stable，2026 年 7 月 AI Toolkit beta、8 月 search & replace），商业化公司支撑，社区最大。
- **BlockNote**：0.x 但活跃，2026 年有 FOSDEM 演讲；由 TypeCellOS 维护，XWiki 已将其采纳为下一代编辑器。0.x 意味着 API 仍可能破坏性变更。
- **Lexical**：Meta 官方、月度发布，支撑 Facebook/Instagram 等亿级产品，但**至今仍是 0.x pre-1.0**，每个版本都可能带 deprecations/breaking changes。

### 2. 许可证与付费墙（重点核实项）

**TipTap 精确分界（2026 年现状，与 2.x 时代大不相同）**：
- **MIT 开源（公共 npm，已核实 package.json）**：核心、React/Vue 绑定，以及 3.0 起「Pro→OSS」的扩展——**drag-handle（四点手柄）、unique-id（稳定块 ID）、emoji、math（KaTeX）、file-handler、find-and-replace、details（可折叠块）、collaboration-caret、suggestion（斜杠菜单基础）、bubble-menu（浮动工具栏基础）**等（[3.0 发布公告](https://tiptap.dev/blog/release-notes/tiptap-3-0-is-stable)、[GitHub packages 目录](https://github.com/ueberdosis/tiptap/tree/main/packages)，`@tiptap/extension-unique-id@3.30.3 license: MIT` 已实测）。
- **付费（平台/订阅）**：云文档与协同基础设施（snapshots、awareness/presence）、**React UI "Pro components" 与 Notion 风格模板**（Start 档 $49–59/月起）、**AI Toolkit 服务器端服务**（add-on；注意 `@tiptap/ai-toolkit` npm 包本身是 MIT，但它只是连接付费服务的客户端 SDK——package.json 描述明示"SDK for connecting to the Server AI Toolkit service"）、**Tracked Changes**（add-on）、DOCX/Markdown 云转换、评论、分页/页眉页脚（Page Layout beta）（[定价页](https://tiptap.dev/pricing)、[功能对比页](https://tiptap.dev/feature-comparison)）。
- **结论：10 条硬性需求没有一条撞 TipTap 付费墙**——因为要自建全部 UI、模型由宿主注入、不做协同。

**BlockNote**：核心 MPL-2.0（允许闭源商用，copyleft 仅限被修改的文件）；但 **XL 包在闭源场景需商业许可**——npm 上实测 `@blocknote/xl-ai@0.54.0` 与 `@blocknote/xl-multi-column@0.54.0` 许可证均为 `GPL-3.0 OR PROPRIETARY`。**即「多栏布局」和「官方 AI 集成」直接撞付费墙**（Business $195/月年付，一个 license 只覆盖一个应用）（[定价](https://www.blocknotejs.org/pricing)、[XL 商业许可](https://www.blocknotejs.org/legal/blocknote-xl-commercial-license)）。

**Lexical**：纯 MIT，无付费组件。风险在 0.x 稳定性而非许可。

### 3. 框架支持（React + Vue 双官方是硬需求）
- **TipTap**：`@tiptap/react` 与 `@tiptap/vue-3` 均 3.31.3、版本严格同步、MIT——**唯一双官方一等支持的候选**（[Vue 3 安装文档](https://tiptap.dev/docs/editor/getting-started/install/vue3)）。
- **BlockNote**：**官方 React-only**；可用 vanilla JS 无头路径，Vue 只能靠社区桥接（[damengshu/blocknote-vue](https://github.com/damengshu/blocknote-vue)，非官方）。对「Vue 3 高质量支持」这条硬需求是结构性缺口。
- **Lexical**：官方只有 React 绑定；Vue 靠社区 `lexical-vue`（wobsoriano，**0.0.8-beta.x，beta 阶段，issue 积压**）（[npm](https://www.npmjs.com/package/lexical-vue)、[GitHub](https://github.com/wobsoriano/lexical-vue)）。

### 4. Headless 程度与 UI 可控性
- **TipTap**：天生 headless。bubble-menu/floating-menu/suggestion 只是插件原语，全部 UI 自绘；复刻 Slite 式「空行工具栏、斜杠菜单、选中浮动栏、四点手柄」都是标准玩法（suggestion + 自定义 React/Vue 渲染器）。
- **BlockNote**：开箱即用型，UI 定制有五层深度（CSS 变量→CSS 覆盖→shadCN 组件替换→完全自定义组件→vanilla 无 UI），文档完善。**天花板在于**：默认交互范式是 Notion 式（侧边加号菜单+拖拽手柄），要改成 Slite 式空行工具栏，等于关掉并重写它的招牌交互层——可行但持续与框架默认值对抗；且所有自定义 UI 组件仍是 React 组件，Vue 侧无解。
- **Lexical**：核心完全 headless，UI 层理论可控性最高；代价是一切从零造（无 bubble menu/suggestion 这类现成原语），且官方插件全是 React。

### 5. 自定义输入规则（`!!`→提示块、`>>`→折叠块）
- **TipTap**：`nodeInputRule`/`textInputRule` 一行正则接一个 Node，`!!`、`>>` 属常规操作；官方有自定义扩展教程。
- **Lexical**：通过自定义 `ElementTransformer`/`TextMatchTransformer` 挂进 `MarkdownShortcutPlugin`，官方支持。能力等价，但文档密度和示例量低于 TipTap。
- **BlockNote**：自定义块可配 `aliases`（斜杠菜单）和默认触发符；非标准触发符需下钻到其内部 ProseMirror 层，偏离其抽象。

### 6. 块级操作 API（对标 SliteML modifyRange/appendBlocks/removeBlocks）
- **BlockNote 最接近**：每块默认有稳定 `id`，`insertBlocks / updateBlock / removeBlocks / replaceBlocks / moveBlocks` 成套 API——就是 SliteML 式模型的原生形态。
- **TipTap**：`@tiptap/extension-unique-id`（MIT）给块稳定 ID；`@tiptap/extension-node-range` 提供节点范围操作原语；加上 ProseMirror transaction API，可自封装出 `modifyRange/appendBlocks/removeBlocks` 语义——**需要一层自研薄封装，但原语齐全**。
- **Lexical**：Node 有 key（重建文档时 key 会重生成，持久化需自存 ID）；完备但同样要自封装。

### 7. AI 场景适配（流式 token、diff decoration、接受/拒绝、归因）
- **TipTap/ProseMirror 生态最成熟**：
  - 流式插入：`insertContent` 逐 chunk + 单 transaction 合并，社区标准模式；
  - diff 高亮：ProseMirror Decoration 是业内验证过的机制，有开源参考实现：[tiptap-track-changes](https://github.com/sungkhum/tiptap-track-changes)、[tiptap-diff-suggestions](https://github.com/bsachnthana/tiptap-diff-suggestions)、[Liveblocks AI copilot 教程](https://liveblocks.io/blog/building-an-ai-copilot-inside-your-tiptap-text-editor)（流式+diff 高亮+工具调用全流程）；
  - 官方付费 AI Toolkit 与本项目无关（宿主注入模型 + OSS 模式即可）；
  - 归因：unique-id + marks/attrs 自定义元数据。
- **Lexical**：无官方 AI 包，社区实践仅讨论级（[lexical#5967](https://github.com/facebook/lexical/discussions/5967)），模式全部自研。
- **BlockNote**：块级 AI API 形态最像 SliteML，但在 xl-ai 付费包内。

### 8. 中文 IME（硬门槛）
没有零问题的候选，但问题性质不同（issue 计数为 2026-09-05 实测）：
- **Lexical**：IME 相关 issue 36 个，**仍有 open 的近期问题**：[#8834](https://github.com/facebook/lexical/issues/8834)、[#8098](https://github.com/facebook/lexical/issues/8098)、[#8596](https://github.com/facebook/lexical/issues/8596)。其 beforeinput 架构在 CJK 边界案例上长尾最多。
- **TipTap（PM 系）**：引擎级 composition 处理扎实，上层仍有具体中文 issue：[#6800](https://github.com/ueberdosis/tiptap/issues/6800)、[#7271](https://github.com/ueberdosis/tiptap/issues/7271)、[#5584](https://github.com/ueberdosis/tiptap/issues/5584)、[#6982](https://github.com/ueberdosis/tiptap/issues/6982)（Vue MarkView）。多为插件/NodeView 层而非引擎层。
- **BlockNote**：IME issue 共 7 个且大多已修复关闭，仅 1 个 open（[#2731](https://github.com/TypeCellOS/BlockNote/issues/2731)）——同样是 PM 引擎红利。
- **必须做的动作**：无论选谁，建立中文拼音/注音/日文 IME 自动化回归集。

### 9. 长文档性能 / 虚拟化
- **没有任何一家提供原生虚拟化**（共同真相）：[PM 作者声明](https://discuss.prosemirror.net/t/how-to-handle-thousands-of-editor-instances-on-screen/8096)、[lexical#7422](https://github.com/facebook/lexical/issues/7422)。
- **TipTap/PM 实战路径最丰富**：Tiptap 2.5 专项性能优化（为 Anthropic Claude 做，[HN 讨论](https://news.ycombinator.com/item?id=41036078)）、官方性能指南、企业版 20 万词声明；社区方案：分章节多实例 + offset mapping、NodeView 级懒挂载（[discussion #7273](https://github.com/ueberdosis/tiptap/discussions/7273)、[论坛](https://discuss.prosemirror.net/t/virtual-scroll-for-prosemirror/8882)）。
- **结论**：惰性渲染可行但属自研工程；TipTap 的 NodeView 机制是三家中最顺手的挂载点。

### 10. 表格能力（v1.1 质量重点，带类型化列）
- **prosemirror-tables（TipTap 内置表格引擎）最成熟**：CellSelection 矩形选区、rowspan/colspan、多种列宽 resize、`tableNodes()` 自定义 schema（**类型化列 = 自定义列 attrs + 列级校验，官方支持路径**）。
- **Lexical @lexical/table 最弱**：列宽调整长期补丁状态（[#4440](https://github.com/facebook/lexical/issues/4440)、[#7007](https://github.com/facebook/lexical/issues/7007)）。

### 外围候选速览
| | 结论 |
|---|---|
| **Milkdown**（11.9K stars，已转 MIT，活跃） | PM 系、插件化、markdown-first；可作架构参考，默认 UI 与自建设计系统目标重叠度低 |
| **Novel**（16.4K stars） | 2025-01 后无提交，实质停滞，排除 |
| **Plate**（16.5K stars，MIT，活跃） | Slate 系、React-only，排除 |
| **Remirror**（3K stars） | 动能低，排除 |
| **Slate**（31.8K stars，MIT） | 核心与 React 深绑、IME 口碑一般，排除 |

注：Slite 自身技术栈与「SliteML」无公开工程资料，**未核实**。

---

## 三、对比矩阵

| 维度 | TipTap | BlockNote | Lexical |
|---|---|---|---|
| 版本/成熟度 | 3.31.3，稳定高频 | 0.54.0，活跃但 0.x | 0.50.0，月更但 pre-1.0 |
| 许可证 | MIT（全需求免付费墙） | MPL-2.0 核心；多栏/AI = XL 付费 | MIT |
| React 支持 | 官方一等 | 官方一等 | 官方一等 |
| **Vue 3 支持** | **官方一等（版本同步）** | 无（社区桥） | 社区 beta |
| Headless/UI 可控 | 天生 headless，原语齐全 | 五层可定制，但默认交互需对抗 | 完全 headless，插件全 React |
| 自定义输入规则 | nodeInputRule，最便捷 | 需下钻 PM 层 | 自定义 Transformer，可行 |
| 稳定块 ID | unique-id（MIT） | 原生每块必有 id | node key（持久化需自存） |
| 块级批量 API | 原语全，需薄封装 | 成套现成（最像 SliteML） | 完备需自封装 |
| AI 流式+diff 生态 | OSS 模式+范例最多 | 官方 AI 在付费墙内 | 仅社区讨论级 |
| 中文 IME | 引擎强，上层少量 issue | 同引擎，历史 issue 基本清零 | issue 最多（36 个），有 open 边界 bug |
| 长文档 | 无原生虚拟化，实战路径最多 | 同 PM，无特别设施 | 无虚拟化，无先例 |
| 表格 | prosemirror-tables 最成熟 | 基于 PM + 现 UI | 最弱 |
| i18n | 自建 UI 自控 | 核心内置 localization | 无 UI 层，全自控 |

---

## 四、推荐结论

### 首选：TipTap（3.x）

10 条硬性需求逐条通过（详见矩阵）：唯一 React+Vue 双官方支持；headless 无 UI 掣肘；30 种块所需扩展（details/math/drag-handle/unique-id）全 MIT；AI 流式+diff+归因 OSS 参考最多；无协同正好避开其全部付费区；PM 引擎 IME 底子最稳；长文档实战证据最充分；prosemirror-tables 支撑类型化列；MIT 对开源发布与闭源宿主集成零义务。

### 备选：BlockNote（0.54）

仅当战略收缩为「React-only 且接受采购 XL」时重启评估。当前需求集下三处硬伤：Vue 官方缺位、多栏与 AI 撞 XL 商业许可、深度换交互范式要持续对抗其默认设计。

### 不推荐：Lexical

Vue 仅社区 beta、IME open bug 最多、长文档无先例、表格最弱、AI 无生态、0.x 破坏性变更风险——每项都在硬性需求上失分。

---

## 五、风险清单（选 TipTap 后）

1. **付费墙纪律（中）**：锁定依赖白名单（仅 `@tiptap/*` 公共 npm MIT 包），CI 校验不引入 `@tiptap-cloud/*` 或私有 registry 依赖；自研 diff 以 tiptap-track-changes、tiptap-diff-suggestions、Liveblocks 教程为起点。
2. **Vue 二等公民感（中）**：Vue 侧 UI 全走自建组件；编辑器核心与 UI 组件分层，React/Vue 各一套薄渲染层；Vue 层单列 IME 回归（注意 #6982）。
3. **中文 IME 残留点位（中）**：立项第一周搭建 IME 自动化测试矩阵（拼音/注音/日文 × Chrome/Safari/Electron），#6800/#7271/#5584/#6982 全部纳入用例；Safari 相关在 Electron（Chromium）下天然规避。
4. **长文档虚拟化是自研工程（高，最大技术投入点）**：从第一天按「块 = NodeView 容器」设计，视口外块占位高度 + 懒挂载；超长文档评估分实例 + offset mapping；设性能预算测试。
5. **3.x 高频迭代（低-中）**：锁 `~3.31`，季度升级窗口。
6. **块级 SliteML 式 API 需自封装（低）**：unique-id + node-range + transaction 原语齐全，自封一层并处理 ID 稳定性与 undo 分组（AI 写入合入单一 undo step）。
7. **Slite 交互基线无公开规范**：先用 TipTap 做交互 spike 验证四点手柄+空行工具栏+diff 审阅原型，再全面铺开。
8. **Electron 特有**：iframe 沙箱 Embed 注意 CSP 与 webview 策略；剪贴板/原生菜单自行处理。

---

## 六、来源清单

**TipTap**：[3.0 Stable 公告](https://tiptap.dev/blog/release-notes/tiptap-3-0-is-stable) ｜ [Release Notes](https://tiptap.dev/blog/release-notes) ｜ [GitHub](https://github.com/ueberdosis/tiptap) ｜ [定价](https://tiptap.dev/pricing) ｜ [功能对比](https://tiptap.dev/feature-comparison) ｜ [Vue 3 文档](https://tiptap.dev/docs/editor/getting-started/install/vue3) ｜ [性能指南](https://tiptap.dev/docs/guides/performance) ｜ [Enterprise](https://tiptap.dev/enterprise) ｜ [虚拟化讨论 #7273](https://github.com/ueberdosis/tiptap/discussions/7273) ｜ [Claude 性能优化 HN](https://news.ycombinator.com/item?id=41036078) ｜ [Liveblocks 教程](https://liveblocks.io/blog/building-an-ai-copilot-inside-your-tiptap-text-editor) ｜ [tiptap-track-changes](https://github.com/sungkhum/tiptap-track-changes) ｜ [tiptap-diff-suggestions](https://github.com/bsachinthana/tiptap-diff-suggestions) ｜ IME：[#6800](https://github.com/ueberdosis/tiptap/issues/6800) [#7271](https://github.com/ueberdosis/tiptap/issues/7271) [#5584](https://github.com/ueberdosis/tiptap/issues/5584) [#6982](https://github.com/ueberdosis/tiptap/issues/6982)

**BlockNote**：[官网](https://www.blocknotejs.org/) ｜ [GitHub](https://github.com/TypeCellOS/BlockNote) ｜ [定价](https://www.blocknotejs.org/pricing) ｜ [XL 商业许可](https://www.blocknotejs.org/legal/blocknote-xl-commercial-license) ｜ [Editor Setup](https://www.blocknotejs.org/docs/getting-started/editor-setup) ｜ [Manipulating Blocks](https://www.blocknotejs.org/docs/manipulating-blocks) ｜ [UI Components](https://www.blocknotejs.org/docs/react/components) ｜ [表格](https://www.blocknotejs.org/docs/features/blocks/tables) ｜ [社区 Vue 桥](https://github.com/damengshu/blocknote-vue)

**Lexical**：[官网](https://lexical.dev/) ｜ [Releases](https://github.com/facebook/lexical/releases) ｜ [lexical-vue](https://github.com/wobsoriano/lexical-vue) ｜ [#7422](https://github.com/facebook/lexical/issues/7422) ｜ [#4440](https://github.com/facebook/lexical/issues/4440) ｜ [lexical-markdown](https://lexical.dev/docs/packages/lexical-markdown) ｜ IME：[#8834](https://github.com/facebook/lexical/issues/8834) [#8098](https://github.com/facebook/lexical/issues/8098) [#8596](https://github.com/facebook/lexical/issues/8596) ｜ [AI 讨论 #5967](https://github.com/facebook/lexical/discussions/5967)

**通用**：[prosemirror-tables](https://github.com/ProseMirror/prosemirror-tables) ｜ [PM 无虚拟化声明](https://discuss.prosemirror.net/t/how-to-handle-thousands-of-editor-instances-on-screen/8096) ｜ [PM 虚拟滚动](https://discuss.prosemirror.net/t/virtual-scroll-for-prosemirror/8882) ｜ [PM vs Lexical](https://discuss.prosemirror.net/t/differences-between-prosemirror-and-lexical/4557) ｜ [压测对比](https://emergence-engineering.com/blog/lexical-prosemirror-comparison)

**未核实项**：Slite 内部技术栈及 SliteML 无公开资料；`@tiptap/extension-drag-handle-vue` 的 npm 发布形态（源码在 MIT monorepo 中，该具体包名未在公共 npm 检索到，Vue 手柄可能需从 `extension-drag-handle` 自适配）。
