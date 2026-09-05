# Slite 产品拆解 PRD（2026-09 版）

> **文档性质**：竞品拆解型 PRD——以"需求规格"的写法描述 Slite（2026 年 9 月线上版本）的产品结构、功能与交互，作为自研文档工具的基线参考。
> **资料来源**：Slite 官网、官方帮助中心（slite.com/help，逐篇核实）、官方更新日志（slite.com/changelog）、G2/Capterra 评论。文中以内联链接标注出处；官方未文档化的交互在 [第 9 章](#9-官方未文档化事项汇总)集中列出，未经证实的内容不写入规格。
> **重点**：第 3 章富文本编辑器为本文档核心，篇幅占比约 60%。

---

## 1. 产品概述

### 1.1 定位与目标用户

- **一句话定位**（官网 2026-09 主标题）："The self-maintaining AI knowledge base"——自维护的 AI 知识库：与工具同步、由团队验证、被依赖它的每个 Agent 信任。来源：[slite.com](https://slite.com/)
- **三大卖点**：保持准确（Keep accurate）/ 捕获知识（Capture knowledge）/ 找到答案（Find answers）。
- **目标客户**：初创与成长型团队；按职能提供 IT&Ops、产研、客服、HR、销售五类方案。官网称 1,700+ 企业客户。
- **演进史（影响产品理解）**：Slite 早期（2019-2020）定位"结构化团队 wiki"，以 Decision/Procedure 等结构化块为卖点；2024-11 起转向 AI（独立搜索产品 Super），**2026-06-10 发布 all-new Slite 与 Slite Agent，Super 并入主产品**，定位升级为"第一个自维护知识库"。来源：[官方公告](https://slite.com/blog/slite-announcing-self-maintaining-knowledge-base)、[Changelog](https://slite.com/changelog)

### 1.2 公司与商业模式

- 独立运营（巴黎，2016 年创立，孵化自 eFounders/Hexa），未收购；总融资 $15.5M（种子 $4.4M Index 领投、A 轮 $11M Spark Capital 领投）。
- **定价**（[slite.com/pricing](https://slite.com/pricing)，年付口径，**免费版已取消**，仅 14 天全功能试用）：

| 项目 | Basic $10/人/月 | Pro $20/人/月 | Enterprise 定制 |
|---|---|---|---|
| 定位 | 写、组织、验证文档 | Agent 驱动、与工具同步 | 高级安全与支持 |
| Ask（AI 问答） | 仅 Slite 文档内，30 问/席/月 | 跨 20+ 连接工具 | 同 Pro |
| AI 写作助手 | 30 次/月/人 | 无限 | 无限 |
| Slite Agent / 漂移检测 / Agent workflows | 无 | 有 | 有 |
| AI credits | 不含 | 50/席/月（共享池，可 $10/100 加购） | 50/席/月起 |
| 文档验证 / owner / 知识管理面板 | 有 | 有 | 有 |
| 公开分享 / 嵌入 / MCP / API | 有 | 有 | 有 |
| OpenID SSO / 自定义域名 | 无 | 有 | 有 |
| Reader 只读席位 / SCIM / 审计 / SOC 2 / HIPAA | — | — | Enterprise |

### 1.3 平台

- Web 全功能；**桌面端** Mac/Windows（2026-07 起支持文档标签页、拖出并排、Windows Snap、Alt+Space 全局唤起 Agent）。
- 移动端 iOS/Android 原生 App + 移动 Web 完整版。
- 浏览器扩展三件：Draft（新标签页速记）、Ask（工具栏问答）、Agent（任意网页侧栏唤起）。

---

## 2. 信息架构与权限

### 2.1 内容层级

- **Workspace → Channels → Docs → Subdocs**（子文档可继续嵌套）。Channel 即顶层分区；**每篇内容都是 doc，包括 channel 本身**——doc 拖到侧栏顶层即"升级"为 channel，反之亦然。来源：[Channels and Docs](https://slite.com/help/tjL2IWCGLC0qqd/Channels-and-Docs)
- 侧栏：置顶 Channels 区（可拖拽排序）+ More Channels（字母序）；底部 Archive、"Shared with me"、Templates、Knowledge Management、Digests 等入口。
- **Collections（轻数据库）**：可嵌入任意文档的文档列表，属性支持 tags/people/link/date/number/checkbox，Table + Board（看板）两种视图；只管理条目、不承载正文。来源：[Collections](https://slite.com/help/8bd4HVVH-4KoaC/Collections-Databases)
- **新鲜度视觉信号**（产品特色）：侧栏文档名**加粗**=有未读动态；**淡出**=不活跃（约 70 天无动静且未验证）；**删除线**=已归档。来源：[Channels and Docs FAQ](https://slite.com/help/tjL2IWCGLC0qqd/Channels-and-Docs)

### 2.2 权限模型

- **用户角色 5 种**：Owner（唯一）/ Admin / Billing Admin / Member / Reader（只读简化体验，仅 Enterprise）。来源：[User Roles](https://slite.com/help/8YFftGfiLXr4qM/User-Roles)
- **频道**：Open（全员）或 Private（仅受邀）。
- **文档级权限**：默认级联继承父级，可单篇覆盖；角色为 Channel admin / Writer / Reader / No access；"Include subdocs" 开关控制子文档是否随动。Reader 可读、评论、管理验证、看历史与 insights。来源：[Doc Permissions](https://slite.com/help/revxa5CI8j1Hs4/Doc-Permissions)
- **访客（Guest）**：外部协作者免费，上限每付费席 5 名；只能看到被分享的文档；不可用 Ask、不可改权限。
- **用户组**：批量授权，新组员自动继承；guest 不能入组。
- **保护编辑（Protect Doc Editing）**：仅 Channel admin 可开；保护后顶部 PROTECTED 标签，Writer 点"Edit"解锁。防误编辑场景。来源：[Protect Doc Editing](https://slite.com/help/syfYt5sZgaYxGu/Protect-Doc-Editing)
- **邀请**：链接 / Google / Slack / 邮件批量；域名 auto-join；OpenID SSO（Pro+）、SCIM（Enterprise）。

---

## 3. 富文本编辑器（核心）

### 3.1 总览与文档模型

- 官方自述"lightweight editor"，提供在线 live 试用页（[slite.com/editor](https://slite.com/editor)）。全档位支持实时协同编辑（协同光标细节未文档化）。
- **文档模型**：类 ProseMirror 的 JSON AST（块 + marks）；对外提供 **SliteML** 序列化——"标准 Markdown 与 XML 标签的混合格式"，官方明确说选它是因为"JSON AST 对 AI 工作流太啰嗦、太耗 token"。**每个块有稳定 block ID**，API 支持 `modifyRange / appendBlocks / removeBlocks` 范围级精确改写。来源：[SliteML Reference](https://slite.com/help/gVdo4fnzxKZ-nN/SliteML-Reference)
- 2024-11 官方宣布更换编辑器底层技术（新旧栈名未公开）；早期曾基于 Slate.js。
- Sketch 白板基于 **Excalidraw**。来源：[Sketch](https://slite.com/help/n8t9WA0XvPn_GP/Sketch)

### 3.2 块类型完整清单

依据帮助中心 [Editor Blocks and Elements](https://slite.com/help/yT7vD3gkJhCy_Y/Editor-Blocks-and-Elements) 索引逐篇核实，共 8 类约 30 种。

**文本类**

| # | 块 | 关键规格 |
|---|---|---|
| 1 | 段落 | 默认块 |
| 2 | 标题 H1–H4 | H4 为 2024-07 新增；`Cmd/Ctrl+Shift+1..4` |
| 3 | 无序列表 | `- ` 触发 |
| 4 | 有序列表 | `1. ` 触发；Tab/Shift+Tab 缩进 |
| 5 | 任务清单 | `[] ` 触发；`Cmd/Ctrl+Shift+C` |
| 6 | 引用 | `> ` 触发 |
| 7 | 分割线 | `---` |
| 8 | 代码块 | 语言下拉、复制代码、自动换行开关、格式化缩进；可全宽展开；` ``` ` 或 `/code`；`Cmd+Shift+9` |
| 9 | 行内代码 | `Cmd/Ctrl+J`；`` ` `` 触发 |
| 10 | LaTeX 公式 | 块级（/latex、/math）与行内（`$...$`）双形态；点击编辑、方向键进出 |
| 11 | Mermaid 图表块 | 存在（更新日志多条），**插入方式未文档化** |

**结构类**

| # | 块 | 关键规格 |
|---|---|---|
| 12 | Hint（提示块） | 5 种预设（info 蓝/感叹橙/warning 红/对勾绿/自定义）+ 任意 emoji 图标；内部可放任何块；`!!`+空格 或 /hint；点左上角图标换样式 |
| 13 | 可折叠区块 Collapsible | 2025-10 上线；行首 `>>` 或 /命令；标题 + 内容区，可嵌套；**折叠时标题恒可见；刷新后保持折叠状态** |
| 14 | 多栏 Columns | 2026-04 上线；最多 4 栏；/column 或**直接把块拖到另一块左右边缘**（蓝色参考线成栏）；拖竖线调宽；三点半菜单 Make Editor Wider |
| 15 | 表格 | 见 3.6 |
| 16 | 目录 TOC | /outline 插入目录块（H1–H4 锚点跳转）；右上角按钮显示全文大纲 |
| 17 | Doc link | `@` 提及文档；**粘贴文档 URL 自动转 doc link** |
| 18 | Doc Card | /doc card；一行 1/2/3 张卡片；父文档 Badge 型封面自动带图；可转回 doc link |
| 19 | Directory Block | /directory 列出全部子文档；/generate 用 AI 自动分组（输出 doc cards + hint 摘要） |
| 20 | Collection 块 | /collection 新建或嵌入既有数据库（选视图） |

**媒体/文件类**

| # | 块 | 关键规格 |
|---|---|---|
| 21 | 图片 | 粘贴/拖拽/上传；≤20MB；悬停边缘箭头**调大小**；居中/全宽；多图拖一起成画廊（每行 3 张） |
| 22 | 视频 | .mov/.mp4；官方明言"Slite 不是存储服务"；可全屏、可画廊 |
| 23 | 文件附件 | /file 多选上传；/image、/file、/video 不选文件时生成**待填占位** |
| 24 | Sketch 白板 | /sketch；Excalidraw 内核；导入 <2MB 图片标注；导出图片/PDF |

**嵌入类**

| # | 块 | 关键规格 |
|---|---|---|
| 25 | Embed | /embed 粘贴链接；底层 Iframely（凡有公开预览的链接皆可嵌：表单/表格/视频/幻灯/白板/设计稿/项目管理/社媒帖）；**粘贴视频 URL 自动转嵌入**；可隐藏预览只留链接卡 |
| 26 | 认证嵌入 | Pro/Enterprise；支持的服务清单**未文档化** |

**辅助类**

| # | 块 | 关键规格 |
|---|---|---|
| 27 | 占位符 Placeholder | `Cmd/Ctrl+Alt+P` 把选中文字变占位样式；/somebody、/link to doc、/date 生成"待补人/链接/日期"；模板引导用 |
| 28 | 封面图 | Banner（2112×640）与 Badge（小徽章）两种版式；图源：官方图库/本地上传/Unsplash；封面同时用于 Doc Card 预览 |
| 29 | 文档图标 | Writer 可换 |
| 30 | 锚链接 | 任意块四点菜单 → Copy anchor link；另有 Copy block id（供 API/Zapier） |

**注意**：早期宣传的 Decision/Procedure/Context 专用结构化块**已不存在**于现行产品；等价物为模板库 + Hint + Collapsible + 表格 + 占位符的组合。

### 3.3 输入与命令体系

**斜杠菜单（/）**：行内输入 `/` 呼出全部可插入块，继续输入过滤，Return 插入，右侧显示对应快捷键。官方未发布完整清单页，以下为从各文档汇总：`/table /column /collapsible section /hint /code /latex(/math /formula) /sketch /embed /image /video /file /doc /link /doc card /directory /generate /collection /outline /toc /somebody /link to doc /date /summarize /ask`。

**Markdown 快捷输入**（行首 + 空格，来源：[Markdown & Keyboard Shortcuts](https://slite.com/help/VZddWZtRpXYz0I/Markdown-Keyboard-Shortcuts)）：

| 输入 | 结果 | 输入 | 结果 |
|---|---|---|---|
| `# `~`#### ` | H1–H4 | `**bold**` | 加粗 |
| `- ` | 无序列表 | `*italic*` | 斜体 |
| `1. ` | 有序列表 | `~text~` | 删除线 |
| `[] ` | 任务清单 | `` `code` `` | 行内代码 |
| `> ` | 引用 | `::highlight::` | 高亮 |
| `---` | 分割线 | `$formula$` | 行内公式 |
| `!! ` | Hint | `:` | emoji |
| `>> ` | Collapsible | | |

**键盘快捷键**（同上来源，节选核心）：

| 动作 | Mac | Windows |
|---|---|---|
| Undo/Redo | ⌘Z / ⌘⇧Z | Ctrl Z / Ctrl Y |
| 加粗/斜体/下划线 | ⌘B / ⌘I / ⌘U | 同 |
| 删除线 | ⌘⇧S | Ctrl ⇧S |
| 颜色/高亮 | ⌘E | Ctrl E |
| H1–H4 | ⌘⇧1..4 | Ctrl ⇧1..4 |
| 有序/无序列表 | ⌘⇧7 / ⌘⇧8 | Ctrl ⇧7 / ⇧8 |
| Checklist | ⌘⇧C | Ctrl ⇧C |
| 表格/无表头表格 | ⌘⌥S / ⌘⌥T | Ctrl Alt S / T |
| 行内代码/代码块 | ⌘J / ⌘⇧9 | Ctrl J / ⇧9 |
| 引用 / Hint | ⌘⇧> / ⌘⇧⌥H | Ctrl ⇧> / Alt H |
| 链接 | ⌘K | Ctrl K |
| 占位符 | ⌘⌥P | Ctrl Alt P |
| 行内评论 | ⌘⌥M | Ctrl Alt M |
| 复制文档链接 | ⌘L | Ctrl L |
| 块上/下移 | ⌥↑/↓ | Alt ↑/↓ |
| 列表缩进 | Tab / ⇧Tab | 同 |
| 查找替换 | ⌘F | Ctrl F |
| Ask | ⌘⇧K | Ctrl ⇧K |
| 全局唤起 Agent（桌面） | Alt+Space | 同 |

### 3.4 选区与内联格式工具栏

选中文字浮现工具栏，已确证选项：**Improve（AI 入口，紫色火花）**、加粗、斜体、下划线、删除线、行内代码、**文字颜色**（2024-09 上线，官方精选调色板，官网原话"Colors can ruin that (cough cough Word docs)"）、**高亮**（5 色：yellow/blue/green/pink/purple）、链接、评论气泡、转为 Collapsible；More 菜单内有占位符、Copy as Markdown。完整按钮清单官方无单页文档。

### 3.5 块操作

- **四点手柄**：每块左侧；按住拖拽排序；菜单含 Copy anchor link、Copy block id、删除。
- **空行工具栏**：光标置于空行时出现工具栏，点右侧 `>` 展开全部可建块（Slite 采用此模式而非 Notion 式左侧悬浮 `+` 按钮）。
- **文档级布局**：右上三点半菜单 → Edit Layout → Make Editor Wider / 封面图管理。
- 普通块的右键菜单、通用"Turn into"菜单无官方文档。

### 3.6 表格

来源：[Tables](https://slite.com/help/1VCnwAqLwWwSDh/Tables)

- 两种形态：**带表头结构化表格**（默认）与**无表头简易布局表**（`Cmd+Alt+T`，纯文本；可随时 Show Headers 切回）。
- **类型化列**：Rich Text / Checkbox / 单选 tag / 多选 tag / Number / People（@成员）/ Doc links / Link / Date。**明确不支持单元格内计算**（官方原文）。
- **不支持合并单元格**（官方原文）。
- 行列增删走右键上下文菜单；**列与行均可拖拽重排**；支持**冻结首列**；列头菜单 Sort（联动）；按列类型筛选、多列叠加；导出 CSV；整表复制到其他文档。
- 渲染持续打磨中（2026-01 "easier-to-read tables"）。**表格编辑是用户口碑中最大痛点之一**（见第 7 章）。

### 3.7 提及、链接与评论

来源：[Comments](https://slite.com/help/ecue2O_oVbFWM5/Comments)（2024-07 全量改版）

- `@` 提及成员与文档；被 @ 触发通知；**无反向链接（backlinks）功能**（官方无此功能页）。
- 评论两类：**全局评论**（整篇）+ **行内评论**（划词后点工具栏气泡或 `⌘⌥M`）。
- 评论面板（右上）：全局评论在前、行内按**文档顺序**排列；按 Unread / Open / Resolved 筛选。
- 线程交互：Resolve 解决；菜单含复制评论链接 / 编辑 / unfollow / 删除；**被删文字上的评论保留并显示摘录**；评论框 `↑` 键编辑自己最后一条；可贴图；`Shift+Return` 换行；**↑/↓ 箭头键在评论线程间跳转**。
- 通知：被 @、关注文档、写过该文档；邮件五档频率（从不/立即/每小时/每天/每周）。

### 3.8 版本历史与查找替换

- **历史**：三点半菜单 → History；编辑会话**5 分钟无活动生成一个版本**；底部滑杆精细回溯；Restore 恢复。**2026-05 重做：块级 + 词级 diff、每处改动标注是人还是 Agent（含 bot 图标）、minimap 快速跳转**。来源：[Document History](https://slite.com/help/t8mHPt4_I6MWe4/Document-History)
- **回收站**：无独立概念，等价物为 Archive（恢复或永久删除）。
- **查找替换**：`⌘F`；高亮全部匹配、箭头跳转；**自动展开命中处的折叠区**；Replace All；仅限当前文档。
- 拼写检查走系统/浏览器能力；编辑器全语言支持含 RTL；AI 翻译 16 种语言（先预览、可存为新文档）。

### 3.9 模板系统

来源：[Templates](https://slite.com/help/uaBTjGlgXAxOy0/Templates)

- 内置默认模板库 + 团队自定义模板；既有文档可 Save to templates。
- **子文档默认模板**：设置后新建子文档自动套用（顶部"Template attached"标识）。
- **定时自动建文档（Recurring docs）**：按周/双周/月自动生成子文档并通知参与者——周报、1:1、standup 场景。
- **标题日期变量**：`{date}`、`{date:+3days}` 等格式。

### 3.10 文档新鲜度机制（Slite 特色）

来源：[Doc Verification](https://slite.com/help/F9erHftuXmOHY0/Doc-Verification)、[Knowledge Management Panel](https://slite.com/help/_g08K8xDJLOGwA/Knowledge-Management-Panel)

- **文档验证**：5 状态——Verified（可设复核有效期）/ Verification expired / Outdated / Verification requested / 无状态。文档顶部状态栏操作：Mark as Verified（设复核日期，到期自动过期并通知 owner）/ Flag as Outdated（任何人）/ Request Verification / Clear Status。
- **排名效应**：Verified 文档在 Ask/搜索/Agent 中**排名更高**；Outdated **被 Agent 直接排除**。
- **Owner 制**：每篇文档有负责人；过期前 7 天、1 天、当天三次提醒；可把用户组设为 verifier。
- **知识管理面板**：管理员集中审计——按过时/空白/不活跃/公开等状态筛选，**批量**改验证状态、换 owner、归档，导出 CSV。
- **Ask Insights**：被举报答案 / 未命中问题 / 已解决三视图；管理员可"按现有文档重新生成答案"并指派队友跟进。
- **Slite Agent 自维护**（Pro，2026-06）：监控 20+ 连接工具，检测"文档与现实漂移"，**起草修订稿 → 人工 triage 队列（新旧 diff 并排）→ 批准后生效**；可对单篇做一次性事实核查或建例行监控。来源：[官方公告](https://slite.com/blog/slite-announcing-self-maintaining-knowledge-base)

### 3.11 导入导出

- 导入：Notion、Confluence、Google Drive、批量文件；强调保真度（行内公式、颜色、复杂格式）。
- 导出：单文档 PDF / Markdown / HTML / 打印；**不含评论与历史、不能批量导出**；PDF 含 Sketch 与 Mermaid（2026-03 起）。

---

## 4. AI 能力

### 4.1 Ask（跨库问答）

- 语义检索（非关键词）；编辑后约 10 分钟入索引；任意语言问、任意语言答；答案附来源文档；**严格按用户权限过滤**；内容不用于训练模型；检索片段仅发送给 Anthropic 处理（官方 FAQ 明示）。Guest 不可用。
- 计量：Basic 30 问/席/月；Pro 起被 Slite Agent 取代（跨 20+ 工具）。

### 4.2 编辑器内 AI 助手

来源：[Editor AI Assistant](https://slite.com/help/-7AkOaPbLmpYjD/Editor-AI-Assistant)（2026-03 重建，单次上限 64K tokens）

- **划词 → Improve**：预设操作 Fix spelling & grammar / Make shorter / Simplify language / Change tone / Improve formatting / Translate / **Quick improve（一键全做）**，或自定义 prompt。
- `/summarize`：任意位置生成整篇摘要（TL;DR）。
- `/ask`：**Ask on this doc**——文档内问答。
- `/generate`：AI 把子文档自动分组为目录（doc cards + hint 摘要块）。

### 4.3 Slite Agent 生态

- **数据源 17 类**（Slack/Linear/Jira/GitHub/Notion/Google Drive/…/Slite 自身），访问控制分 Shared（全工作区）与 Mirrored（按邮箱映射个人权限）；"每个查询继承用户权限"。
- **Agent workflows**：Digests（定时 AI 摘要发邮件/Slack）、Assistants（自然语言定义的可复用工作流）、Contextual Buttons（在 Intercom/Zendesk 等页面注入按钮执行动作）。
- **AI credits**：Pro 50/席/月共享池，月底清零；简单问答约 2 credits，一次 Digest 约 10 credits。

---

## 5. 协作与分享

- **分享给成员**：Share 菜单选角色；**Nudge**（轻提醒，进"Where you're needed"通知区）；`⌘L` 复制链接；分享到 Slack（rich unfurl 或 PDF）。
- **公开分享**：Share to web 开关；**公开链接可给 view 或 edit 权限**；含子文档开关；公开文档可开 AI 问答；"复制到我的 Slite"按钮；搜索引擎索引开关；**不支持密码/域名/IP 限制**（官方明示）；自定义域名（Pro+）。
- **集成**：Slack（bot 答疑、主动作答、channel 同步通知、敏感回答可撤回）；Zapier（Create/Update/Fetch/Replace/Ask Question 等动作，**无触发器**）；**官方 MCP Server**（api.slite.com/mcp，OAuth；工具覆盖搜索/读写/移动/归档/验证文档、管理 Collection、**读取与解决评论线程**、上传本机文件；客户端含 Claude、ChatGPT、Cursor、Gemini、Codex；MCP 改动在历史中带 bot 图标归因）；公开 API（read/write scopes、服务账号）。

---

## 6. 安全与合规

SOC 2 Type II、GDPR、HIPAA（Enterprise 可签 BAA）、EU hosting、SSO/SCIM/审计日志/2FA、承诺不训练模型。

---

## 7. 易用性口碑（编辑器视角）

来源：[G2](https://www.g2.com/products/slite/reviews)（4.7/5）、[Capterra](https://www.capterra.com/p/171199/Slite/reviews/)（4.7/5，约 42 条验证评论）

**正面**（高频词：轻、快、干净、零培训）：
- "文本界面和评论系统非常好用且简单，功能却够用"
- "写长内容的体验简单、无干扰"
- "惊艳的 UX/UI，比普通文档工具写作爽得多"
- 客户证言："80/20 法则的完美示范，没有废话，就是简单"

**负面**（集中且一致）：
- **表格编辑摩擦**（table edit、copy paste 被点名）
- **定制能力有限**（自定义选项少）
- Collections/表格功能有学习困惑；长文档性能/加载问题
- 文件夹结构固定、灵活性差

---

## 8. 对自研产品的借鉴

> 结合本产品"本地优先 + 内置/外接 Agent + PRD 与 HTML 原型闭环"的定位（见 2026-09 产品讨论）。

**值得直接采用（编辑器基线）**
1. **输入体系三件套**：斜杠菜单 + Markdown 快捷输入 + 选中工具栏，是易用性地板；第 3.3–3.4 的清单可直接当验收标准（Slite 口碑证明这套"轻交互"足以撑起 4.7 分）。
2. **空行工具栏模式**（而非 Notion 式悬浮 + 按钮）：更轻、实现更简单，与"lightweight"定位一致。
3. **稳定 block ID + 范围改写 API**（SliteML 的 modifyRange/appendBlocks/removeBlocks）：这正是"Agent 把生成结果块级写回文档"的技术样板——我们的 harness 应产出块 JSON 并按块 ID 增量改写，而不是整篇重写。
4. **人/Agent 改动归因 + diff + triage 队列**：Slite 把"Agent 起草、人批准"做成了产品机制（历史归因、Agent Triage）。我们的 accept/reject 流、原型版本对比应照此设计。
5. **文档新鲜度信号**（加粗/淡出/删除线 + 验证 + owner）：对 PRD 场景天然适配——"需求过期"比"知识过期"更痛，可低成本移植。

**应该差异化（不跟随）**
1. Slite 的 Embed 是**只读的 Iframely 预览**（嵌入别人的内容）；我们的核心块是**可生成的单文件 HTML 原型**（Agent 现场画、可迭代、与需求段落双向绑定）——这是 Slite 完全没有的能力。
2. Slite 的 AI 是云端订阅制（credits 计量、Anthropic 处理）；我们走本地 harness + BYO key，隐私话术与成本模型都不同。
3. Slite 取消了免费版；本地单机版天然可以做"个人永久免费"，作为获客钩子。

**要避开的坑**
1. **表格是 Slite 口碑最差的一环**（不能合并单元格、无计算、编辑摩擦）；我们的 PRD 场景（字段表、验收标准表）表格使用频率极高，要么把轻表格做到位，要么明确引导用列表/原型替代。
2. **复制粘贴保真度**差评集中——从第一天就把外部粘贴（Word/网页/飞书）的清洗规则当正式需求做。
3. **长文档性能**被点名——块模型从第一天做虚拟滚动/惰性渲染的架构预留。

---

## 9. 官方未文档化事项汇总

（PRD 中如涉及以下点，需自行定义规格，不能引用"Slite 也是这么做的"）

1. 实时协同的光标/选区显示、在线成员列表细节
2. 反向链接（backlinks）面板——**确认无此功能**
3. 斜杠命令的官方完整清单
4. 内联工具栏的完整按钮清单
5. 普通块的右键菜单内容
6. Notion 式独立 `+` 插入按钮——现为空行工具栏模式
7. 认证嵌入支持的服务清单（帮助文章为空壳）
8. Mermaid 块的插入命令
9. 移动 App 编辑器的能力边界
10. 旧 Decision/Procedure 专用块的移除公告（现行产品确认已不存在）

---

## References（关键来源）

- 官网/定价/编辑器试用：https://slite.com/ 、https://slite.com/pricing 、https://slite.com/editor
- 自维护知识库公告：https://slite.com/blog/slite-announcing-self-maintaining-knowledge-base
- 更新日志：https://slite.com/changelog
- 帮助中心关键文章：
  - 编辑器块索引：https://slite.com/help/yT7vD3gkJhCy_Y/Editor-Blocks-and-Elements
  - Markdown & 快捷键：https://slite.com/help/VZddWZtRpXYz0I/Markdown-Keyboard-Shortcuts
  - SliteML Reference：https://slite.com/help/gVdo4fnzxKZ-nN/SliteML-Reference
  - Editor AI Assistant：https://slite.com/help/-7AkOaPbLmpYjD/Editor-AI-Assistant
  - Doc Verification：https://slite.com/help/F9erHftuXmOHY0/Doc-Verification
  - Tables：https://slite.com/help/1VCnwAqLwWwSDh/Tables
  - Comments：https://slite.com/help/ecue2O_oVbFWM5/Comments
  - Document History：https://slite.com/help/t8mHPt4_I6MWe4/Document-History
  - Slite MCP：https://slite.com/help/lmeen-YwXupV23/Slite-MCP
  - 权限：https://slite.com/help/revxa5CI8j1Hs4/Doc-Permissions 、https://slite.com/help/8YFftGfiLXr4qM/User-Roles
- 口碑：https://www.g2.com/products/slite/reviews 、https://www.capterra.com/p/171199/Slite/reviews/
