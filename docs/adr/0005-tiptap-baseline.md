# 技术基座选 TipTap 3.x

`@tessera-editor/core` 以 TipTap（ProseMirror）为底座，锁 `~3.31`、季度升级窗口。2026-09 调研（`docs/research/editor-baseline-comparison-2026-09.md`）的三候选中，TipTap 是唯一同时满足以下条件的：React/Vue 3 双官方同版本发布；所需原语全 MIT（unique-id、drag-handle、suggestion、details、math 等 3.0 起开源）；headless 可完全自建 Slite 式 UI；AI 流式 + diff 开源参考实现最多；prosemirror-tables 支撑类型化列。我们的需求集（自建 UI、模型宿主注入、无协同）恰好避开其全部付费区。备选 BlockNote 仅在「React-only 且接受采购 XL 商业许可」前提下重启评估；Lexical 因 IME、Vue 缺位、表格最弱、0.x 破坏性变更出局。

## Consequences

- CI 维护依赖白名单，禁止引入 `@tiptap-cloud/*` 或私有 registry 包
- 块级写回 API（modifyRange/appendBlocks/removeBlocks 语义）需在 unique-id + node-range + transaction 之上自封装薄层
- 长文档虚拟化无现成方案，按「块 = NodeView 容器 + 视口外占位懒挂载」自研
- 已知 IME 残留点位（tiptap #6800/#7271/#5584/#6982）纳入第一周建立的 IME 回归矩阵
