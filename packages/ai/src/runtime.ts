/**
 * AIRuntime — the injected model capability (ADR-0001). The component family
 * never performs model I/O; hosts supply an implementation covering any HTTP
 * API or a local CLI agent (see @tessera-editor/ai-openai / @tessera-editor/ai-cli).
 */

export interface AiChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface AiStreamHandlers {
  onToken?: (token: string) => void
  onDone?: (full: string) => void
  onError?: (error: Error) => void
  signal?: AbortSignal
}

export interface AiChatInput {
  messages: AiChatMessage[]
  /** streaming handlers; runtimes that cannot stream deliver one final chunk */
  stream?: AiStreamHandlers
  /** optional hints; runtimes may ignore */
  temperature?: number
  maxTokens?: number
}

export interface AIRuntime {
  /** Human-readable identifier for attribution UI. */
  readonly id: string
  /** Run a chat completion; resolves with the full text. */
  chat(input: AiChatInput): Promise<string>
}

/** A runtime that immediately errors — used when none is injected. */
export const missingRuntime: AIRuntime = {
  id: 'missing',
  async chat() {
    throw new Error('Tessera: no AIRuntime injected')
  },
}
