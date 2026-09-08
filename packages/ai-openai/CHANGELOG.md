# @tessera-editor/ai-openai

## 0.1.1

### Patch Changes

- @tessera-editor/ai@0.1.1

## 0.1.0

### Minor Changes

- 56cd1a2: Initial 0.1.0 release of the Tessera editor component family

  **@tessera-editor/core** — framework-agnostic engine on TipTap 3 / ProseMirror:

  - 30+ block types: headings, lists, task lists, quote, code, Hint (5 variants), Collapsible, image (width/align), typed-column tables (7 kinds + header menus + sort + CSV + frozen first column), sandboxed Embed, live TOC, placeholder marks
  - Input system: slash menu (24+ items, filtering, keyboard nav), Markdown triggers (`!!`, `>>`, `[]`, `::highlight::` + full standard set), empty-line toolbar, selection toolbar
  - Stable block IDs + write-back protocol (`modifyRange` / `appendBlocks` / `removeBlocks`, single transaction = single undo step)
  - Canonical JSON ↔ Markdown interchange (typed tables & structural blocks round-trip via semantic HTML)
  - Find & replace, block context menu, version-history snapshots + block/word-level diff, inline comment marks
  - i18n (zh-CN / en-US) and the Slite-style theme (`@tessera-editor/core/styles.css`, CSS-variable tokens)

  **@tessera-editor/react** — React 18+ binding with the full default UI (toolbars, panels, NodeViews, drag handle, IME-safe composition guards)

  **@tessera-editor/vue** — Vue 3 binding at full feature parity with the React binding

  **@tessera-editor/ai** — AI interaction skeleton: host-injected `AIRuntime` contract (the editor never performs network I/O), selection Improve (9 presets + custom instruction, streaming writes), /summarize, /ask, pending attribution marks with Accept / Reject triage (explicit rollback)

  **@tessera-editor/ai-openai** — `AIRuntime` adapter for OpenAI-compatible chat completion APIs (SSE streaming; OpenAI, DeepSeek, GLM, Moonshot, Ollama /v1, gateways)

  **@tessera-editor/ai-cli** — `AIRuntime` adapter driving local CLI agents from Node / Electron main processes (codex-style CLIs, JSON-lines parser included)

### Patch Changes

- Updated dependencies [56cd1a2]
  - @tessera-editor/ai@0.1.0
