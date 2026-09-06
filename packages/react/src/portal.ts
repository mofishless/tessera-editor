import { useEffect, useState } from 'react'
import type { Editor } from '@tiptap/react'

/**
 * Floating UI (toolbars, menus, panels) must portal into the component root,
 * never document.body: the --te-* theme tokens — including host overrides and
 * the dark-theme hook — live on .tessera-root, so a body portal renders its
 * chrome with unresolved variables (transparent background, no shadow) and
 * outside the border-box reset.
 *
 * Mount-time resolution can run before EditorContent has inserted the
 * ProseMirror view into the document (closest() on a detached node = null),
 * so resolution is retried on the first editor events — which always precede
 * any floating UI being shown.
 */
export function useTesseraPortalRoot(editor: Editor): HTMLElement | null {
  const [target, setTarget] = useState<HTMLElement | null>(null)
  useEffect(() => {
    const resolve = () => {
      setTarget(prev => {
        if (prev && prev !== document.body) {
          return prev
        }
        return (editor.view.dom.closest('.tessera-root') as HTMLElement | null) ?? document.body
      })
    }
    resolve()
    editor.on('focus', resolve)
    editor.on('selectionUpdate', resolve)
    return () => {
      editor.off('focus', resolve)
      editor.off('selectionUpdate', resolve)
    }
  }, [editor])
  return target
}
