import { Extension, wrappingInputRule, markInputRule } from '@tiptap/core'

/**
 * Tessera-specific input rules beyond the StarterKit defaults:
 *   `[] ` + typing  → task list (mirrors Slite's trigger)
 *   `::text::`      → highlight mark
 */
export const TesseraInputRules = Extension.create({
  name: 'tesseraInputRules',

  addInputRules() {
    const taskList = this.editor.schema.nodes.taskList
    const highlight = this.editor.schema.marks.highlight
    const rules = []

    if (taskList) {
      rules.push(
        wrappingInputRule({
          find: /^\[\] $/,
          type: taskList,
        }),
      )
    }
    if (highlight) {
      rules.push(
        markInputRule({
          find: /::([^:]+)::$/,
          type: highlight,
        }),
      )
    }
    return rules
  },
})
