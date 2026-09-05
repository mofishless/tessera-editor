import type { AiChatInput, AIRuntime } from '@tessera-editor/ai'

/**
 * OpenAI-compatible AIRuntime: works with OpenAI, DeepSeek, Moonshot, GLM,
 * Ollama (/v1), vLLM, one-api gateways — anything speaking
 * POST {baseUrl}/chat/completions with SSE streaming.
 */

export interface OpenAIRuntimeOptions {
  /** e.g. https://api.openai.com/v1 */
  baseUrl: string
  apiKey?: string
  model: string
  /** custom fetch (Electron main, proxies, tests) */
  fetchImpl?: typeof fetch
  extraHeaders?: Record<string, string>
}

export function createOpenAIRuntime(options: OpenAIRuntimeOptions): AIRuntime {
  const url = `${options.baseUrl.replace(/\/$/, '')}/chat/completions`
  const doFetch = options.fetchImpl ?? fetch

  return {
    id: `openai-compatible:${options.model}`,
    async chat(input: AiChatInput): Promise<string> {
      const response = await doFetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(options.apiKey ? { Authorization: `Bearer ${options.apiKey}` } : {}),
          ...options.extraHeaders,
        },
        body: JSON.stringify({
          model: options.model,
          messages: input.messages.map(m => ({ role: m.role, content: m.content })),
          stream: true,
          ...(input.temperature !== undefined ? { temperature: input.temperature } : {}),
          ...(input.maxTokens !== undefined ? { max_tokens: input.maxTokens } : {}),
        }),
        signal: input.stream?.signal,
      })

      if (!response.ok) {
        throw new Error(`Tessera openai runtime: HTTP ${response.status} ${await response.text().catch(() => '')}`)
      }
      if (!response.body) {
        throw new Error('Tessera openai runtime: empty response body')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let full = ''

      for (;;) {
        const { done, value } = await reader.read()
        if (done) {
          break
        }
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''
        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed.startsWith('data:')) {
            continue
          }
          const payload = trimmed.slice(5).trim()
          if (payload === '[DONE]') {
            continue
          }
          try {
            const json = JSON.parse(payload) as {
              choices?: { delta?: { content?: string }; message?: { content?: string } }[]
            }
            const token = json.choices?.[0]?.delta?.content ?? json.choices?.[0]?.message?.content ?? ''
            if (token) {
              full += token
              input.stream?.onToken?.(token)
            }
          } catch {
            // partial JSON or keep-alive comment — ignore
          }
        }
      }

      input.stream?.onDone?.(full)
      return full
    },
  }
}
