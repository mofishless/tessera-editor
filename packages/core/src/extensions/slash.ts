import { Extension } from '@tiptap/core'
import type { Editor, Range } from '@tiptap/core'
import Suggestion from '@tiptap/suggestion'
import type { SuggestionOptions } from '@tiptap/suggestion'
import { PluginKey } from '@tiptap/pm/state'
import { createTesseraT, type TesseraLocale, type TesseraTranslator } from '../i18n'

/**
 * Slash menu (acceptance §1): framework-neutral extension built on
 * @tiptap/suggestion. The binding injects a `render` implementation; items are
 * data (title/description/shortcut/command) so React or Vue can render them.
 */

export interface SlashMenuItem {
  id: string
  group: 'basic' | 'advanced' | 'ai'
  title: string
  description?: string
  /** display-only hint, e.g. "⌘⇧9" */
  shortcut?: string
  keywords?: string[]
  command: (props: { editor: Editor; range: Range }) => void
}

export type SlashRenderFactory = SuggestionOptions<SlashMenuItem>['render']

export interface SlashMenuOptions {
  locale: TesseraLocale
  /** extra host items (e.g. AI actions registered by @tessera-editor/ai) */
  extraItems?: (ctx: { editor: Editor; t: TesseraTranslator }) => SlashMenuItem[]
  includeAiItems?: boolean
  render?: SlashRenderFactory
}

function chainDelete(editor: Editor, range: Range) {
  return editor.chain().focus().deleteRange(range)
}

/** Default block items — mirrors the Slite slash palette for the M1 scope. */
export function defaultSlashItems(t: TesseraTranslator): SlashMenuItem[] {
  return [
    {
      id: 'text',
      group: 'basic',
      title: t('itemText'),
      description: t('itemTextDesc'),
      keywords: ['text', 'paragraph', '文本', '段落'],
      command: ({ editor, range }) => chainDelete(editor, range).setParagraph().run(),
    },
    {
      id: 'h1',
      group: 'basic',
      title: t('itemH1'),
      shortcut: '⌘⇧1',
      keywords: ['heading', 'title', '标题'],
      command: ({ editor, range }) => chainDelete(editor, range).toggleHeading({ level: 1 }).run(),
    },
    {
      id: 'h2',
      group: 'basic',
      title: t('itemH2'),
      shortcut: '⌘⇧2',
      keywords: ['heading', 'title', '标题'],
      command: ({ editor, range }) => chainDelete(editor, range).toggleHeading({ level: 2 }).run(),
    },
    {
      id: 'h3',
      group: 'basic',
      title: t('itemH3'),
      shortcut: '⌘⇧3',
      keywords: ['heading', 'title', '标题'],
      command: ({ editor, range }) => chainDelete(editor, range).toggleHeading({ level: 3 }).run(),
    },
    {
      id: 'h4',
      group: 'basic',
      title: t('itemH4'),
      shortcut: '⌘⇧4',
      keywords: ['heading', 'title', '标题'],
      command: ({ editor, range }) => chainDelete(editor, range).toggleHeading({ level: 4 }).run(),
    },
    {
      id: 'bulletList',
      group: 'basic',
      title: t('itemBullet'),
      description: t('itemBulletDesc'),
      shortcut: '⌘⇧8',
      keywords: ['bullet', 'list', 'unordered', '列表'],
      command: ({ editor, range }) => chainDelete(editor, range).toggleBulletList().run(),
    },
    {
      id: 'orderedList',
      group: 'basic',
      title: t('itemOrdered'),
      description: t('itemOrderedDesc'),
      shortcut: '⌘⇧7',
      keywords: ['ordered', 'list', 'numbered', '列表'],
      command: ({ editor, range }) => chainDelete(editor, range).toggleOrderedList().run(),
    },
    {
      id: 'taskList',
      group: 'basic',
      title: t('itemTask'),
      description: t('itemTaskDesc'),
      shortcut: '⌘⇧C',
      keywords: ['task', 'todo', 'checkbox', '任务', '清单'],
      command: ({ editor, range }) => chainDelete(editor, range).toggleTaskList().run(),
    },
    {
      id: 'quote',
      group: 'basic',
      title: t('itemQuote'),
      description: t('itemQuoteDesc'),
      shortcut: '⌘⇧.',
      keywords: ['quote', 'blockquote', '引用'],
      command: ({ editor, range }) => chainDelete(editor, range).toggleBlockquote().run(),
    },
    {
      id: 'codeBlock',
      group: 'advanced',
      title: t('itemCode'),
      description: t('itemCodeDesc'),
      shortcut: '⌘⇧9',
      keywords: ['code', '代码'],
      command: ({ editor, range }) => chainDelete(editor, range).toggleCodeBlock().run(),
    },
    {
      id: 'divider',
      group: 'advanced',
      title: t('itemDivider'),
      description: t('itemDividerDesc'),
      keywords: ['divider', 'hr', 'rule', '分割线'],
      command: ({ editor, range }) => chainDelete(editor, range).setHorizontalRule().run(),
    },
    {
      id: 'hint',
      group: 'advanced',
      title: t('itemHint'),
      description: t('itemHintDesc'),
      shortcut: '⌘⌥H',
      keywords: ['hint', 'callout', 'info', '提示'],
      command: ({ editor, range }) => chainDelete(editor, range).setHint().run(),
    },
    {
      id: 'collapsible',
      group: 'advanced',
      title: t('itemCollapsible'),
      description: t('itemCollapsibleDesc'),
      keywords: ['collapsible', 'fold', 'details', '折叠'],
      command: ({ editor, range }) => chainDelete(editor, range).insertCollapsible().run(),
    },
    {
      id: 'image',
      group: 'advanced',
      title: t('itemImage'),
      description: t('itemImageDesc'),
      keywords: ['image', 'picture', 'photo', '图片'],
      command: ({ editor, range }) => {
        // no file dialog in core — emit for the binding (host opens picker)
        chainDelete(editor, range).run()
        editor.emit('tessera:insertImage', {})
      },
    },
    {
      id: 'table',
      group: 'advanced',
      title: t('itemTable'),
      description: t('itemTableDesc'),
      shortcut: '⌘⌥S',
      keywords: ['table', '表格'],
      command: ({ editor, range }) => chainDelete(editor, range).insertTableTyped({ withHeaderRow: true }).run(),
    },
    {
      id: 'table-simple',
      group: 'advanced',
      title: t('itemTableSimple'),
      description: t('itemTableSimpleDesc'),
      shortcut: '⌘⌥T',
      keywords: ['table', 'simple', '表格'],
      command: ({ editor, range }) => chainDelete(editor, range).insertTableTyped({ withHeaderRow: false }).run(),
    },
    {
      id: 'embed',
      group: 'advanced',
      title: t('itemEmbed'),
      description: t('itemEmbedDesc'),
      keywords: ['embed', 'iframe', '嵌入'],
      command: ({ editor, range }) => chainDelete(editor, range).insertEmbed({ src: '' }).run(),
    },
    {
      id: 'toc',
      group: 'advanced',
      title: t('itemToc'),
      description: t('itemTocDesc'),
      keywords: ['toc', 'outline', '目录', '大纲'],
      command: ({ editor, range }) => chainDelete(editor, range).insertToc().run(),
    },
  ]
}

export const SlashMenu = Extension.create<SlashMenuOptions>({
  name: 'tesseraSlashMenu',

  addOptions() {
    return {
      locale: 'zh-CN',
      extraItems: undefined,
      includeAiItems: false,
      render: undefined,
    }
  },

  addProseMirrorPlugins() {
    const editor = this.editor
    const options = this.options
    const t = createTesseraT(options.locale)

    const items = [
      ...defaultSlashItems(t),
      ...(options.extraItems?.({ editor, t }) ?? []),
    ]

    return [
      Suggestion({
        editor,
        pluginKey: new PluginKey('tesseraSlashMenu'),
        char: '/',
        startOfLine: true,
        items: ({ query }) => {
          const q = query.toLowerCase()
          if (!q) {
            return items
          }
          return items.filter(
            item =>
              item.title.toLowerCase().includes(q) ||
              item.id.toLowerCase().includes(q) ||
              item.keywords?.some(k => k.toLowerCase().includes(q)),
          )
        },
        command: ({ editor: e, range, props }) => {
          ;(props as SlashMenuItem).command({ editor: e, range })
        },
        render: options.render as SuggestionOptions<SlashMenuItem>['render'],
      }),
    ]
  },
})
