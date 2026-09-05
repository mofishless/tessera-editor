import { VueRenderer } from '@tiptap/vue-3'
import type { Editor } from '@tiptap/vue-3'
import type { SuggestionProps, SuggestionKeyDownProps } from '@tiptap/suggestion'
import type { SlashMenuItem, TesseraTranslator } from '@tessera-editor/core'
import SlashMenu from './SlashMenu.vue'

/** Suggestion render factory for the Vue binding. */
export function createSlashRenderer(t: TesseraTranslator) {
  return () => {
    let renderer: VueRenderer | null = null
    let wrapper: HTMLDivElement | null = null

    return {
      onStart: (suggestionProps: SuggestionProps<SlashMenuItem>) => {
        renderer = new VueRenderer(SlashMenu, {
          props: { ...suggestionProps, t },
          editor: suggestionProps.editor as Editor,
        })
        if (!renderer.element) {
          return
        }
        wrapper = document.createElement('div')
        wrapper.className = 'tessera-slash-wrapper'
        wrapper.appendChild(renderer.element)
        document.body.appendChild(wrapper)
      },
      onUpdate: (suggestionProps: SuggestionProps<SlashMenuItem>) => {
        renderer?.updateProps({ ...suggestionProps, t })
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
