import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { cleanWordHtml, isWordHtml } from '../wordpaste'

/**
 * Word-source paste cleaning (acceptance §9, v1.1): when the pasted HTML is
 * detected as Word export, the rules table in wordpaste.ts runs before the
 * schema-based parse. Non-Word pastes pass through untouched.
 */
export const TesseraWordPaste = Extension.create({
  name: 'tesseraWordPaste',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('tesseraWordPaste'),
        props: {
          transformPastedHTML(html) {
            return isWordHtml(html) ? cleanWordHtml(html) : html
          },
        },
      }),
    ]
  },
})
