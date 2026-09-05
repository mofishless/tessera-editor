# Tessera 编辑器组件家族

个人开源的富文本编辑器组件家族（MIT，公有 GitHub/npm）：定位为公司及外部各产品统一采用的编辑器能力，集成后功能、交互、界面一致，无需二次开发。宿主为 Web 与 Electron 桌面端，内置 AI 交互骨架。

## Language

**编辑器组件家族 (Family)**:
本项目的本体——核心引擎、框架绑定、AI 交互骨架与块包构成的整体。
_Avoid_: 组件库、插件（用于指代产品本体时）

**宿主 (Host)**:
集成编辑器组件家族的客户端应用（Web 或 Electron 桌面端）。
_Avoid_: 客户端、接入方

**核心 (Core)**:
与前端框架无关的编辑引擎，文档模型与写回协议的所在层。

**绑定 (Binding)**:
面向特定前端框架（React 18+ 优先、Vue 3 次之）的开箱即用封装。
_Avoid_: wrapper、适配层

**块 (Block)**:
文档的顶层内容单元（段落、标题、代码块等），每个块拥有稳定块 ID。
_Avoid_: 节点、元素

**块包 (Block Pack)**:
可选装的块集合，宿主按需引入（LaTeX、Mermaid、Collection 等）。
_Avoid_: 扩展包、模块

**插件 (Plugin)**:
宿主向组件注册自定义块、命令或菜单项的扩展机制；不指代产品本体。
_Avoid_: 用"插件"指代整个家族

**AI Runtime**:
由宿主注入的模型调用能力，覆盖各家 HTTP API 与本地 CLI（如 codex cli）两类供给。组件自身不发起网络请求。
_Avoid_: AI 服务、模型层

**AI Action**:
用户在编辑器内可触发的 AI 操作，如 Improve、summarize、ask。
_Avoid_: AI 功能

**写回协议 (Write-back)**:
以稳定块 ID 为基准的增量修改协议：改范围、追加块、删除块。AI 产物据此落进文档，而非整篇重写。
_Avoid_: 回填、生成

**输入体系三件套**:
斜杠菜单、Markdown 触发符、选中工具栏——编辑器易用性的地板配置。

**空行工具栏 (Empty-line Toolbar)**:
光标位于空行时浮现的插入工具栏（Slite 模式，非 Notion 式悬浮加号）。

**权威格式 (Canonical Format)**:
文档的权威 JSON 表示，含稳定块 ID 与归因信息；宿主按它持久化。
_Avoid_: 源格式、存储格式

**交换格式 (Interchange Format)**:
Markdown 表示，用于导入导出与外部工具互操作，由权威格式双向转换得到。
_Avoid_: 导出格式

**注入服务 (Injected Service)**:
宿主向组件提供的能力接口，如 AI Runtime、IdentityService、StorageService。组件对它们只有接口依赖。
_Avoid_: 后端、服务层
