import { VueRenderer } from '@tiptap/vue-3'
import type { Editor } from '@tiptap/vue-3'
import type { SuggestionProps, SuggestionKeyDownProps } from '@tiptap/suggestion'
import type { EmojiItem } from '@tessera-editor/core'
import EmojiMenu from './EmojiMenu.vue'

/** Suggestion render factory for the emoji picker (Vue binding). */
export function createEmojiRenderer() {
  return () => {
    let renderer: VueRenderer | null = null
    let wrapper: HTMLDivElement | null = null

    return {
      onStart: (suggestionProps: SuggestionProps<EmojiItem>) => {
        renderer = new VueRenderer(EmojiMenu, {
          props: { ...suggestionProps },
          editor: suggestionProps.editor as Editor,
        })
        wrapper = document.createElement('div')
        wrapper.className = 'tessera-emoji-wrapper'
        if (renderer.element) {
          wrapper.appendChild(renderer.element)
        }
        // theme tokens live on .tessera-root — a body portal renders the
        // menu with unresolved (transparent) chrome
        const host = suggestionProps.editor.view.dom.closest('.tessera-root') ?? document.body
        host.appendChild(wrapper)
      },
      onUpdate: (suggestionProps: SuggestionProps<EmojiItem>) => {
        renderer?.updateProps({ ...suggestionProps })
      },
      onKeyDown: (props: SuggestionKeyDownProps) => {
        if (props.event.key === 'Escape') {
          wrapper?.remove()
          renderer?.destroy()
          renderer = null
          wrapper = null
          return true
        }
        return (renderer?.ref as { onKeyDown?: (p: SuggestionKeyDownProps) => boolean } | null)?.onKeyDown?.(props) ?? false
      },
      onExit: () => {
        wrapper?.remove()
        renderer?.destroy()
        renderer = null
        wrapper = null
      },
    }
  }
}
