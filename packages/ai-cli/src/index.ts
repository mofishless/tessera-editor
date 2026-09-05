import { spawn } from 'node:child_process'
import type { AiChatInput, AIRuntime } from '@tessera-editor/ai'

/**
 * Local-CLI AIRuntime for Node hosts (Electron main process or a sidecar
 * daemon — the browser cannot spawn processes; ADR/consensus §4). Drives any
 * CLI agent that reads a prompt and streams plain text on stdout.
 */

export interface CliRuntimeOptions {
  /** executable, e.g. "codex" */
  command: string
  /**
   * Build CLI args from the prompt. Default: ["exec", "--", prompt] —
   * override to match your CLI's non-interactive mode.
   */
  buildArgs?: (prompt: string) => string[]
  /**
   * Map one stdout line to a token (return null to skip). Default: emit the
   * line + newline as-is; JSON-lines agents should parse their event shape
   * and return the text delta.
   */
  parseLine?: (line: string) => string | null
  cwd?: string
  env?: Record<string, string>
  timeoutMs?: number
}

function defaultBuildArgs(prompt: string): string[] {
  return ['exec', '--', prompt]
}

function defaultParseLine(line: string): string | null {
  return line.length > 0 ? line : null
}

export function createCliRuntime(options: CliRuntimeOptions): AIRuntime {
  const buildArgs = options.buildArgs ?? defaultBuildArgs
  const parseLine = options.parseLine ?? defaultParseLine

  return {
    id: `cli:${options.command}`,
    async chat(input: AiChatInput): Promise<string> {
      const prompt = input.messages
        .map(m => (m.role === 'system' ? `[system] ${m.content}` : m.content))
        .join('\n\n')
      const signal = input.stream?.signal

      return await new Promise<string>((resolve, reject) => {
        const child = spawn(options.command, buildArgs(prompt), {
          cwd: options.cwd,
          env: { ...process.env, ...options.env },
          shell: process.platform === 'win32',
        })

        let full = ''
        let stderr = ''
        let buffer = ''

        const onLine = (raw: string) => {
          for (const token of [parseLine(raw)]) {
            if (token !== null) {
              full += token
              input.stream?.onToken?.(token)
            }
          }
        }

        child.stdout.setEncoding('utf8')
        child.stdout.on('data', (chunk: string) => {
          buffer += chunk
          const lines = buffer.split('\n')
          buffer = lines.pop() ?? ''
          for (const line of lines) {
            onLine(line)
            full += '\n'
            input.stream?.onToken?.('\n')
          }
        })
        child.stderr.setEncoding('utf8')
        child.stderr.on('data', (chunk: string) => {
          stderr += chunk
        })

        const timer = options.timeoutMs
          ? setTimeout(() => child.kill(), options.timeoutMs)
          : undefined

        signal?.addEventListener('abort', () => child.kill())

        child.on('error', err => {
          if (timer) clearTimeout(timer)
          reject(err)
        })
        child.on('close', code => {
          if (timer) clearTimeout(timer)
          if (buffer) {
            onLine(buffer)
          }
          if (code !== 0 && !full) {
            input.stream?.onError?.(new Error(`Tessera cli runtime exited ${code}: ${stderr.slice(0, 400)}`))
            reject(new Error(`Tessera cli runtime exited ${code}: ${stderr.slice(0, 400)}`))
            return
          }
          input.stream?.onDone?.(full)
          resolve(full)
        })
      })
    },
  }
}

/** Example parseLine for JSON-lines agents emitting {"type":"message","text":...} */
export function jsonLinesParser(line: string): string | null {
  try {
    const json = JSON.parse(line) as { type?: string; text?: string; delta?: string }
    if (json.type === 'message' || json.type === 'assistant') {
      return json.text ?? json.delta ?? null
    }
    return json.delta ?? null
  } catch {
    return line.length > 0 ? line : null
  }
}
