# 注入服务

Tessera 的设计原则（ADR-0001）：**组件自身零网络请求、零落盘**。一切外部能力由宿主通过 props 注入，编辑器从 `editor.storage.tesseraServices` 读取。

## UploadService（图片上传）

```ts
interface UploadService {
  uploadImage(file: File | Blob): Promise<{ url: string; name?: string; mime?: string }>
  uploadFile?(file: File | Blob): Promise<{ url: string; name?: string; mime?: string }>
}
```

注入后，编辑器的粘贴、拖拽与斜杠 /图片 三个入口都会走 `uploadImage`，插入返回的 URL。不注入则无上传能力（图片入口隐藏）。

## CommentStore + IdentityService（行内评论）

```ts
interface CommentThread {
  id: string
  quote: string
  resolved: boolean
  createdAt: number
  entries: { id: string; authorId: string; authorName: string; text: string; ts: number }[]
}
interface CommentStore {
  list(): Promise<CommentThread[]>
  upsert(thread: CommentThread): Promise<void>
  remove(id: string): Promise<void>
}
interface IdentityService {
  getCurrentUser(): { id: string; name: string } | null
}
```

注入后：划词 💬 或 ⌘⌥M 发评论；面板按文档序列线程，支持解决 / 重开 / 删除与 ↑↓ 跳转。文档中的评论锚点是 `comment` mark（`data-thread-id`），与线程数据一同持久化。

## 设计动机

不同宿主的模型供应商、密钥管理、审计与合规策略各不相同。组件绑死任何供给方都会毁掉通用性——因此 AI Runtime、上传、存储、身份全部走同一注入模式（见 [ADR-0001](/adr/0001-ai-runtime-injected-by-host)）。
