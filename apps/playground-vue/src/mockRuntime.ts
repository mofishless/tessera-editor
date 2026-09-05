import type { AIRuntime } from '@tessera-editor/ai'

/**
 * Mock AIRuntime for offline playground demos: streams a canned but plausible
 * answer token-by-token so the full AI UX (streaming insert, suggestion bar,
 * accept/reject) can be exercised without keys.
 */

function improveReply(text: string, instruction: string): string {
  if (/shorter|缩短/i.test(instruction)) {
    return `精简版：${text.replace(/[，。]/g, m => (m === '，' ? '，' : '。')).slice(0, Math.max(12, Math.floor(text.length * 0.6)))}（mock·缩短）`
  }
  if (/translate.*english|翻译为英文/i.test(instruction)) {
    return `[EN·mock] ${text} — rewritten in English by the mock runtime.`
  }
  if (/professional|专业/i.test(instruction)) {
    return `（专业语气·mock）${text}`
  }
  return `（AI 优化·mock）${text} —— 表达更清晰、语法更准确。`
}

export function createMockRuntime(): AIRuntime {
  return {
    id: 'mock',
    async chat(input) {
      const last = input.messages[input.messages.length - 1]?.content ?? ''
      const system = input.messages[0]?.content ?? ''
      let reply: string
      if (system.includes('writing assistant')) {
        const m = /\n\nText:\n([\s\S]+)$/.exec(last)
        const instruction = /Instruction: (.*)/.exec(last)?.[1] ?? ''
        reply = improveReply((m?.[1] ?? '').trim(), instruction)
      } else if (system.includes('Summarize')) {
        reply =
          '本文档演示了 Tessera 的 M0–M2 能力：Slite 风格的输入体系（斜杠菜单、Markdown 触发符、空行工具栏）、块级拖拽、Hint 与折叠块、查找替换、图片上传，以及注入式 AI（改写/摘要/问答）。（mock 摘要）'
      } else {
        reply =
          '根据文档内容（mock 回答）：Tessera 是个人开源的富文本编辑器组件家族，AI Runtime 由宿主注入，组件自身不发网络请求。你可以把 AI 源切到 OpenAI 兼容模式获得真实回答。'
      }

      // stream ~3 chars per tick
      let sent = ''
      for (let i = 0; i < reply.length; i += 3) {
        const token = reply.slice(i, i + 3)
        sent += token
        input.stream?.onToken?.(token)
        await new Promise(resolve => setTimeout(resolve, 24))
      }
      input.stream?.onDone?.(sent)
      return sent
    },
  }
}
