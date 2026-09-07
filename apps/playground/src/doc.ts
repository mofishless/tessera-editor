export const initialDoc = {
  type: 'doc',
  content: [
    {
      type: 'heading',
      attrs: { level: 1 },
      content: [{ type: 'text', text: 'Tessera M0 交互 Spike' }],
    },
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: '这是一个验证「输入体系」的实验场。把光标放到下面的空行，' },
        { type: 'text', marks: [{ type: 'bold' }], text: '空行工具栏' },
        { type: 'text', text: '会浮现；悬停任何块左侧试试' },
        { type: 'text', marks: [{ type: 'bold' }], text: '四点手柄' },
        { type: 'text', text: '拖拽排序。' },
      ],
    },
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: '行内格式全家桶：' },
        { type: 'text', marks: [{ type: 'bold' }], text: '加粗' },
        { type: 'text', text: '、' },
        { type: 'text', marks: [{ type: 'italic' }], text: '斜体' },
        { type: 'text', text: '、' },
        { type: 'text', marks: [{ type: 'underline' }], text: '下划线' },
        { type: 'text', text: '、' },
        { type: 'text', marks: [{ type: 'strike' }], text: '删除线' },
        { type: 'text', text: '、' },
        { type: 'text', marks: [{ type: 'highlight', attrs: { color: '#fff2a8' } }], text: '高亮' },
        { type: 'text', text: '、' },
        { type: 'text', marks: [{ type: 'textStyle', attrs: { color: '#d9414f' } }], text: '颜色' },
        { type: 'text', text: '、' },
        { type: 'text', marks: [{ type: 'link', attrs: { href: 'https://slite.com' } }], text: '链接' },
        { type: 'text', text: '。' },
      ],
    },
    {
      type: 'hint',
      attrs: { variant: 'info' },
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: '提示块：在新行输入 ' },
            { type: 'text', marks: [{ type: 'code' }], text: '!! + 空格' },
            { type: 'text', text: ' 即可创建。内部可以放任何块。' },
          ],
        },
      ],
    },
    {
      type: 'collapsible',
      attrs: { open: true },
      content: [
        {
          type: 'collapsibleSummary',
          content: [{ type: 'text', text: '折叠块：输入 >> + 空格创建，点我折叠/展开' }],
        },
        {
          type: 'collapsibleContent',
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: '折叠状态下标题恒可见；折叠状态会随文档一起保存。' }],
            },
          ],
        },
      ],
    },
    {
      type: 'bulletList',
      content: [
        {
          type: 'listItem',
          content: [
            { type: 'paragraph', content: [{ type: 'text', text: '无序列表：- + 空格' }] },
          ],
        },
        {
          type: 'listItem',
          content: [
            { type: 'paragraph', content: [{ type: 'text', text: '有序列表：1. + 空格' }] },
          ],
        },
      ],
    },
    {
      type: 'taskList',
      content: [
        {
          type: 'taskItem',
          attrs: { checked: true },
          content: [{ type: 'paragraph', content: [{ type: 'text', text: '四点手柄拖拽 ✓' }] }],
        },
        {
          type: 'taskItem',
          attrs: { checked: false },
          content: [{ type: 'paragraph', content: [{ type: 'text', text: '中文输入法组合态安全' }] }],
        },
      ],
    },
    {
      type: 'codeBlock',
      attrs: { language: 'ts' },
      content: [
        { type: 'text', text: '// 代码块：``` 或工具栏插入\nconst tessera = createTessera({ theme: \'slite\' })' },
      ],
    },
    {
      type: 'table',
      attrs: { types: ['text', 'select', 'checkbox', 'date'], freezeFirstCol: true },
      content: [
        {
          type: 'tableRow',
          content: [
            { type: 'tableHeader', content: [{ type: 'paragraph', content: [{ type: 'text', text: '任务' }] }] },
            { type: 'tableHeader', content: [{ type: 'paragraph', content: [{ type: 'text', text: '状态' }] }] },
            { type: 'tableHeader', content: [{ type: 'paragraph', content: [{ type: 'text', text: '完成' }] }] },
            { type: 'tableHeader', content: [{ type: 'paragraph', content: [{ type: 'text', text: '日期' }] }] },
          ],
        },
        {
          type: 'tableRow',
          content: [
            { type: 'tableCell', content: [{ type: 'paragraph', content: [{ type: 'text', text: '类型化表格' }] }] },
            { type: 'tableCell', attrs: { value: ['进行中'] }, content: [{ type: 'paragraph' }] },
            { type: 'tableCell', attrs: { value: false }, content: [{ type: 'paragraph' }] },
            { type: 'tableCell', attrs: { value: '2026-09-10' }, content: [{ type: 'paragraph' }] },
          ],
        },
        {
          type: 'tableRow',
          content: [
            { type: 'tableCell', content: [{ type: 'paragraph', content: [{ type: 'text', text: '图片画廊' }] }] },
            { type: 'tableCell', attrs: { value: ['已完成'] }, content: [{ type: 'paragraph' }] },
            { type: 'tableCell', attrs: { value: true }, content: [{ type: 'paragraph' }] },
            { type: 'tableCell', attrs: { value: '2026-09-06' }, content: [{ type: 'paragraph' }] },
          ],
        },
      ],
    },
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: '表格：悬停表头点 ⌄ 换列类型/排序/插删列；右键行插删行；右键表格复制 CSV。' },
      ],
    },
    { type: 'paragraph', content: [] },
  ],
}
