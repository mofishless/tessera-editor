# JSON 为权威格式，Markdown 为交换格式

文档的权威格式是 JSON 文档模型（含稳定块 ID、AI 归因等结构信息），宿主按权威格式持久化；Markdown 作为交换格式（导入导出、Git diff 友好、可迁移到 Obsidian 等生态），由组件保证双向转换。纯 Markdown 为本的方案被否决：块 ID、归因、块级写回所需的结构信息无法稳定承载在 Markdown 上。AI 用的紧凑序列化（对标 SliteML，省 token）另行设计，从权威格式派生。
