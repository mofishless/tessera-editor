import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'

import type { Node as ProseMirrorNode } from '@tiptap/pm/model'
import { Decoration, DecorationSet } from '@tiptap/pm/view'
import type { DecorationAttrs } from '@tiptap/pm/view'

/**
 * Image gallery (acceptance §6, v1.1): runs of two or more consecutive
 * top-level image blocks are flagged with data-gallery attributes so the
 * theme can lay them out three per row (CSS: inline-block thirds).
 * Purely presentational — the document format is unchanged (still
 * sibling imageBlock nodes), so Markdown/JSON round-trips are unaffected.
 */

export const galleryKey = new PluginKey('tesseraGallery')

interface GalleryRun {
  from: number
  to: number
  size: number
}

/** Shared run detection so tests and the plugin agree on the definition. */
export function findGalleryRuns(doc: ProseMirrorNode): GalleryRun[] {
  const runs: GalleryRun[] = []
  let start = -1
  let size = 0
  doc.forEach((node, offset) => {
    if (node.type.name === 'imageBlock') {
      if (start < 0) {
        start = offset
        size = 0
      }
      size += 1
    } else if (start >= 0) {
      if (size >= 2) {
        runs.push({ from: start, to: offset, size })
      }
      start = -1
      size = 0
    }
  })
  if (start >= 0 && size >= 2) {
    runs.push({ from: start, to: doc.content.size, size })
  }
  return runs
}

function galleryDecorations(doc: ProseMirrorNode): DecorationSet {
  const decorations: Decoration[] = []
  for (const run of findGalleryRuns(doc)) {
    let index = 0
    doc.nodesBetween(run.from, run.to, (node: ProseMirrorNode, pos: number) => {
      if (node.type.name !== 'imageBlock') {
        return false
      }
      const attrs: DecorationAttrs = {
        'data-gallery': 'true',
        'data-gallery-index': String(index),
        'data-gallery-size': String(run.size),
      }
      decorations.push(Decoration.node(pos, pos + node.nodeSize, attrs))
      index += 1
      return false
    })
  }
  // props.decorations must yield a DecorationSet — a plain array breaks
  // DecorationGroup.from (it flattens only set members)
  return DecorationSet.create(doc, decorations)
}

export const TesseraGallery = Extension.create({
  name: 'tesseraGallery',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: galleryKey,
        state: {
          init: (_config, state) => galleryDecorations(state.doc),
          apply: (tr, old) => (tr.docChanged ? galleryDecorations(tr.doc) : old),
        },
        props: {
          decorations(state) {
            return galleryKey.getState(state)
          },
        },
      }),
    ]
  },
})

/**
 * Read the gallery attributes (if any) a NodeView should apply for `node`:
 * finds the node decoration covering `pos` that carries data-gallery attrs.
 * NodeViews must apply these themselves — custom NodeViews bypass PM's
 * automatic decoration-attr application.
 */
export function galleryAttrsFor(
  decorations: readonly Decoration[],
  pos: number,
): DecorationAttrs | null {
  for (const deco of decorations) {
    const attrs = (deco as unknown as { type?: { attrs?: DecorationAttrs } }).type?.attrs
    if (attrs && 'data-gallery' in attrs && deco.from <= pos && pos <= deco.to) {
      return attrs
    }
  }
  return null
}
