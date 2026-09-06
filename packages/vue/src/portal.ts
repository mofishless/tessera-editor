import { onBeforeUnmount, onMounted, ref } from 'vue'
import type { Ref } from 'vue'
import type { Editor } from '@tiptap/core'

/**
 * Floating UI must portal into the component root instead of document.body:
 * the --te-* theme tokens — including host overrides and the dark-theme hook
 * — live on .tessera-root, so a body portal renders its chrome with
 * unresolved variables (transparent background, no shadow) and outside the
 * border-box reset.
 *
 * Mount-time resolution can run before EditorContent has inserted the
 * ProseMirror view into the document (closest() on a detached node = null),
 * so resolution is retried on the first editor events — which always precede
 * any floating UI being shown.
 */
export function useTesseraPortalRoot(editor: Editor): Ref<HTMLElement | null> {
  const target = ref<HTMLElement | null>(null)
  const resolve = () => {
    if (target.value && target.value !== document.body) {
      return
    }
    target.value = (editor.view.dom.closest('.tessera-root') as HTMLElement | null) ?? document.body
  }
  onMounted(resolve)
  editor.on('focus', resolve)
  editor.on('selectionUpdate', resolve)
  onBeforeUnmount(() => {
    editor.off('focus', resolve)
    editor.off('selectionUpdate', resolve)
  })
  return target
}
