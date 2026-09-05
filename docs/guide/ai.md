# AI 能力

Tessera 内置完整的 AI 交互骨架，模型调用能力（AIRuntime）由宿主注入——组件不发任何网络请求。

## AIRuntime 接口

```ts
interface AIRuntime {
  readonly id: string
  chat(input: {
    messages: { role: 'system' | 'user' | 'assistant'; content: string }[]
    stream?: {
      onToken?: (token: string) => void
      onDone?: (full: string) => void
      onError?: (error: Error) => void
      signal?: AbortSignal
    }
    temperature?: number
    maxTokens?: number
  }): Promise<string>
}
```

任何实现此接口的对象都可注入：HTTP API、本地 CLI Agent、测试桩。

## 官方适配器

### @tessera-editor/ai-openai — OpenAI 兼容 HTTP（SSE 流式）

适用于 OpenAI / DeepSeek / Moonshot / GLM / Ollama(/v1) / vLLM / one-api 网关等一切兼容端点：

```ts
import { createOpenAIRuntime } from '@tessera-editor/ai-openai'

const runtime = createOpenAIRuntime({
  baseUrl: 'https://api.openai.com/v1',
  apiKey: 'sk-...',
  model: 'gpt-4o-mini',
  fetchImpl: myFetch,        // 可选：Electron 主进程/代理/测试
  extraHeaders: { ... },     // 可选
})
```

### @tessera-editor/ai-cli — 本地 CLI Agent（Node/Electron 主进程）

驱动用户本机安装的 CLI（如 codex 类 Agent）。浏览器无法派生子进程——此适配器仅用于 Electron 主进程或 sidecar 守护进程：

```ts
import { createCliRuntime, jsonLinesParser } from '@tessera-editor/ai-cli'

const runtime = createCliRuntime({
  command: 'codex',
  buildArgs: prompt => ['exec', '--', prompt],   // 按你的 CLI 非交互模式定制
  parseLine: jsonLinesParser,                     // JSON-lines 事件流解析示例
  cwd: projectRoot,
  timeoutMs: 120_000,
})
```

## 内置 AI 动作

| 入口 | 动作 | 写回方式 |
|---|---|---|
| 划词 ✨ | Improve（9 预设 + 自定义指令） | 流式替换选区，pending 标记 |
| `/summarize` | 整篇 TL;DR | hint 块插入文档顶部，pending 标记 |
| `/ask` | 文档问答 | 纯对话面板，不写文档 |

所有写回都遵循「**Agent 起草、人批准**」：AI 产物带 `aiAttribution` mark（`data-pending`），审阅条提供：

- **接受** — pending 翻转为归因标记（点线样式），内容保留
- **拒绝** — 显式回滚到 AI 写入前的原文（不依赖 undo 栈）

归因元数据（action/ts）随权威 JSON 持久化，宿主可据此做 Slite 式「人 / Agent」改动区分。
