import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Tessera',
  description: '个人开源的富文本编辑器组件家族——对标 Slite 体验，AI-ready，开箱即用',
  lang: 'zh-CN',
  // GitHub 项目页挂在仓库子路径下；本地 dev/preview 由 VitePress 自动处理
  base: '/tessera-editor/',
  themeConfig: {
    nav: [
      { text: '指南', link: '/guide/getting-started' },
      { text: '参考', link: '/reference/props' },
      { text: '决策', link: '/adr/0001-ai-runtime-injected-by-host' },
    ],
    sidebar: {
      '/guide/': [
        {
          text: '指南',
          items: [
            { text: '快速开始', link: '/guide/getting-started' },
            { text: '注入服务', link: '/guide/services' },
            { text: 'AI 能力', link: '/guide/ai' },
            { text: '数据与格式', link: '/guide/format' },
          ],
        },
      ],
      '/reference/': [
        {
          text: '参考',
          items: [
            { text: '组件 Props', link: '/reference/props' },
            { text: '架构与里程碑', link: '/product-definition' },
            { text: '行为验收清单', link: '/acceptance-checklist' },
          ],
        },
      ],
    },
    socialLinks: [{ icon: 'github', link: 'https://github.com/mofishless/tessera-editor' }],
  },
})
