import { useMemo, useState } from 'react'
import type { Editor } from '@tiptap/react'
import { Tessera } from '@tessera-editor/react'
import type { TesseraLocale, UploadService, StorageService, CommentStore } from '@tessera-editor/core'
import { docToMarkdown, markdownToDoc } from '@tessera-editor/core'
import { createOpenAIRuntime } from '@tessera-editor/ai-openai'
import type { AIRuntime } from '@tessera-editor/ai'
import { createMockRuntime } from './mockRuntime'
import { createLocalStorage, createMemoryComments, demoIdentity } from './services'
import { initialDoc } from './doc'

type AiSource = 'mock' | 'openai' | 'off'

const mockUpload: UploadService = {
  uploadImage: file =>
    new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve({ url: String(reader.result), name: (file as File).name, mime: file.type })
      reader.onerror = () => reject(reader.error)
      reader.readAsDataURL(file)
    }),
}

/** live editor handle for panel-level operations (markdown import/export) */
let editorRef: Editor | null = null

const storage: StorageService = createLocalStorage()
const comments: CommentStore = createMemoryComments()

export default function App() {
  const [locale, setLocale] = useState<TesseraLocale>('zh-CN')
  const [docSize, setDocSize] = useState(0)
  const [aiSource, setAiSource] = useState<AiSource>('mock')
  const [openai, setOpenai] = useState({ baseUrl: 'https://api.openai.com/v1', model: 'gpt-4o-mini', apiKey: '' })
  const [mdDrawer, setMdDrawer] = useState<'import' | 'export' | null>(null)

  const runtime: AIRuntime | undefined = useMemo(() => {
    if (aiSource === 'mock') {
      return createMockRuntime()
    }
    if (aiSource === 'openai' && openai.apiKey.trim()) {
      return createOpenAIRuntime({ baseUrl: openai.baseUrl, model: openai.model, apiKey: openai.apiKey })
    }
    return undefined
  }, [aiSource, openai])

  return (
    <div className="page">
      <header className="page-header">
        <div className="logo">
          <span className="logo-mark">A</span>
          <span className="logo-name">Tessera</span>
        </div>
        <div className="sub">M1+M2 · TipTap 3.31 · React 18 · AI Runtime 注入式</div>
        <div className="header-actions">
          <button type="button" onClick={() => setLocale(l => (l === 'zh-CN' ? 'en-US' : 'zh-CN'))}>
            {locale === 'zh-CN' ? 'EN' : '中文'}
          </button>
          <select value={aiSource} onChange={e => setAiSource(e.target.value as AiSource)}>
            <option value="mock">AI: mock</option>
            <option value="openai">AI: OpenAI 兼容</option>
            <option value="off">AI: 关闭</option>
          </select>
        </div>
      </header>

      {aiSource === 'openai' ? (
        <div className="ai-config">
          <input value={openai.baseUrl} placeholder="Base URL" onChange={e => setOpenai(o => ({ ...o, baseUrl: e.target.value }))} />
          <input value={openai.model} placeholder="Model" onChange={e => setOpenai(o => ({ ...o, model: e.target.value }))} />
          <input
            type="password"
            value={openai.apiKey}
            placeholder="API Key（仅存于本页内存）"
            onChange={e => setOpenai(o => ({ ...o, apiKey: e.target.value }))}
          />
          {!openai.apiKey.trim() ? <span className="hint-text">填入 Key 后生效；未填时 AI 入口隐藏</span> : null}
        </div>
      ) : null}

      <main className="page-main">
        <div className="doc-card">
          <Tessera
            key={`${locale}-${aiSource}`}
            locale={locale}
            content={initialDoc}
            upload={mockUpload}
            storage={storage}
            comments={comments}
            identity={demoIdentity}
            historyIdleMs={90_000}
            ai={runtime}
            onUpdate={editor => setDocSize(JSON.stringify(editor.getJSON()).length)}
            onCreate={editor => {
              editorRef = editor
              ;(window as unknown as Record<string, unknown>).__tessera = editor
            }}
          />
        </div>
        <aside className="checklist">
          <h3>M1+M2 验证清单</h3>
          <ul>
            <li>斜杠菜单：<code>/</code> 唤起，过滤 + 键盘导航</li>
            <li>空行工具栏：光标置于空行浮现，<code>›</code> 展开全部块</li>
            <li>选中工具栏：划词 → 格式/颜色/高亮/链接/More</li>
            <li>触发符：<code>!!</code>、<code>&gt;&gt;</code>、<code>[]</code>、<code>::高亮::</code></li>
            <li>快捷键：⌘⇧1-4 / 7·8 / C、⌘J、⌘⇧9、⌘E、⌘K、⌘F、⌥↑↓</li>
            <li>四点手柄拖拽；图片粘贴/拖拽上传 + 调宽对齐</li>
            <li>AI（注入后）：划词 ✨ Improve、/summarize、/ask</li>
            <li>AI 产物紫色待审标记，审阅条 接受/拒绝（显式回滚）</li>
            <li>中文 IME 组合态安全（触发符不误发、UI 不闪烁）</li>
          </ul>
          <div className="md-tools">
            <button type="button" onClick={() => setMdDrawer('import')}>
              导入 Markdown
            </button>
            <button type="button" onClick={() => setMdDrawer('export')}>
              导出 Markdown
            </button>
            <button
              type="button"
              onClick={() => {
                if (editorRef) {
                  editorRef.emit('tessera:historyPanel', {})
                }
              }}
            >
              版本历史
            </button>
            <button
              type="button"
              onClick={() => {
                if (editorRef) {
                  editorRef.emit('tessera:commentPanel', {})
                }
              }}
            >
              评论
            </button>
          </div>
          <p className="meta">权威 JSON 大小：{docSize || '—'} 字符（宿主持有持久化）</p>
        </aside>
      </main>

      {mdDrawer ? (
        <div className="md-drawer">
          <div className="md-drawer-head">
            <span>{mdDrawer === 'import' ? '导入 Markdown（粘贴后应用）' : '导出 Markdown（交换格式）'}</span>
            <button type="button" onClick={() => setMdDrawer(null)}>
              ×
            </button>
          </div>
          <MdDrawer mode={mdDrawer} />
        </div>
      ) : null}
    </div>
  )
}

function MdDrawer({ mode }: { mode: 'import' | 'export' }) {
  const [text, setText] = useState('')
  const exported = mode === 'export' && editorRef ? docToMarkdown(editorRef.state.doc, editorRef.state.schema) : ''
  const value = mode === 'export' ? exported : text
  return (
    <>
      <textarea
        value={value}
        readOnly={mode === 'export'}
        placeholder={mode === 'import' ? '# 粘贴 Markdown…' : ''}
        onChange={e => setText(e.target.value)}
      />
      {mode === 'import' ? (
        <button
          type="button"
          className="apply"
          onClick={() => {
            if (!editorRef || !text.trim()) {
              return
            }
            editorRef.commands.setContent(markdownToDoc(text, editorRef.state.schema))
          }}
        >
          应用到编辑器
        </button>
      ) : (
        <button type="button" className="apply" onClick={() => navigator.clipboard.writeText(exported)}>
          复制
        </button>
      )}
    </>
  )
}
